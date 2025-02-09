import json

from basyx.aas import model


def create_basic_aas() -> model.AssetAdministrationShell:
    """
    Create a basic AAS instance containing an AssetInformation object,
    a Submodel, and a Property.
    """
    # Step 1: Create the AssetInformation object.
    asset_information = model.AssetInformation(
        asset_kind=model.AssetKind.INSTANCE,
        global_asset_id="http://acplt.org/Simple_Asset",
    )

    # Step 2: Create the AAS using the identifier and asset_information.
    aas_instance = model.AssetAdministrationShell(
        id_="https://acplt.org/Simple_AAS", asset_information=asset_information
    )

    # Step 3: Create a Submodel.
    submodel = model.Submodel(id_="https://acplt.org/Simple_Submodel")

    # Add a reference to the Submodel to the AAS.
    aas_instance.submodel.add(model.ModelReference.from_referable(submodel))

    # Step 4: Create a Property and add it to the Submodel.
    semantic_ref = model.ExternalReference(
        (
            model.Key(
                type_=model.KeyTypes.GLOBAL_REFERENCE,
                value="http://acplt.org/Properties/SimpleProperty",
            ),
        )
    )
    property_ = model.Property(
        id_short="ExampleProperty",
        value_type=model.datatypes.String,
        value="exampleValue",
        semantic_id=semantic_ref,
    )
    submodel.submodel_element.add(property_)

    return aas_instance


def aas_to_dict(aas: model.AssetAdministrationShell) -> dict:
    """
    Serialize an AAS instance to a dictionary using the official Basyx JSON encoder.

    This function uses the serialization logic defined in our dedicated
    serialization module by converting the AAS to a JSON string and then
    decoding it back to a dictionary.
    """
    from .serialization import (
        serialize_aas_to_json,  # Import here to keep dependencies localized
    )

    json_str = serialize_aas_to_json(aas)
    return json.loads(json_str)
