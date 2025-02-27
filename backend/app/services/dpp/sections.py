from typing import Any

from app.models import DPPSection, DPPSectionInfo

from .config import (
    SECTION_REQUIREMENTS,
    STATUS_AVAILABLE,
    STATUS_INCOMPLETE,
    SubmodelIdentifiers,
)


class BaseDPPSection:
    """Base class for DPP section processors with complete nested structure handling."""

    def __init__(self, aas_data: dict[str, Any]):
        self.aas_data = aas_data
        # Create a mapping of template IDs to submodels for easy lookup
        self.submodels = {}
        self.submodel_by_id_short = {}

        for sm in aas_data.get("submodels", []):
            template_id = sm.get("administration", {}).get("templateId")
            if template_id:
                self.submodels[template_id] = sm

            id_short = sm.get("idShort")
            if id_short:
                self.submodel_by_id_short[id_short] = sm

    def get_submodel(self, template_id: str) -> dict[str, Any] | None:
        """Get submodel by template ID."""
        return self.submodels.get(template_id)

    def get_submodel_by_id_short(self, id_short: str) -> dict[str, Any] | None:
        """Get submodel by idShort."""
        return self.submodel_by_id_short.get(id_short)

    def find_submodel_by_semantic_id(self, semantic_id: str) -> dict[str, Any] | None:
        """Find a submodel by its semantic ID."""
        for sm in self.aas_data.get("submodels", []):
            if sm.get("semanticId", {}).get("type") == "ModelReference":
                keys = sm.get("semanticId", {}).get("keys", [])
                for key in keys:
                    if key.get("value") == semantic_id:
                        return sm
            elif sm.get("semanticId", {}).get("type") == "ExternalReference":
                keys = sm.get("semanticId", {}).get("keys", [])
                for key in keys:
                    if key.get("value") == semantic_id:
                        return sm
        return None

    def _extract_multilang_value(self, element: dict) -> dict | None:
        """Extract multilanguage value from an element."""
        if not element or "value" not in element:
            return None
        return element.get("value")

    def _extract_simple_value(self, element: dict) -> Any:
        """Extract simple value from an element."""
        if not element or "value" not in element:
            return None
        return element.get("value")

    def _process_records(self, records_collection: dict) -> list:
        """Process time series records from a collection."""
        if not records_collection or "elements" not in records_collection:
            return []

        records = []
        for _, record in records_collection.get("elements", {}).items():
            if "elements" in record:
                record_data = {}
                for field_name, field in record.get("elements", {}).items():
                    record_data[field_name] = self._extract_simple_value(field)
                records.append(record_data)

        return records

    def process_property(self, prop: dict[str, Any]) -> dict[str, Any] | None:
        """Process any type of property with proper type handling."""
        # Skip empty or invalid elements
        if not prop or not isinstance(prop, dict) or "idShort" not in prop:
            return None

        result = {
            "idShort": prop.get("idShort"),
            "modelType": prop.get("modelType"),
        }

        # Add display name if present
        if "displayName" in prop:
            result["displayName"] = {
                item.get("language"): item.get("text")
                for item in prop.get("displayName", [])
                if "language" in item and "text" in item
            }

        # Add description if present
        if "description" in prop:
            result["description"] = {
                item.get("language"): item.get("text")
                for item in prop.get("description", [])
                if "language" in item and "text" in item
            }

        if prop.get("modelType") == "MultiLanguageProperty":
            values = prop.get("value", [])
            lang_values = {
                v.get("language"): v.get("text")
                for v in values
                if v.get("language") and v.get("text")
            }
            if not lang_values:
                return None
            result["value"] = lang_values

        elif prop.get("modelType") == "File":
            value = prop.get("value")
            if not value:
                return None
            result["value"] = value
            result["contentType"] = prop.get("contentType")

        else:  # Regular Property
            value = prop.get("value")
            if value is None:
                return None

            value_type = prop.get("valueType")
            result["valueType"] = value_type

            # Convert value based on type
            if value_type == "xs:integer":
                try:
                    result["value"] = int(value)
                except (ValueError, TypeError):
                    result["value"] = value
            elif value_type in ["xs:double", "xs:float"]:
                try:
                    result["value"] = float(value)
                except (ValueError, TypeError):
                    result["value"] = value
            elif value_type == "xs:boolean":
                if isinstance(value, str):
                    result["value"] = value.lower() in ("true", "1", "yes")
                else:
                    result["value"] = bool(value)
            else:  # xs:string, xs:date, xs:dateTime, xs:anyURI treated as strings
                result["value"] = str(value)

        # Include semantic IDs for better data contextualization
        if "semanticId" in prop:
            result["semanticId"] = prop.get("semanticId")

        return result

    def process_collection(self, collection: dict[str, Any]) -> dict[str, Any] | None:
        """Process a collection, returning None if no valid elements."""
        # Skip empty or invalid elements
        if (
            not collection
            or not isinstance(collection, dict)
            or "idShort" not in collection
        ):
            return None

        elements = {}

        for element in collection.get("value", []):
            element_type = element.get("modelType")
            element_id = element.get("idShort")

            if not element_id:
                continue

            processed = None
            if element_type in ["Property", "MultiLanguageProperty", "File"]:
                processed = self.process_property(element)
            elif element_type == "SubmodelElementCollection":
                processed = self.process_collection(element)
            elif element_type == "SubmodelElementList":
                processed = self.process_list(element)
            elif element_type == "Entity":
                processed = self.process_entity(element)
            elif element_type == "ReferenceElement":
                processed = self.process_reference(element)
            elif element_type == "Range":
                processed = self.process_range(element)
            elif element_type == "Blob":
                processed = self.process_blob(element)

            if processed:
                elements[element_id] = processed

        if not elements:
            return None

        result = {
            "idShort": collection.get("idShort"),
            "modelType": collection.get("modelType"),
            "elements": elements,
        }

        # Add display name if present
        if "displayName" in collection:
            result["displayName"] = {
                item.get("language"): item.get("text")
                for item in collection.get("displayName", [])
                if "language" in item and "text" in item
            }

        # Add description if present
        if "description" in collection:
            result["description"] = {
                item.get("language"): item.get("text")
                for item in collection.get("description", [])
                if "language" in item and "text" in item
            }

        # Include semantic ID
        if "semanticId" in collection:
            result["semanticId"] = collection.get("semanticId")

        return result

    def process_list(self, list_element: dict[str, Any]) -> dict[str, Any] | None:
        """Process a SubmodelElementList maintaining its structure."""
        # Skip empty or invalid elements
        if (
            not list_element
            or not isinstance(list_element, dict)
            or "idShort" not in list_element
        ):
            return None

        elements = []

        for element in list_element.get("value", []):
            element_type = element.get("modelType")

            processed = None
            if element_type in ["Property", "MultiLanguageProperty", "File"]:
                processed = self.process_property(element)
            elif element_type == "SubmodelElementCollection":
                processed = self.process_collection(element)
            elif element_type == "Entity":
                processed = self.process_entity(element)
            elif element_type == "ReferenceElement":
                processed = self.process_reference(element)
            elif element_type == "Range":
                processed = self.process_range(element)
            elif element_type == "Blob":
                processed = self.process_blob(element)

            if processed:
                elements.append(processed)

        if not elements:
            return None

        result = {
            "idShort": list_element.get("idShort"),
            "modelType": "SubmodelElementList",
            "orderRelevant": list_element.get("orderRelevant", False),
            "elements": elements,
        }

        # Add display name if present
        if "displayName" in list_element:
            result["displayName"] = {
                item.get("language"): item.get("text")
                for item in list_element.get("displayName", [])
                if "language" in item and "text" in item
            }

        # Add description if present
        if "description" in list_element:
            result["description"] = {
                item.get("language"): item.get("text")
                for item in list_element.get("description", [])
                if "language" in item and "text" in item
            }

        # Include type info for list elements
        if "typeValueListElement" in list_element:
            result["typeValueListElement"] = list_element.get("typeValueListElement")

        # Include semantic ID
        if "semanticId" in list_element:
            result["semanticId"] = list_element.get("semanticId")

        if "semanticIdListElement" in list_element:
            result["semanticIdListElement"] = list_element.get("semanticIdListElement")

        return result

    def process_entity(self, entity: dict[str, Any]) -> dict[str, Any] | None:
        """Process an Entity element maintaining its structure."""
        # Skip empty or invalid elements
        if not entity or not isinstance(entity, dict) or "idShort" not in entity:
            return None

        statements = []

        for statement in entity.get("statements", []):
            statement_type = statement.get("modelType")

            processed = None
            if statement_type in ["Property", "MultiLanguageProperty", "File"]:
                processed = self.process_property(statement)
            elif statement_type == "SubmodelElementCollection":
                processed = self.process_collection(statement)
            elif statement_type == "Entity":
                processed = self.process_entity(statement)
            elif statement_type == "ReferenceElement":
                processed = self.process_reference(statement)

            if processed:
                statements.append(processed)

        result = {
            "idShort": entity.get("idShort"),
            "modelType": "Entity",
            "entityType": entity.get("entityType"),
        }

        if statements:
            result["statements"] = statements

        # Include global asset ID if present
        if "globalAssetId" in entity:
            result["globalAssetId"] = entity.get("globalAssetId")

        # Add display name if present
        if "displayName" in entity:
            result["displayName"] = {
                item.get("language"): item.get("text")
                for item in entity.get("displayName", [])
                if "language" in item and "text" in item
            }

        # Add description if present
        if "description" in entity:
            result["description"] = {
                item.get("language"): item.get("text")
                for item in entity.get("description", [])
                if "language" in item and "text" in item
            }

        # Include semantic ID
        if "semanticId" in entity:
            result["semanticId"] = entity.get("semanticId")

        return result

    def process_reference(self, ref_element: dict[str, Any]) -> dict[str, Any] | None:
        """Process a ReferenceElement."""
        # Skip empty or invalid elements
        if (
            not ref_element
            or not isinstance(ref_element, dict)
            or "idShort" not in ref_element
        ):
            return None

        result = {
            "idShort": ref_element.get("idShort"),
            "modelType": "ReferenceElement",
        }

        # Include the reference value
        if "value" in ref_element:
            result["value"] = ref_element["value"]

        # Add display name if present
        if "displayName" in ref_element:
            result["displayName"] = {
                item.get("language"): item.get("text")
                for item in ref_element.get("displayName", [])
                if "language" in item and "text" in item
            }

        # Add description if present
        if "description" in ref_element:
            result["description"] = {
                item.get("language"): item.get("text")
                for item in ref_element.get("description", [])
                if "language" in item and "text" in item
            }

        # Include semantic ID
        if "semanticId" in ref_element:
            result["semanticId"] = ref_element.get("semanticId")

        return result

    def process_range(self, range_element: dict[str, Any]) -> dict[str, Any] | None:
        """Process a Range element."""
        # Skip empty or invalid elements
        if (
            not range_element
            or not isinstance(range_element, dict)
            or "idShort" not in range_element
        ):
            return None

        result = {
            "idShort": range_element.get("idShort"),
            "modelType": "Range",
            "valueType": range_element.get("valueType"),
        }

        # Include min and max values
        if "min" in range_element:
            result["min"] = range_element["min"]
        if "max" in range_element:
            result["max"] = range_element["max"]

        # Add display name if present
        if "displayName" in range_element:
            result["displayName"] = {
                item.get("language"): item.get("text")
                for item in range_element.get("displayName", [])
                if "language" in item and "text" in item
            }

        # Add description if present
        if "description" in range_element:
            result["description"] = {
                item.get("language"): item.get("text")
                for item in range_element.get("description", [])
                if "language" in item and "text" in item
            }

        # Include semantic ID
        if "semanticId" in range_element:
            result["semanticId"] = range_element.get("semanticId")

        return result

    def process_blob(self, blob_element: dict[str, Any]) -> dict[str, Any] | None:
        """Process a Blob element."""
        # Skip empty or invalid elements
        if (
            not blob_element
            or not isinstance(blob_element, dict)
            or "idShort" not in blob_element
        ):
            return None

        result = {
            "idShort": blob_element.get("idShort"),
            "modelType": "Blob",
            "contentType": blob_element.get("contentType"),
        }

        # Include the blob value if present
        if "value" in blob_element:
            result["value"] = blob_element["value"]

        # Add display name if present
        if "displayName" in blob_element:
            result["displayName"] = {
                item.get("language"): item.get("text")
                for item in blob_element.get("displayName", [])
                if "language" in item and "text" in item
            }

        # Add description if present
        if "description" in blob_element:
            result["description"] = {
                item.get("language"): item.get("text")
                for item in blob_element.get("description", [])
                if "language" in item and "text" in item
            }

        # Include semantic ID
        if "semanticId" in blob_element:
            result["semanticId"] = blob_element.get("semanticId")

        return result

    def process_submodel(self, submodel: dict[str, Any]) -> dict[str, Any]:
        """Process a complete submodel, filtering out empty elements."""
        if not submodel:
            return {}

        elements = {}
        for element in submodel.get("submodelElements", []):
            element_id = element.get("idShort")
            if not element_id:
                continue

            processed = None
            element_type = element.get("modelType")
            if element_type in ["Property", "MultiLanguageProperty", "File"]:
                processed = self.process_property(element)
            elif element_type == "SubmodelElementCollection":
                processed = self.process_collection(element)
            elif element_type == "SubmodelElementList":
                processed = self.process_list(element)
            elif element_type == "Entity":
                processed = self.process_entity(element)
            elif element_type == "Operation":
                # Skip operations as they're not relevant for DPP
                continue
            elif element_type == "ReferenceElement":
                processed = self.process_reference(element)
            elif element_type == "Range":
                processed = self.process_range(element)
            elif element_type == "Blob":
                processed = self.process_blob(element)

            if processed:
                elements[element_id] = processed

        return {
            "metadata": {
                "id": submodel.get("id"),
                "idShort": submodel.get("idShort"),
                "version": submodel.get("administration", {}).get("version"),
                "revision": submodel.get("administration", {}).get("revision"),
                "templateId": submodel.get("administration", {}).get("templateId"),
            },
            "elements": elements,
        }


