import json

import basyx.aas.adapter.json as json_adapter
import basyx.aas.adapter.xml as xml_adapter
from basyx.aas import model


def serialize_aas_to_json(aas_instance: model.AssetAdministrationShell) -> str:
    """
    Serialize a single AAS instance to a JSON string using the official BaSyx JSON encoder.
    """
    # Update the AAS (if needed) so that all dynamic parts are current.
    aas_instance.update()
    return json.dumps(aas_instance, cls=json_adapter.AASToJsonEncoder)


def serialize_dict_to_json(data: dict) -> str:
    """
    Serialize a dictionary (which may include AAS objects) to a pretty JSON string.
    """
    return json.dumps(data, cls=json_adapter.AASToJsonEncoder, indent=4)


def deserialize_aas_from_json(json_string: str) -> model.AssetAdministrationShell:
    """
    Deserialize a JSON string into an AAS instance using the BaSyx JSON decoder.
    """
    return json.loads(json_string, cls=json_adapter.AASFromJsonDecoder)


def write_aas_json_file(
    filename: str, object_store: model.DictObjectStore[model.Identifiable]
) -> None:
    """
    Write an ObjectStore of AAS objects to a JSON file.
    """
    for obj in object_store:
        obj.update()
    json_adapter.write_aas_json_file(filename, object_store)


def read_aas_json_file(
    filename: str, failsafe: bool = True
) -> model.DictObjectStore[model.Identifiable]:
    """
    Read a JSON file into an ObjectStore of AAS objects.
    """
    return json_adapter.read_aas_json_file(filename, failsafe=failsafe)


def write_aas_xml_file(
    filename: str, object_store: model.DictObjectStore[model.Identifiable]
) -> None:
    """
    Write an ObjectStore of AAS objects to an XML file.
    """
    for obj in object_store:
        obj.update()
    xml_adapter.write_aas_xml_file(filename, object_store)


def read_aas_xml_file(
    filename: str, failsafe: bool = True
) -> model.DictObjectStore[model.Identifiable]:
    """
    Read an XML file into an ObjectStore of AAS objects.
    """
    return xml_adapter.read_aas_xml_file(filename, failsafe=failsafe)
