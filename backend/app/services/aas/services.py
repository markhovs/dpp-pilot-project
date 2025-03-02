import json
from datetime import datetime

from basyx.aas import model
from basyx.aas.util.identification import UUIDGenerator
from basyx.aas.util.traversal import walk_submodel
from sqlmodel import Session, select

from app.models import AASAsset, AASSubmodel
from app.services.aas.serialization import (
    deserialize_aas_from_json,
    serialize_aas_to_json,
)
from app.services.aas.template_loader import import_aasx_package, list_template_packages
from app.services.aas.utils import convert_value

# Initialize a UUID generator (could be injected/configured as needed)
uuid_gen = UUIDGenerator()


def list_templates() -> list[dict]:
    """
    Return a list of available submodel templates as discovered via the template loader.
    """
    return list_template_packages()


def instantiate_submodel(template: model.Submodel) -> model.Submodel:
    """
    Instantiate a submodel from a template.
    """
    # Ensure administrative information exists.
    if template.administration is None:
        template.administration = model.AdministrativeInformation()

    # Store the original template id in the template_id field.
    template.administration.template_id = template.id

    # Generate a new unique identifier for the instance.
    new_id = uuid_gen.generate_id()
    template.id = new_id
    template.kind = model.ModellingKind.INSTANCE
    return template