class IdentificationSection(BaseDPPSection):
    """Product identification information"""

    def process(self) -> DPPSection | None:
        nameplate = self.get_submodel(SubmodelIdentifiers.NAMEPLATE)
        if not nameplate:
            return None

        processed_nameplate = self.process_submodel(nameplate)
        elements = processed_nameplate.get("elements", {})

        # Get multilanguage properties properly
        product_name = elements.get("ManufacturerProductDesignation", {}).get("value")
        manufacturer_name = elements.get("ManufacturerName", {}).get("value")
        product_family = elements.get("ManufacturerProductFamily", {}).get("value")

        data = {
            "product": {
                "name": product_name,
                "type": elements.get("ManufacturerProductType", {}).get("value"),
                "serial": elements.get("SerialNumber", {}).get("value"),
                "articleNumber": elements.get(
                    "ProductArticleNumberOfManufacturer", {}
                ).get("value"),
                "yearOfConstruction": elements.get("YearOfConstruction", {}).get(
                    "value"
                ),
                "countryOfOrigin": elements.get("CountryOfOrigin", {}).get("value"),
                "manufacturingDate": elements.get("DateOfManufacture", {}).get("value"),
                "image": elements.get("CompanyLogo", {}).get("value"),
                "orderCode": elements.get("OrderCodeOfManufacturer", {}).get("value"),
                "uri": elements.get("URIOfTheProduct", {}).get("value"),
            },
            "manufacturer": {
                "name": manufacturer_name,
                "productFamily": product_family,
                "logo": elements.get("CompanyLogo", {}).get("value"),
            },
            "versions": {
                "hardware": elements.get("HardwareVersion", {}).get("value"),
                "software": elements.get("SoftwareVersion", {}).get("value"),
                "firmware": elements.get("FirmwareVersion", {}).get("value"),
            },
        }

        return DPPSection(title="Product Identification", data=data)


