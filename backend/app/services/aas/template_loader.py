from pathlib import Path

from basyx.aas import model
from basyx.aas.adapter import aasx


def import_aasx_package(
    package_path: str,
) -> tuple[
    model.DictObjectStore[model.Identifiable],
    aasx.DictSupplementaryFileContainer,
    object,
]:
    """
    Import an AASX package file given its full path.
    Returns a tuple (object_store, file_store, core_properties).
    """
    object_store: model.DictObjectStore[model.Identifiable] = model.DictObjectStore()
    file_store = aasx.DictSupplementaryFileContainer()
    with aasx.AASXReader(package_path) as reader:
        reader.read_into(object_store=object_store, file_store=file_store)
        core_properties = reader.get_core_properties()
    return object_store, file_store, core_properties


def list_template_packages() -> list[dict]:
    """
    Scan the app/aas/submodel_templates directory and return a list of available AASX template packages.

    For each AASX file found under a subdirectory (category), we import it and extract metadata from its first Submodel.

    Returns:
        A list of dictionaries with keys:
          - template_id: the unique submodel id (from the package)
          - template_name: the filename of the package
          - category: the subdirectory name (category)
          - template_path: the absolute path to the package
          - id_short: the submodel’s idShort (if available)
          - description: the submodel’s description (if available)
    """
    base_dir = Path(__file__).parent / "submodel_templates"
    templates = []
    for category_dir in base_dir.iterdir():
        if category_dir.is_dir():
            for file in category_dir.glob("*.aasx"):
                try:
                    # Import the package to extract metadata.
                    object_store, _, _ = import_aasx_package(str(file.resolve()))
                except Exception as e:
                    print(f"Error importing template {file.name}: {e}")
                    continue
                # Get the first Submodel from the package.
                submodels = [
                    obj for obj in object_store if isinstance(obj, model.Submodel)
                ]
                if not submodels:
                    continue
                subm = submodels[0]
                templates.append(
                    {
                        "template_id": subm.id,
                        "template_name": file.name,
                        "category": category_dir.name,
                        "template_path": str(file.resolve()),
                        "id_short": subm.id_short,
                        "description": subm.description,
                    }
                )
    return templates


if __name__ == "__main__":
    templates = list_template_packages()
    print("=== Available AASX Template Packages ===")
    for idx, tmpl in enumerate(templates, start=1):
        print(f"{idx}. {tmpl['template_name']} (Category: {tmpl['category']})")
        print(f"   Template ID: {tmpl['template_id']}")
        print(f"   idShort: {tmpl['id_short']}")
        print(f"   Description: {tmpl.get('description')}")
        print(f"   Template Path: {tmpl['template_path']}")
        print("-" * 40)
