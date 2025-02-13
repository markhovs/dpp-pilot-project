import json
import uuid

from basyx.aas import model

# Import the Session type and SQLModel select helper.
from sqlmodel import Session, select

from app.aas.serialization import serialize_aas_to_json
from app.aas.template_loader import import_aasx_package, list_template_packages

# Import your AASAsset database model from your models module.
from app.models import AASAsset


def list_templates() -> list[dict]:
    """
    Return a list of available submodel templates (with metadata) as discovered by the template loader.
    """
    return list_template_packages()


def create_new_aas(asset_data: dict = None) -> model.AssetAdministrationShell:
    """
    Create a new minimal AAS instance with asset information.

    asset_data (optional) may contain:
      - "id": a custom AAS id (otherwise a unique one is generated),
      - "global_asset_id": to override the default assetInformation global_asset_id,
      - "asset_kind": to set the asset kind (e.g. INSTANCE or TYPE).

    Returns:
        A new AssetAdministrationShell instance.
    """
    asset_data = asset_data or {}
    new_id = asset_data.get("id") or f"https://dpp-pilot.com/aas/{uuid.uuid4().hex}"
    asset_info = model.AssetInformation(
        asset_kind=asset_data.get("asset_kind", model.AssetKind.INSTANCE),
        global_asset_id=asset_data.get(
            "global_asset_id", "http://dpp-pilot.com/default_asset"
        ),
    )
    new_aas = model.AssetAdministrationShell(id_=new_id, asset_information=asset_info)
    return new_aas


def create_asset_from_submodel_templates(
    selected_template_ids: list[str], asset_data: dict = None, session: Session = None
) -> dict:
    """
    Create a new AAS asset by attaching submodels chosen by the admin.

    The admin provides a list of selected template IDs (obtained from list_templates()). For each template ID,
    the function locates the corresponding AASX package, imports its submodel(s), and attaches them as
    ModelReferences to the new AAS.

    Args:
        selected_template_ids: A list of template IDs representing the chosen submodels.
        asset_data: Optional dict with asset metadata.
        session: A SQLModel Session for database persistence.

    Returns:
        A dictionary representation of the created AAS asset.
    """
    if session is None:
        raise ValueError("A valid database session must be provided.")

    # Create the minimal AAS.
    new_aas = create_new_aas(asset_data)

    # Build a mapping from template ID to template path.
    templates = list_templates()
    template_mapping = {
        tmpl["template_id"]: tmpl["template_path"] for tmpl in templates
    }

    # For each selected template, import its package and attach all submodels.
    for template_id in selected_template_ids:
        if template_id not in template_mapping:
            raise ValueError(
                f"Template with id {template_id} not found among available templates."
            )
        package_path = template_mapping[template_id]
        try:
            object_store, _, _ = import_aasx_package(package_path)
        except Exception as e:
            print(f"Error importing submodel from template {template_id}: {e}")
            continue
        # Look for Submodel objects in the imported package.
        submodels = [obj for obj in object_store if isinstance(obj, model.Submodel)]
        for submodel in submodels:
            new_aas.submodel.add(model.ModelReference.from_referable(submodel))

    # Serialize the new AAS to JSON.
    aas_json = json.loads(serialize_aas_to_json(new_aas))

    # Create a new AASAsset record with the AAS data.
    aas_record = AASAsset(id=new_aas.id, data=aas_json)
    session.add(aas_record)
    session.commit()
    session.refresh(aas_record)

    return aas_record.data


def get_all_assets(session: Session) -> list[dict]:
    """
    Retrieve all stored AAS assets from the database as dictionaries.

    Args:
        session: A SQLModel Session for database operations.

    Returns:
        A list of AAS assets (each as a dict).
    """
    statement = select(AASAsset)
    results = session.exec(statement).all()
    return [record.data for record in results]


def get_asset_by_id(aas_id: str, session: Session) -> dict:
    """
    Retrieve a specific AAS asset by its unique identifier from the database.

    Args:
        aas_id: The unique identifier of the AAS.
        session: A SQLModel Session for database operations.

    Returns:
        A dictionary representation of the AAS asset.
    """
    aas_record = session.get(AASAsset, aas_id)
    if not aas_record:
        raise ValueError(f"No AAS found with id {aas_id}")
    return aas_record.data


# # For testing the persistence layer from the command line.
# if __name__ == "__main__":
#     from app.core.db import engine, get_session  # Adjust import paths as needed.

#     with get_session() as session:
#         # List available templates.
#         print("=== Available Submodel Templates ===")
#         templates = list_templates()
#         for idx, tmpl in enumerate(templates, start=1):
#             print(f"{idx}. {tmpl['template_name']} (Category: {tmpl['category']})")
#             print(f"   Template ID: {tmpl['template_id']}")
#             print(f"   idShort: {tmpl['id_short']}")
#             print(f"   Description: {tmpl.get('description')}")
#             print(f"   Template Path: {tmpl['template_path']}")
#             print("-" * 40)

#         # Simulate an admin picking one or more submodel templates.
#         if templates:
#             # For demonstration, select two templates.
#             selected_ids = [templates[0]["template_id"]]
#             new_asset = create_asset_from_submodel_templates(
#                 selected_template_ids=selected_ids,
#                 asset_data={
#                     "global_asset_id": "http://test.com/test_asset",
#                     "asset_kind": model.AssetKind.TYPE,  # Adjust as needed.
#                     "id": "https://test.com/test_aas",
#                 },
#                 session=session,
#             )
#             print("\n=== Created AAS Asset ===")
#             print(json.dumps(new_asset, indent=4))

#         # List all persisted assets.
#         all_assets = get_all_assets(session)
#         print("\n=== All Persisted AAS Assets ===")
#         print(json.dumps(all_assets, indent=4))