class BusinessInfoSection(BaseDPPSection):
    """Business and contact information"""

    def process(self) -> DPPSection | None:
        contact = self.get_submodel(SubmodelIdentifiers.CONTACT)
        if not contact:
            return None

        processed_contact = self.process_submodel(contact)
        contact_info = processed_contact.get("elements", {}).get(
            "ContactInformation", {}
        )
        if not contact_info:
            return None

        elements = contact_info.get("elements", {})

        # Extract email information if available
        email = None
        email_element = elements.get("Email", {}).get("elements", {})
        if email_element and "EmailAddress" in email_element:
            email = email_element.get("EmailAddress", {}).get("value")

        # Extract phone information if available
        phone = None
        phone_element = elements.get("Phone", {}).get("elements", {})
        if phone_element and "TelephoneNumber" in phone_element:
            phone = phone_element.get("TelephoneNumber", {}).get("value")

        data = {
            "contacts": [
                {
                    "role": elements.get("RoleOfContactPerson", {}).get("value"),
                    "company": elements.get("Company", {}).get("value"),
                    "department": elements.get("Department", {}).get("value"),
                    "firstName": elements.get("FirstName", {}).get("value"),
                    "title": elements.get("Title", {}).get("value"),
                    "academicTitle": elements.get("AcademicTitle", {}).get("value"),
                    "address": {
                        "street": elements.get("Street", {}).get("value"),
                        "city": elements.get("CityTown", {}).get("value"),
                        "postCode": elements.get("Zipcode", {}).get("value"),
                        "country": elements.get("NationalCode", {}).get("value"),
                        "stateCounty": elements.get("StateCounty", {}).get("value"),
                    },
                    "communication": {
                        "email": email,
                        "phone": phone,
                        "language": elements.get("Language", {}).get("value"),
                        "timeZone": elements.get("TimeZone", {}).get("value"),
                    },
                }
            ]
        }

        return DPPSection(title="Business Information", data=data)


