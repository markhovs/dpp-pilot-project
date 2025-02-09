import json
import uuid

from basyx.aas import model

from app.aas.serialization import serialize_aas_to_json
from app.aas.template_loader import import_aasx_package, list_template_packages

# In-memory storage for AAS instances (to be later replaced with your PostgreSQL/JSONB storage)
aas_storage: dict[str, model.AssetAdministrationShell] = {}


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
      - "asset_kind": to set the asset kind (INSTANCE or TYPE).

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
    selected_template_ids: list[str], asset_data: dict = None
) -> dict:
    """
    Create a new AAS asset by attaching submodels chosen by the admin.

    The admin provides a list of selected template IDs (obtained from list_templates()).
    For each template ID, the function locates the corresponding AASX package, imports the submodel(s),
    and attaches them as ModelReferences to the new AAS.

    Args:
        selected_template_ids: A list of template IDs (strings) representing the chosen submodels.
        asset_data: Optional dict with asset metadata.

    Returns:
        A dictionary representation of the created AAS asset.
    """
    new_aas = create_new_aas(asset_data)

    # Build a mapping from template_id to template_path.
    templates = list_templates()
    template_mapping = {
        tmpl["template_id"]: tmpl["template_path"] for tmpl in templates
    }

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
        # Attach all submodels found in the package.
        submodels = [obj for obj in object_store if isinstance(obj, model.Submodel)]
        for submodel in submodels:
            new_aas.submodel.add(model.ModelReference.from_referable(submodel))

    # Store the new asset in our in-memory storage.
    aas_storage[new_aas.id] = new_aas
    return json.loads(serialize_aas_to_json(new_aas))


def get_all_assets() -> list[dict]:
    """
    Return all stored AAS assets as dictionaries.
    """
    return [json.loads(serialize_aas_to_json(aas)) for aas in aas_storage.values()]


def get_asset_by_id(aas_id: str) -> dict:
    """
    Retrieve a specific AAS asset by its unique identifier.

    Args:
        aas_id: The unique identifier of the AAS.

    Returns:
        A dictionary representation of the AAS asset.
    """
    aas_instance = aas_storage.get(aas_id)
    if not aas_instance:
        raise ValueError(f"No AAS found with id {aas_id}")
    return json.loads(serialize_aas_to_json(aas_instance))


if __name__ == "__main__":
    # List available templates.
    print("=== Available Submodel Templates ===")
    templates = list_templates()
    for idx, tmpl in enumerate(templates, start=1):
        print(f"{idx}. {tmpl['template_name']} (Category: {tmpl['category']})")
        print(f"   Template ID: {tmpl['template_id']}")
        print(f"   idShort: {tmpl['id_short']}")
        print(f"   Description: {tmpl.get('description')}")
        print(f"   Template Path: {tmpl['template_path']}")
        print("-" * 40)

    # Simulate an admin picking one or more templates.
    if templates:
        # For demonstration, select the first template.
        selected_ids = [templates[0]["template_id"], templates[1]["template_id"]]
        new_asset = create_asset_from_submodel_templates(
            selected_template_ids=selected_ids,
            asset_data={
                "global_asset_id": "http://test.com/test_asset",
                "asset_kind": model.AssetKind.TYPE,
                "id": "https://test.com/test_aas",
            },
        )
        print("\n=== Created AAS Asset ===")
        print(json.dumps(new_asset, indent=4))

    print("\n=== Stored AAS Assets ===")
    for asset in get_all_assets():
        print(json.dumps(asset, indent=4))