def create_asset_from_templates(
    selected_template_ids: list[str], asset_data: dict, session: Session
) -> dict:
    """
    Create a new AAS asset by instantiating submodels from selected templates.
    """
    # 1. Create a new AAS shell with a generated identifier.
    new_aas_id = uuid_gen.generate_id()
    aas_shell = model.AssetAdministrationShell(
        id_=new_aas_id,
        asset_information=model.AssetInformation(
            global_asset_id=asset_data.get("global_asset_id", "urn:default:global"),
            asset_kind=model.AssetKind.INSTANCE,
        ),
    )

    if "description" in asset_data:
        aas_shell.description = [{"language": "en", "text": asset_data["description"]}]
    if "display_name" in asset_data:
        aas_shell.display_name = [
            {"language": "en", "text": asset_data["display_name"]}
        ]

    templates = list_template_packages()
    template_map = {tmpl["template_id"]: tmpl for tmpl in templates}
    instantiated_submodels = []

    for tmpl_id in selected_template_ids:
        if tmpl_id not in template_map:
            raise ValueError(f"Template with id '{tmpl_id}' not found.")
        tmpl = template_map[tmpl_id]
        package_path = tmpl["template_path"]

        # 2a. Load the AASX package.
        object_store, _, _ = import_aasx_package(package_path)

        # 2b. For each Submodel in the package, instantiate a new instance.
        for obj in object_store:
            if isinstance(obj, model.Submodel):
                instance = instantiate_submodel(obj)
                instantiated_submodels.append(instance)
                # 2c. Attach this submodel to the AAS shell using a ModelReference.
                aas_shell.submodel.add(model.ModelReference.from_referable(instance))

    # 3. Register the AAS shell and all submodels in an in‑memory provider.
    store = model.DictObjectStore()
    store.add(aas_shell)
    for sub in instantiated_submodels:
        store.add(sub)

    # 4. Resolve ModelReferences.
    aas_shell.update()

    # 5. Persist the AAS shell and submodels.
    shell_json = json.loads(serialize_aas_to_json(aas_shell))
    asset_record = AASAsset(
        id=aas_shell.id,
        data=shell_json,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    session.add(asset_record)
    for sub in instantiated_submodels:
        sub_json = json.loads(serialize_aas_to_json(sub))
        sub_record = AASSubmodel(
            id=sub.id,
            data=sub_json,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        session.add(sub_record)
    session.commit()
    session.refresh(asset_record)

    # 6. Return the fully resolved AAS asset.
    return json.loads(serialize_aas_to_json(aas_shell))


def get_all_assets(session: Session) -> list[dict]:
    """
    Retrieve all stored AAS assets from the database.
    """
    records = session.exec(select(AASAsset)).all()
    return [record.data for record in records]


def get_asset_by_id(aas_id: str, session: Session) -> dict:
    """
    Retrieve a specific AAS asset by its id and resolve its submodel references.
    """
    asset_record = session.get(AASAsset, aas_id)
    if not asset_record:
        raise ValueError(f"No asset found with id '{aas_id}'.")

    aas_shell = deserialize_aas_from_json(json.dumps(asset_record.data))
    store = model.DictObjectStore()
    store.add(aas_shell)

    resolved_submodels = []
    for ref in aas_shell.submodel:
        submodel_id = ref.key[0].value
        sub_record = session.get(AASSubmodel, submodel_id)
        if sub_record:
            sub_obj = deserialize_aas_from_json(json.dumps(sub_record.data))
            store.add(sub_obj)
            resolved = ref.resolve(store)
            if resolved is not None:
                resolved_submodels.append(resolved)
            else:
                resolved_submodels.append(ref)
        else:
            resolved_submodels.append(ref)

    aas_shell.submodel = resolved_submodels
    aas_shell.update()

    return json.loads(serialize_aas_to_json(aas_shell))


def update_asset_metadata(aas_id: str, new_metadata: dict, session: Session) -> dict:
    """
    Update metadata on an AAS asset instance.
    """
    asset_record = session.get(AASAsset, aas_id)
    if not asset_record:
        raise ValueError(f"No asset found with id '{aas_id}'.")

    # Deserialize the AAS shell.
    aas_shell = deserialize_aas_from_json(json.dumps(asset_record.data))

    if "global_asset_id" in new_metadata:
        aas_shell.asset_information.global_asset_id = new_metadata["global_asset_id"]
    if "description" in new_metadata:
        # Convert plain string to the expected list of language objects.
        aas_shell.description = [
            {"language": "en", "text": new_metadata["description"]}
        ]
    if "display_name" in new_metadata:
        # Convert plain string to the expected list of language objects.
        aas_shell.display_name = [
            {"language": "en", "text": new_metadata["display_name"]}
        ]

    store = model.DictObjectStore()
    store.add(aas_shell)
    for ref in aas_shell.submodel:
        submodel_id = ref.key[0].value
        sub_record = session.get(AASSubmodel, submodel_id)
        if sub_record:
            sub_obj = deserialize_aas_from_json(json.dumps(sub_record.data))
            store.add(sub_obj)
    aas_shell.update()

    updated_json = json.loads(serialize_aas_to_json(aas_shell))
    asset_record.data = updated_json
    asset_record.updated_at = datetime.utcnow()
    session.add(asset_record)
    session.commit()
    session.refresh(asset_record)

    return updated_json


def update_submodel_data(
    aas_id: str, submodel_id: str, new_data: dict, session: Session
) -> dict:
    """
    Update property values on a submodel instance using path translation for indexed elements.

    This function handles the complex path mapping between frontend indexed paths (like
    'AssetLocation/Addresses[0]/AddressLine1') and backend paths with generated IDs.

    Args:
        aas_id: ID of the AAS containing the submodel
        submodel_id: ID of the submodel to update
        new_data: Dictionary with paths as keys and new values
        session: Database session

    Returns:
        Updated submodel data as dictionary

    Raises:
        ValueError: If AAS or submodel not found, or on validation errors
    """
    # Verify AAS exists and submodel belongs to it
    asset_record = session.get(AASAsset, aas_id)
    if not asset_record:
        raise ValueError(f"No asset found with id '{aas_id}'.")

    aas_shell = deserialize_aas_from_json(json.dumps(asset_record.data))
    if not any(ref.key[0].value == submodel_id for ref in aas_shell.submodel):
        raise ValueError(f"Submodel '{submodel_id}' is not part of AAS '{aas_id}'.")

    sub_record = session.get(AASSubmodel, submodel_id)
    if not sub_record:
        raise ValueError(f"No submodel found with id '{submodel_id}'.")

    sub_obj = deserialize_aas_from_json(json.dumps(sub_record.data))

    # Build a map of id_short paths to elements
    element_map = {}
    string_rep_map = {}

    for element in walk_submodel(sub_obj):
        if hasattr(element, "id_short"):
            # Build the path from element to root
            path = []
            current = element
            while current and hasattr(current, "id_short"):
                path.insert(0, current.id_short)
                current = current.parent

            path_str = "/".join(path)
            element_map[path_str] = element
            string_rep_map[path_str] = str(element)

    # Create path mappings for frontend-to-backend path translation
    indexed_paths = {}
    simplified_indexed_paths = {}  # Paths without UUID (what frontend sends)

    for path, element_str in string_rep_map.items():
        # Only process elements with path information in string representation
        if " / " in element_str:
            try:
                # Parse the string representation to extract indexed paths
                parts = element_str.split(" / ")
                if len(parts) < 2:
                    continue

                # Clean up parts: remove class name and brackets
                parts[0] = parts[0].split("[", 1)[1] if "[" in parts[0] else parts[0]
                if "]" in parts[-1]:
                    parts[-1] = parts[-1].split("]")[0]

                # Reconstruct cleaned path
                clean_parts = [part.strip() for part in parts]
                clean_path = "/".join(clean_parts).replace("//", "/")

                # Create full path (with submodel ID) and simplified path (without ID)
                if sub_obj.id_short:
                    full_path = (
                        f"{sub_obj.id_short}/{sub_obj.id}/{clean_path}"
                        if clean_path
                        else sub_obj.id_short
                    )
                    simple_path = (
                        f"{sub_obj.id_short}/{clean_path}"
                        if clean_path
                        else sub_obj.id_short
                    )
                else:
                    full_path = clean_path
                    simple_path = clean_path

                # Clean up any remaining formatting issues
                for path_var in [full_path, simple_path]:
                    path_var = path_var.replace(" [", "[").replace("[ ", "[")
                    if path_var.endswith("]") and not path_var.endswith("]]"):
                        path_var = path_var[:-1]

                # Store both path mappings
                indexed_paths[full_path] = path
                simplified_indexed_paths[simple_path] = path

            except Exception:
                # Skip problematic elements
                continue

    # Process updates
    updated_elements = []

    for frontend_path, new_value in new_data.items():
        # Try multiple approaches to match the frontend path to a backend element
        target_path = None
        element = None

        # Approach 1: Direct lookup in element map
        if frontend_path in element_map:
            target_path = frontend_path
            element = element_map[frontend_path]

        # Approach 2: Lookup via simplified indexed path (most common)
        elif frontend_path in simplified_indexed_paths:
            target_path = simplified_indexed_paths[frontend_path]
            element = element_map[target_path]

        # Approach 3: Lookup via full indexed path
        elif frontend_path in indexed_paths:
            target_path = indexed_paths[frontend_path]
            element = element_map[target_path]

        # Approach 4: Try normalized path matching (replace [] with /)
        else:
            normalized_frontend = frontend_path.replace("[", "/").replace("]", "")

            # Check simplified paths first
            for idx_path, actual_path in simplified_indexed_paths.items():
                normalized_idx = idx_path.replace("[", "/").replace("]", "")
                if normalized_frontend == normalized_idx:
                    target_path = actual_path
                    element = element_map[target_path]
                    break

            # If not found, try full paths
            if not element:
                for idx_path, actual_path in indexed_paths.items():
                    normalized_idx = idx_path.replace("[", "/").replace("]", "")
                    if normalized_frontend == normalized_idx:
                        target_path = actual_path
                        element = element_map[target_path]
                        break

            # Last resort: try matching by basename
            if not element and "/" in frontend_path:
                basename = frontend_path.split("/")[-1]
                for path, elem in element_map.items():
                    if path.endswith("/" + basename):
                        target_path = path
                        element = elem
                        break

        if not element:
            continue

        # Update the element with new value
        try:
            if isinstance(element, model.MultiLanguageProperty):
                if not isinstance(new_value, list):
                    raise ValueError("Value for MultiLanguageProperty must be an array")
                element.value = [
                    {"language": item["language"], "text": str(item["text"])}
                    for item in new_value
                ]
            elif isinstance(element, model.File):
                element.value = str(new_value) if new_value is not None else ""
            elif isinstance(element, model.Property):
                element.value = convert_value(new_value, element.value_type)

            updated_elements.append(target_path)
        except ValueError as e:
            raise ValueError(f"Failed to update value at {frontend_path}: {e}")

    if updated_elements:
        sub_obj.update()
        updated_json = json.loads(serialize_aas_to_json(sub_obj))
        sub_record.data = updated_json
        sub_record.updated_at = datetime.utcnow()
        session.add(sub_record)
        session.commit()
        session.refresh(sub_record)
        return updated_json
    else:
        return sub_record.data


def attach_submodels_to_asset(
    aas_id: str, template_ids: list[str], session: Session
) -> dict:
    """
    Attach new submodel instance(s) (derived from the given list of template IDs)
    to an existing AAS asset.
    """
    # 1. Retrieve the AAS shell record.
    asset_record = session.get(AASAsset, aas_id)
    if not asset_record:
        raise ValueError(f"No AAS found with id '{aas_id}'.")

    # 2. Deserialize the stored AAS shell.
    aas_shell = deserialize_aas_from_json(json.dumps(asset_record.data))

    # 3. Get available templates and build a mapping.
    available_templates = list_template_packages()
    template_map = {tmpl["template_id"]: tmpl for tmpl in available_templates}

    instantiated_submodels = []  # List to collect newly instantiated submodels.

    # 4. Process each template id.
    for tmpl_id in template_ids:
        if tmpl_id not in template_map:
            raise ValueError(f"Template with id '{tmpl_id}' not found.")
        package_path = template_map[tmpl_id]["template_path"]

        # 4a. Import the AASX package.
        object_store, _, _ = import_aasx_package(package_path)

        # 4b. For each Submodel in the package, instantiate a new instance.
        for obj in object_store:
            if isinstance(obj, model.Submodel):
                instance = instantiate_submodel(obj)
                instantiated_submodels.append(instance)
                # 4c. Attach the instance as a ModelReference to the AAS shell.
                aas_shell.submodel.add(model.ModelReference.from_referable(instance))

    # 5. Register the AAS shell and new submodels in an in‑memory object store.
    store = model.DictObjectStore()
    store.add(aas_shell)
    for sub in instantiated_submodels:
        store.add(sub)

    # 6. Resolve all ModelReferences in the AAS shell.
    aas_shell.update()

    # 7. Persist the updated AAS shell and each new submodel.
    updated_shell_json = json.loads(serialize_aas_to_json(aas_shell))
    asset_record.data = updated_shell_json
    asset_record.updated_at = datetime.utcnow()
    session.add(asset_record)

    for sub in instantiated_submodels:
        sub_json = json.loads(serialize_aas_to_json(sub))
        sub_record = AASSubmodel(
            id=sub.id,
            data=sub_json,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        session.add(sub_record)

    session.commit()
    session.refresh(asset_record)

    return updated_shell_json


def remove_submodel_from_asset(aas_id: str, submodel_id: str, session: Session) -> dict:
    """
    Remove a specific submodel (by submodel_id) from an existing AAS asset.
    """
    # 1. Retrieve the AAS from DB
    asset_record = session.get(AASAsset, aas_id)
    if not asset_record:
        raise ValueError(f"No AAS found with id '{aas_id}'.")

    aas_shell = deserialize_aas_from_json(json.dumps(asset_record.data))

    # 2. Check if the submodel is actually referenced
    ref_to_remove = None
    for ref in aas_shell.submodel:
        if ref.key[0].value == submodel_id:
            ref_to_remove = ref
            break
    if not ref_to_remove:
        raise ValueError(
            f"Submodel '{submodel_id}' is not referenced by AAS '{aas_id}'."
        )

    # Remove that reference from the AAS shell
    aas_shell.submodel.remove(ref_to_remove)

    # Optionally remove the submodel object from DB as well
    sub_record = session.get(AASSubmodel, submodel_id)
    if sub_record:
        session.delete(sub_record)

    # 3. Re-resolve the shell for cleanliness
    store = model.DictObjectStore()
    store.add(aas_shell)
    # Re-register submodels that remain
    for ref in aas_shell.submodel:
        existing_sub_rec = session.get(AASSubmodel, ref.key[0].value)
        if existing_sub_rec:
            sub_obj = deserialize_aas_from_json(json.dumps(existing_sub_rec.data))
            store.add(sub_obj)
    aas_shell.update()

    # 4. Persist the updated shell
    updated_shell_json = json.loads(serialize_aas_to_json(aas_shell))
    asset_record.data = updated_shell_json
    asset_record.updated_at = datetime.utcnow()
    session.add(asset_record)
    session.commit()
    session.refresh(asset_record)

    return updated_shell_json


def delete_asset(aas_id: str, session: Session) -> None:
    """
    Delete an AAS asset and all its associated submodels.
    """
    asset_record = session.get(AASAsset, aas_id)
    if not asset_record:
        raise ValueError(f"No asset found with id '{aas_id}'.")

    aas_shell = deserialize_aas_from_json(json.dumps(asset_record.data))
    submodel_ids = [ref.key[0].value for ref in aas_shell.submodel]

    for sub_id in submodel_ids:
        sub_record = session.get(AASSubmodel, sub_id)
        if sub_record:
            session.delete(sub_record)

    session.delete(asset_record)
    session.commit()