class TechnicalDataSection(BaseDPPSection):
    """Technical specifications with complete structure."""

    def process(self) -> DPPSection | None:
        tech_data = self.get_submodel(SubmodelIdentifiers.TECHNICAL_DATA)
        if not tech_data:
            return None

        processed_data = self.process_submodel(tech_data)

        # Create a more user-friendly structure for the frontend while preserving all data
        elements = processed_data.get("elements", {})

        # Extract general information
        general_info = elements.get("GeneralInformation", {}).get("elements", {})

        # Extract product classifications
        classifications = elements.get("ProductClassifications", {}).get("elements", {})

        # Extract technical properties
        tech_props = elements.get("TechnicalProperties", {}).get("elements", {})

        # Extract further information
        further_info = elements.get("FurtherInformation", {}).get("elements", {})

        # Create a structured summary for easy frontend use
        summary = {
            "productName": general_info.get("ManufacturerProductDesignation", {}).get(
                "value"
            ),
            "manufacturer": general_info.get("ManufacturerName", {}).get("value"),
            "productImage": general_info.get("ProductImage", {}).get("value"),
            "articleNumber": general_info.get("ManufacturerArticleNumber", {}).get(
                "value"
            ),
            "orderCode": general_info.get("ManufacturerOrderCode", {}).get("value"),
        }

        # Return both the structured summary and complete data
        return DPPSection(
            title="Technical Data",
            data={
                "summary": summary,
                "generalInformation": general_info,
                "classifications": classifications.get("ProductClassificationItem", {}),
                "technicalProperties": tech_props,
                "furtherInformation": further_info,
                "rawData": processed_data,
            },
        )


class SustainabilitySection(BaseDPPSection):
    """Sustainability information processor."""

    def process(self) -> DPPSection | None:
        carbon = self.get_submodel(SubmodelIdentifiers.CARBON_FOOTPRINT)
        if not carbon:
            return None

        processed_carbon = self.process_submodel(carbon)
        elements = processed_carbon.get("elements", {})
        pcf = elements.get("ProductCarbonFootprint", {}).get("elements", {})
        tcf = elements.get("TransportCarbonFootprint", {}).get("elements", {})

        if not pcf and not tcf:
            return None

        data = {
            "carbonFootprint": {
                "product": {
                    "value": pcf.get("PCFCO2eq", {}).get("value"),
                    "unit": "kg CO2 eq",
                    "calculationMethod": pcf.get("PCFCalculationMethod", {}).get(
                        "value"
                    ),
                    "validFrom": pcf.get("PublicationDate", {}).get("value"),
                    "validUntil": pcf.get("ExpirationDate", {}).get("value"),
                    "lifecycle": {
                        "phases": pcf.get("PCFLifeCyclePhase", {}).get("value"),
                        "reference": pcf.get("PCFReferenceValueForCalculation", {}).get(
                            "value"
                        ),
                        "quantity": pcf.get(
                            "PCFQuantityOfMeasureForCalculation", {}
                        ).get("value"),
                    },
                    "explanatoryStatement": pcf.get("ExplanatoryStatement", {}).get(
                        "value"
                    ),
                },
                "transport": {
                    "value": tcf.get("TCFCO2eq", {}).get("value"),
                    "unit": "kg CO2 eq",
                    "calculationMethod": tcf.get("TCFCalculationMethod", {}).get(
                        "value"
                    ),
                    "validFrom": tcf.get("PublicationDate", {}).get("value"),
                    "validUntil": tcf.get("ExpirationDate", {}).get("value"),
                    "reference": tcf.get("TCFReferenceValueForCalculation", {}).get(
                        "value"
                    ),
                    "quantity": tcf.get("TCFQuantityOfMeasureForCalculation", {}).get(
                        "value"
                    ),
                    "processes": tcf.get(
                        "TCFProcessesForGreenhouseGasEmissionInATransportService", {}
                    ).get("value"),
                    "explanatoryStatement": tcf.get("ExplanatoryStatement", {}).get(
                        "value"
                    ),
                },
            },
            "rawData": processed_carbon,
        }

        return DPPSection(title="Environmental Impact", data=data)


class ComplianceSection(BaseDPPSection):
    """Standards and compliance information"""

    def process(self) -> DPPSection | None:
        nameplate = self.get_submodel(SubmodelIdentifiers.NAMEPLATE)
        if not nameplate:
            return None

        processed_nameplate = self.process_submodel(nameplate)
        elements = processed_nameplate.get("elements", {})
        markings_list = elements.get("Markings", {}).get("elements", [])

        # Extract standards and certifications from nameplate
        certifications = []
        standards = []
        markings = []

        # Process markings if available
        if markings_list:
            for marking in markings_list:
                marking_data = {}

                # Extract marking info
                if "MarkingName" in marking:
                    marking_data["name"] = marking.get("MarkingName", {}).get("value")
                if "MarkingFile" in marking:
                    marking_data["file"] = marking.get("MarkingFile", {}).get("value")
                if "MarkingValidFrom" in marking:
                    marking_data["validFrom"] = marking.get("MarkingValidFrom", {}).get(
                        "value"
                    )
                if "MarkingValidUntil" in marking:
                    marking_data["validUntil"] = marking.get(
                        "MarkingValidUntil", {}
                    ).get("value")

                if marking_data:
                    markings.append(marking_data)

        data = {
            "certifications": certifications,
            "standards": standards,
            "markings": markings,
            "rawData": processed_nameplate,
        }

        return DPPSection(title="Compliance & Standards", data=data)


class MaterialSection(BaseDPPSection):
    """Material composition and circularity information"""

    def process(self) -> DPPSection | None:
        hierarchy = self.get_submodel(SubmodelIdentifiers.HIERARCHY)
        if not hierarchy:
            return None

        processed_hierarchy = self.process_submodel(hierarchy)
        elements = processed_hierarchy.get("elements", {})

        # Extract the EntryNode element which contains the hierarchical structure
        entry_node = elements.get("EntryNode", {})
        arche_type = elements.get("ArcheType", {}).get("value", "Unknown")

        def process_node(node: dict[str, Any]) -> dict[str, Any]:
            """Process a node in the hierarchy to extract the component structure."""
            if not node:
                return {}

            result = {
                "id": node.get("idShort"),
                "type": node.get("entityType"),
                "globalAssetId": node.get("globalAssetId"),
                "components": [],
            }

            # Process statements which contain child components
            statements = node.get("statements", [])
            for statement in statements:
                if statement.get("modelType") == "Entity":
                    result["components"].append(process_node(statement))

            return result

        # Process the entry node to build the hierarchical structure
        structure = process_node(entry_node)

        # Build material data structure
        data = {
            "structure": structure,
            "archeType": arche_type,
            "recycling": {
                "recyclable": True,  # Default value, should be derived from actual data
                "materials": [],  # Material components, to be populated from hierarchy
            },
            "rawData": processed_hierarchy,
        }

        return DPPSection(title="Materials & Composition", data=data)


class DocumentationSection(BaseDPPSection):
    """Product documentation and manuals"""

    def process(self) -> DPPSection | None:
        docs = self.get_submodel(SubmodelIdentifiers.DOCUMENTATION)
        if not docs:
            return None

        processed_docs = self.process_submodel(docs)
        elements = processed_docs.get("elements", {})

        documents = []

        # Process document elements
        for key, element in elements.items():
            if key.startswith("Document"):
                doc_data = {}

                # Extract document ID information
                doc_id = element.get("elements", {}).get("DocumentId__00__", {})
                if doc_id and "elements" in doc_id:
                    doc_data["identifier"] = (
                        doc_id.get("elements", {})
                        .get("DocumentIdentifier", {})
                        .get("value")
                    )
                    doc_data["domain"] = (
                        doc_id.get("elements", {})
                        .get("DocumentDomainId", {})
                        .get("value")
                    )
                    doc_data["isPrimary"] = (
                        doc_id.get("elements", {})
                        .get("DocumentIsPrimary", {})
                        .get("value")
                    )

                # Extract document classification
                doc_class = element.get("elements", {}).get(
                    "DocumentClassification__00__", {}
                )
                if doc_class and "elements" in doc_class:
                    doc_data["classId"] = (
                        doc_class.get("elements", {}).get("ClassId", {}).get("value")
                    )
                    doc_data["className"] = (
                        doc_class.get("elements", {}).get("ClassName", {}).get("value")
                    )
                    doc_data["classificationSystem"] = (
                        doc_class.get("elements", {})
                        .get("ClassificationSystem", {})
                        .get("value")
                    )

                # Extract document version details
                doc_version = element.get("elements", {}).get(
                    "DocumentVersion__00__", {}
                )
                if doc_version and "elements" in doc_version:
                    doc_data["language"] = (
                        doc_version.get("elements", {})
                        .get("Language__00__", {})
                        .get("value")
                    )
                    doc_data["version"] = (
                        doc_version.get("elements", {}).get("Version", {}).get("value")
                    )
                    doc_data["title"] = (
                        doc_version.get("elements", {}).get("Title", {}).get("value")
                    )
                    doc_data["subtitle"] = (
                        doc_version.get("elements", {}).get("SubTitle", {}).get("value")
                    )
                    doc_data["description"] = (
                        doc_version.get("elements", {})
                        .get("Description", {})
                        .get("value")
                    )
                    doc_data["status"] = (
                        doc_version.get("elements", {})
                        .get("StatusValue", {})
                        .get("value")
                    )
                    doc_data["statusDate"] = (
                        doc_version.get("elements", {})
                        .get("StatusSetDate", {})
                        .get("value")
                    )
                    doc_data["organization"] = (
                        doc_version.get("elements", {})
                        .get("OrganizationOfficialName", {})
                        .get("value")
                    )

                    # Extract document files
                    doc_data["file"] = (
                        doc_version.get("elements", {})
                        .get("DigitalFile__00__", {})
                        .get("value")
                    )
                    doc_data["previewFile"] = (
                        doc_version.get("elements", {})
                        .get("PreviewFile__00__", {})
                        .get("value")
                    )

                if doc_data:
                    documents.append(doc_data)

        data = {
            "documents": documents,
            "totalDocuments": elements.get("numberOfDocuments", {}).get("value"),
            "rawData": processed_docs,
        }

        return DPPSection(title="Documentation", data=data)


class LocationSection(BaseDPPSection):
    """Asset location tracking information"""

    def process(self) -> DPPSection | None:
        location = self.get_submodel(SubmodelIdentifiers.ASSET_LOCATION)
        if not location:
            return None

        processed_location = self.process_submodel(location)
        elements = processed_location.get("elements", {})

        # Process address information
        addresses = []
        addresses_data = elements.get("Addresses", {})
        if addresses_data and "elements" in addresses_data:
            for addr in addresses_data.get("elements", []):
                address = {
                    "addressLine1": addr.get("AddressLine1", {}).get("value"),
                    "addressLine2": addr.get("AddressLine2", {}).get("value"),
                    "addressLine3": addr.get("AddressLine3", {}).get("value"),
                    "city": addr.get("Citytown", {}).get("value"),
                    "state": addr.get("Statecounty", {}).get("value"),
                    "zip": addr.get("ZipCode", {}).get("value"),
                    "country": addr.get("NationalCode", {}).get("value"),
                }
                addresses.append(address)

        # Process coordinate systems
        coordinate_systems = []
        coord_systems_data = elements.get("CoordinateSystems", {})
        if coord_systems_data and "elements" in coord_systems_data:
            for cs in coord_systems_data.get("elements", []):
                coord_system = {
                    "name": cs.get("CoordinateSystemName", {}).get("value"),
                    "id": cs.get("CoordinateSystemId", {}).get("value"),
                    "type": cs.get("CoordinateSystemType", {}).get("value"),
                }
                coordinate_systems.append(coord_system)

        # Process location tracking information
        tracking_info = elements.get("AssetLocatingInformation", {}).get("elements", {})
        location_info = {
            "localizable": tracking_info.get("Localizable", {}).get("value"),
            "realTimeCapability": tracking_info.get(
                "AssetLocationServiceRealTimeCapability", {}
            ).get("value"),
            "sourceType": tracking_info.get("RealtimeLocationSourceType", {}).get(
                "value"
            ),
            "source": tracking_info.get("RealtimeLocationSource", {}).get("value"),
        }

        data = {
            "addresses": addresses,
            "coordinateSystems": coordinate_systems,
            "locationInfo": location_info,
            "rawData": processed_location,
        }

        return DPPSection(title="Asset Location", data=data)


class UsageSection(BaseDPPSection):
    """Usage data and time series information"""

    def process(self) -> DPPSection | None:
        time_series = self.get_submodel(SubmodelIdentifiers.TIME_SERIES)
        if not time_series:
            return None

        processed_ts = self.process_submodel(time_series)
        elements = processed_ts.get("elements", {})

        # Extract metadata about the time series
        metadata = elements.get("Metadata", {}).get("elements", {})

        # Extract record structure
        record_structure = metadata.get("Record", {}).get("elements", {})
        record_fields = []
        for field_name, field in record_structure.items():
            record_fields.append(
                {
                    "name": field_name,
                    "type": field.get("valueType"),
                    "category": field.get("category"),
                }
            )

        # Extract segments information
        segments_data = elements.get("Segments", {}).get("elements", {})

        # Process external segments - fix to extract nested values properly
        external_segments = []
        ext_segment_collection = segments_data.get("ExternalSegment", {})

        # Check if we have a single external segment with nested elements
        if ext_segment_collection and "elements" in ext_segment_collection:
            segment_elements = ext_segment_collection.get("elements", {})
            segment = {
                "name": self._extract_multilang_value(segment_elements.get("Name", {})),
                "description": self._extract_multilang_value(
                    segment_elements.get("Description", {})
                ),
                "recordCount": self._extract_simple_value(
                    segment_elements.get("RecordCount", {})
                ),
                "startTime": self._extract_simple_value(
                    segment_elements.get("StartTime", {})
                ),
                "endTime": self._extract_simple_value(
                    segment_elements.get("EndTime", {})
                ),
                "duration": self._extract_simple_value(
                    segment_elements.get("Duration", {})
                ),
                "samplingInterval": self._extract_simple_value(
                    segment_elements.get("SamplingInterval", {})
                ),
                "samplingRate": self._extract_simple_value(
                    segment_elements.get("SamplingRate", {})
                ),
                "state": self._extract_simple_value(segment_elements.get("State", {})),
                "lastUpdate": self._extract_simple_value(
                    segment_elements.get("LastUpdate", {})
                ),
                "fileUrl": self._extract_simple_value(segment_elements.get("File", {})),
            }
            external_segments.append(segment)

        # Process linked segments
        linked_segments = []
        linked_segment_collection = segments_data.get("LinkedSegment", {})

        if linked_segment_collection and "elements" in linked_segment_collection:
            segment_elements = linked_segment_collection.get("elements", {})
            segment = {
                "name": self._extract_multilang_value(segment_elements.get("Name", {})),
                "description": self._extract_multilang_value(
                    segment_elements.get("Description", {})
                ),
                "recordCount": self._extract_simple_value(
                    segment_elements.get("RecordCount", {})
                ),
                "startTime": self._extract_simple_value(
                    segment_elements.get("StartTime", {})
                ),
                "endTime": self._extract_simple_value(
                    segment_elements.get("EndTime", {})
                ),
                "duration": self._extract_simple_value(
                    segment_elements.get("Duration", {})
                ),
                "samplingInterval": self._extract_simple_value(
                    segment_elements.get("SamplingInterval", {})
                ),
                "samplingRate": self._extract_simple_value(
                    segment_elements.get("SamplingRate", {})
                ),
                "state": self._extract_simple_value(segment_elements.get("State", {})),
                "lastUpdate": self._extract_simple_value(
                    segment_elements.get("LastUpdate", {})
                ),
                "endpoint": self._extract_simple_value(
                    segment_elements.get("Endpoint", {})
                ),
                "query": self._extract_simple_value(segment_elements.get("Query", {})),
            }
            linked_segments.append(segment)

        # Process internal segments
        internal_segments = []
        internal_segment_collection = segments_data.get("InternalSegment", {})

        if internal_segment_collection and "elements" in internal_segment_collection:
            segment_elements = internal_segment_collection.get("elements", {})
            segment = {
                "name": self._extract_multilang_value(segment_elements.get("Name", {})),
                "description": self._extract_multilang_value(
                    segment_elements.get("Description", {})
                ),
                "recordCount": self._extract_simple_value(
                    segment_elements.get("RecordCount", {})
                ),
                "startTime": self._extract_simple_value(
                    segment_elements.get("StartTime", {})
                ),
                "endTime": self._extract_simple_value(
                    segment_elements.get("EndTime", {})
                ),
                "duration": self._extract_simple_value(
                    segment_elements.get("Duration", {})
                ),
                "samplingInterval": self._extract_simple_value(
                    segment_elements.get("SamplingInterval", {})
                ),
                "samplingRate": self._extract_simple_value(
                    segment_elements.get("SamplingRate", {})
                ),
                "state": self._extract_simple_value(segment_elements.get("State", {})),
                "lastUpdate": self._extract_simple_value(
                    segment_elements.get("LastUpdate", {})
                ),
                # Process records if available
                "records": self._process_records(segment_elements.get("Records", {})),
            }
            internal_segments.append(segment)

        data = {
            "name": self._extract_multilang_value(metadata.get("Name", {})),
            "description": self._extract_multilang_value(
                metadata.get("Description", {})
            ),
            "recordStructure": record_fields,
            "segments": {
                "external": external_segments,
                "linked": linked_segments,
                "internal": internal_segments,
            },
            "rawData": processed_ts,
        }

        return DPPSection(title="Usage Data", data=data)


def get_available_sections(aas_data: dict[str, Any]) -> list[DPPSectionInfo]:
    """Determine available DPP sections based on submodels."""
    sections = []

    # Extract available template IDs from submodels
    available_template_ids = set()
    for submodel in aas_data.get("submodels", []):
        template_id = submodel.get("administration", {}).get("templateId")
        if template_id:
            available_template_ids.add(template_id)

    # Check for each section if its requirements are met
    for section_id, requirements in SECTION_REQUIREMENTS.items():
        # Check if all required submodels are available
        required_templates = requirements["required"]
        has_required = all(req in available_template_ids for req in required_templates)

        # If section has required templates, mark as available
        if has_required and required_templates:
            sections.append(
                DPPSectionInfo(
                    id=section_id,
                    title=requirements["title"],
                    description=requirements.get("description", ""),
                    icon=requirements.get("icon", ""),
                    status=STATUS_AVAILABLE,
                )
            )
        # If section has some optional templates but missing required ones
        elif any(
            opt in available_template_ids for opt in requirements.get("optional", [])
        ):
            sections.append(
                DPPSectionInfo(
                    id=section_id,
                    title=requirements["title"],
                    description=requirements.get("description", ""),
                    icon=requirements.get("icon", ""),
                    status=STATUS_INCOMPLETE,
                )
            )

    return sections


# Map section IDs to processor classes
SECTION_PROCESSORS = {
    "identification": IdentificationSection,
    "compliance": ComplianceSection,
    "technical": TechnicalDataSection,
    "materials": MaterialSection,
    "sustainability": SustainabilitySection,
    "documentation": DocumentationSection,
    "business": BusinessInfoSection,
    "location": LocationSection,
    "usage": UsageSection,
}
