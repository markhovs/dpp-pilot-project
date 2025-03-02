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

    def process(self) -> DPPSection | None:
        """
        Process the section.
        Override in subclasses to implement specific section processing.

        Returns:
            Processed DPP section or None if data is not available
        """
        return None


class IdentificationSection(BaseDPPSection):
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

        # Filter out elements that we've already extracted into specific fields
        extracted_keys = [
            "ManufacturerProductDesignation",
            "ManufacturerName",
            "ManufacturerProductFamily",
            "ManufacturerProductType",
            "SerialNumber",
            "ProductArticleNumberOfManufacturer",
            "YearOfConstruction",
            "CountryOfOrigin",
            "DateOfManufacture",
            "CompanyLogo",
            "OrderCodeOfManufacturer",
            "URIOfTheProduct",
            "HardwareVersion",
            "SoftwareVersion",
            "FirmwareVersion",
        ]

        additional_data = {
            "metadata": processed_nameplate.get("metadata", {}),
            "elements": {},
        }

        # Only include elements we haven't explicitly handled
        for key, value in elements.items():
            if key not in extracted_keys:
                additional_data["elements"][key] = value

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
            "additionalData": additional_data,
        }

        return DPPSection(title="Product Identification", data=data)


class BusinessInfoSection(BaseDPPSection):
    """Business and contact information"""

    def process(self) -> DPPSection | None:
        contact = self.get_submodel(SubmodelIdentifiers.CONTACT_INFORMATION)
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

        # Create filtered additionalData that only includes unhandled properties
        extracted_elements = [
            "RoleOfContactPerson",
            "Company",
            "Department",
            "FirstName",
            "Title",
            "AcademicTitle",
            "Street",
            "CityTown",
            "Zipcode",
            "NationalCode",
            "StateCounty",
            "Email",
            "Phone",
            "Language",
            "TimeZone",
        ]

        additional_data = {"metadata": processed_contact.get("metadata", {})}

        # Create a structure that only includes elements not explicitly extracted
        filtered_elements = {}
        for key, value in processed_contact.get("elements", {}).items():
            if (
                key != "ContactInformation"
            ):  # Keep anything that isn't the main ContactInformation
                filtered_elements[key] = value

        # For ContactInformation, filter out the elements we've already extracted
        if "ContactInformation" in processed_contact.get("elements", {}):
            contact_info_copy = processed_contact["elements"][
                "ContactInformation"
            ].copy()
            filtered_ci_elements = {}

            for key, value in elements.items():
                if key not in extracted_elements:
                    filtered_ci_elements[key] = value

            if filtered_ci_elements:
                contact_info_copy["elements"] = filtered_ci_elements
                filtered_elements["ContactInformation"] = contact_info_copy

        if filtered_elements:
            additional_data["elements"] = filtered_elements

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
            ],
            "additionalData": additional_data,
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

        # Create filtered additionalData with only properties not covered in the structured data
        extracted_keys = [
            "GeneralInformation",
            "ProductClassifications",
            "TechnicalProperties",
            "FurtherInformation",
        ]

        additional_data = {"metadata": processed_data.get("metadata", {})}

        # Only include elements we haven't explicitly handled
        filtered_elements = {}
        for key, value in elements.items():
            if key not in extracted_keys:
                filtered_elements[key] = value

        if filtered_elements:
            additional_data["elements"] = filtered_elements

        # Return both the structured summary and complete data
        return DPPSection(
            title="Technical Data",
            data={
                "summary": summary,
                "generalInformation": general_info,
                "classifications": classifications.get("ProductClassificationItem", {}),
                "technicalProperties": tech_props,
                "furtherInformation": further_info,
                "additionalData": additional_data,
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

        # Create filtered additionalData with only properties not covered in the structured data
        extracted_keys = ["ProductCarbonFootprint", "TransportCarbonFootprint"]

        additional_data = {"metadata": processed_carbon.get("metadata", {})}

        # Only include elements we haven't explicitly handled
        filtered_elements = {}
        for key, value in elements.items():
            if key not in extracted_keys:
                filtered_elements[key] = value

        if filtered_elements:
            additional_data["elements"] = filtered_elements

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
            "additionalData": additional_data,
        }

        return DPPSection(title="Environmental Impact", data=data)


class ComplianceSection(BaseDPPSection):
    """Standards and compliance information"""

    def process(self) -> DPPSection | None:
        nameplate = self.get_submodel(SubmodelIdentifiers.NAMEPLATE)
        if not nameplate:
            return None

        # Extract markings with detailed structure but cleaner representation
        markings = []
        markings_element = None

        # Find the Markings element
        for element in nameplate.get("submodelElements", []):
            if element.get("idShort") == "Markings":
                markings_element = element
                break

        if (
            markings_element
            and markings_element.get("modelType") == "SubmodelElementList"
        ):
            for marking_item in markings_element.get("value", []):
                # Create a clean but comprehensive marking object
                marking_data = {
                    "properties": {},  # Will store cleaned properties
                    "name": None,  # Convenient access fields
                    "file": None,
                    "designation": None,
                    "issueDate": None,
                    "expiryDate": None,
                    "additionalText": None,
                }

                # Process each property while preserving essential structure
                for prop in marking_item.get("value", []):
                    prop_id = prop.get("idShort")

                    # Create a clean property representation
                    clean_prop = {
                        "value": prop.get("value"),
                        "modelType": prop.get("modelType"),
                    }

                    # Keep important metadata but skip qualifiers
                    if "semanticId" in prop:
                        clean_prop["semanticId"] = prop["semanticId"]

                    if "description" in prop:
                        clean_prop["description"] = prop["description"]

                    if "contentType" in prop and prop.get("modelType") == "File":
                        clean_prop["contentType"] = prop["contentType"]

                    # Store the cleaned property
                    marking_data["properties"][prop_id] = clean_prop

                    # Also set the convenience access fields
                    if prop_id == "MarkingName":
                        marking_data["name"] = prop.get("value")
                    elif prop_id == "MarkingFile":
                        marking_data["file"] = prop.get("value")
                    elif prop_id == "DesignationOfCertificateOrApproval":
                        marking_data["designation"] = prop.get("value")
                    elif prop_id == "IssueDate":
                        marking_data["issueDate"] = prop.get("value")
                    elif prop_id == "ExpiryDate":
                        marking_data["expiryDate"] = prop.get("value")
                    elif prop_id == "MarkingAdditionalText":
                        marking_data["additionalText"] = prop.get("value")

                # Only add marking if it has at least one populated field
                if any(
                    v
                    for v in [
                        marking_data["name"],
                        marking_data["file"],
                        marking_data["designation"],
                    ]
                ):
                    markings.append(marking_data)

        # Extract certifications and standards with clean structure
        certifications = []
        standards = []
        asset_specific_element = None

        for element in nameplate.get("submodelElements", []):
            if element.get("idShort") == "AssetSpecificProperties":
                asset_specific_element = element
                break

        if asset_specific_element:
            for prop in asset_specific_element.get("value", []):
                prop_id = prop.get("idShort", "").lower()

                # Skip non-property elements and empty values
                if prop.get("modelType") not in [
                    "Property",
                    "MultiLanguageProperty",
                    "File",
                ]:
                    continue

                if "value" not in prop:
                    continue

                # Create clean property object similar to how materials section works
                clean_prop = {
                    "name": prop.get("idShort"),
                    "value": prop.get("value"),
                    "modelType": prop.get("modelType"),
                }

                # Keep important metadata but not qualifiers
                if "semanticId" in prop:
                    clean_prop["semanticId"] = prop["semanticId"]

                if "description" in prop:
                    clean_prop["description"] = prop["description"]

                if prop.get("modelType") == "File" and "contentType" in prop:
                    clean_prop["contentType"] = prop["contentType"]

                # Classify properties based on naming patterns
                if (
                    "certif" in prop_id
                    or "compliance" in prop_id
                    or "conform" in prop_id
                ):
                    certifications.append(clean_prop)
                elif "standard" in prop_id or "norm" in prop_id or "iso" in prop_id:
                    standards.append(clean_prop)

        # Create a clean section without unwanted details
        return DPPSection(
            title="Compliance & Standards",
            data={
                "markings": markings,  # Single, comprehensive markings array
                "certifications": certifications,
                "standards": standards,
                # We drop the "elements" property to keep things cleaner
            },
        )


class MaterialSection(BaseDPPSection):
    """Material composition and circularity information"""

    def _process_entity_structure(self, entity_node: dict, visited_nodes=None) -> dict:
        """
        Recursively process an entity node and all its statements into a clean structure
        preserving the exact hierarchical position of all properties and semantic information

        Args:
            entity_node: The entity node to process
            visited_nodes: Set of node IDs already visited (for cycle detection)

        Returns:
            Processed entity structure with DPP-relevant data
        """
        if visited_nodes is None:
            visited_nodes = set()

        if not entity_node or not isinstance(entity_node, dict):
            return {}

        # Generate unique ID for cycle detection - FIX THE QUOTES HERE
        node_id = f"{entity_node.get('idShort', '')}-{id(entity_node)}"
        if node_id in visited_nodes:
            return {"id": entity_node.get("idShort", "Recursive"), "type": "Reference"}

        visited_nodes.add(node_id)

        # Create node structure with essential information including semantic data
        result = {
            "id": entity_node.get("idShort", "Unknown"),
            "type": entity_node.get("entityType", "Unknown"),
            "components": [],
            "modelType": entity_node.get("modelType"),  # Keep modelType
        }

        # Include semanticId if available (important for DPP context)
        if "semanticId" in entity_node:
            result["semanticId"] = entity_node["semanticId"]

        # Include globalAssetId if available (important for asset reference)
        if "globalAssetId" in entity_node:
            result["globalAssetId"] = entity_node["globalAssetId"]

        # Include description
        if "description" in entity_node:
            result["description"] = entity_node["description"]

        # Process all statements while dynamically attaching properties directly to the node
        if "statements" in entity_node and isinstance(entity_node["statements"], list):
            for statement in entity_node["statements"]:
                stmt_id = statement.get("idShort")
                stmt_type = statement.get("modelType")

                # Skip invalid statements without an ID
                if not stmt_id:
                    continue

                # Process based on statement type
                if stmt_type == "Property":
                    # Process property with metadata
                    prop_obj = {
                        "value": None,  # Default value is null
                        "valueType": statement.get("valueType", "unknown"),
                        "modelType": "Property",  # Keep modelType
                    }

                    # Include semanticId if available
                    if "semanticId" in statement:
                        prop_obj["semanticId"] = statement["semanticId"]

                    # Add description if available
                    if "description" in statement:
                        prop_obj["description"] = statement["description"]

                    # Extract and convert value based on type
                    if "value" in statement:
                        value = statement["value"]
                        value_type = statement.get("valueType")

                        if (
                            value_type == "xs:integer"
                            or value_type == "xs:unsignedLong"
                        ):
                            try:
                                prop_obj["value"] = int(value)
                            except (ValueError, TypeError):
                                prop_obj["value"] = value
                        elif value_type in ["xs:double", "xs:float"]:
                            try:
                                prop_obj["value"] = float(value)
                            except (ValueError, TypeError):
                                prop_obj["value"] = value
                        elif value_type == "xs:boolean":
                            if isinstance(value, str):
                                prop_obj["value"] = value.lower() in (
                                    "true",
                                    "1",
                                    "yes",
                                )
                            else:
                                prop_obj["value"] = bool(value)
                        else:
                            prop_obj["value"] = value

                    # Set the property in the result
                    result[stmt_id] = prop_obj

                elif stmt_type == "MultiLanguageProperty":
                    # Process MultiLanguageProperty with metadata
                    result[stmt_id] = {
                        "value": statement.get("value", []),
                        "modelType": "MultiLanguageProperty",
                    }
                    if "semanticId" in statement:
                        result[stmt_id]["semanticId"] = statement["semanticId"]
                    if "description" in statement:
                        result[stmt_id]["description"] = statement["description"]

                elif stmt_type == "File":
                    # Process File with metadata
                    result[stmt_id] = {
                        "value": statement.get("value"),
                        "contentType": statement.get("contentType"),
                        "modelType": "File",
                    }
                    if "semanticId" in statement:
                        result[stmt_id]["semanticId"] = statement["semanticId"]
                    if "description" in statement:
                        result[stmt_id]["description"] = statement["description"]

                elif stmt_type == "Entity":
                    # Process nested entity recursively
                    component = self._process_entity_structure(statement, visited_nodes)
                    if component:  # Only add non-empty components
                        result["components"].append(component)

        return result

    def process(self) -> DPPSection | None:
        """Process material composition information with better additionalData handling."""
        # Find the hierarchical structure submodel
        hierarchy = self.get_submodel(SubmodelIdentifiers.HIERARCHICAL_STRUCTURE)
        if not hierarchy:
            return None

        # Process the submodel for a general overview
        processed_hierarchy = self.process_submodel(hierarchy)

        # Extract top-level properties directly
        elements = processed_hierarchy.get("elements", {})
        arche_type = None
        if "ArcheType" in elements and "value" in elements["ArcheType"]:
            arche_type = elements["ArcheType"]["value"]

        # Find the entry node for exact structure processing
        entry_node = None
        for element in hierarchy.get("submodelElements", []):
            if (
                element.get("idShort") == "EntryNode"
                and element.get("modelType") == "Entity"
            ):
                entry_node = element
                break

        # Process the component structure
        structure = {}
        if entry_node:
            structure = self._process_entity_structure(entry_node)

        # Extract recycling information by dynamically searching the entire structure
        recycling_info = {
            "recyclable": True,  # Default assumption
            "materials": [],
        }

        def find_properties_anywhere(data, path=""):
            """Recursively search for properties anywhere in the structure."""
            if isinstance(data, dict):
                for key, value in list(data.items()):
                    current_path = f"{path}.{key}" if path else key

                    # Skip certain structural keys that aren't properties
                    if key in ["components", "id", "type"]:
                        continue

                    # Process based on the key and value type
                    key_str = str(key).lower()

                    # Check for recycling indicators
                    if "recycl" in key_str:
                        if isinstance(value, dict) and "value" in value:
                            # Extract value from property object
                            actual_value = value["value"]
                            if isinstance(actual_value, bool):
                                recycling_info["recyclable"] = actual_value
                            elif isinstance(actual_value, str):
                                recycling_info["recyclable"] = actual_value.lower() in (
                                    "true",
                                    "1",
                                    "yes",
                                )
                        elif not isinstance(value, (dict | list)):
                            # Direct value
                            if isinstance(value, bool):
                                recycling_info["recyclable"] = value
                            elif isinstance(value, str):
                                recycling_info["recyclable"] = value.lower() in (
                                    "true",
                                    "1",
                                    "yes",
                                )

                    # Check for material information
                    if any(term in key_str for term in ["material", "substance"]):
                        material_info = {}

                        # Extract metadata for property objects
                        if isinstance(value, dict):
                            material_name = key
                            material_value = value.get("value")

                            if "semanticId" in value:
                                material_info["semanticId"] = value["semanticId"]

                            material_info.update(
                                {
                                    "name": material_name,
                                    "path": current_path,
                                    "value": material_value,
                                }
                            )

                            recycling_info["materials"].append(material_info)
                        elif not isinstance(value, list):
                            # For direct values
                            recycling_info["materials"].append(
                                {"name": key, "path": current_path, "value": value}
                            )

                    # Recursively process nested dictionaries
                    if isinstance(value, dict):
                        find_properties_anywhere(value, current_path)

                # Continue recursion for nested components
                if "components" in data and isinstance(data["components"], list):
                    for i, component in enumerate(data["components"]):
                        component_path = f"{path}.components[{i}]"
                        find_properties_anywhere(component, component_path)

            elif isinstance(data, list):
                for i, item in enumerate(data):
                    item_path = f"{path}[{i}]"
                    if isinstance(item, (dict | list)):
                        find_properties_anywhere(item, item_path)

        # Search through the complete structure
        find_properties_anywhere(structure)

        # Create filtered additionalData with only properties not already extracted
        extracted_keys = ["EntryNode", "ArcheType"]

        additional_data = {
            "metadata": processed_hierarchy.get("metadata", {}),
            "elements": {},
        }

        # Only include elements we haven't explicitly handled
        for key, value in elements.items():
            if key not in extracted_keys:
                additional_data["elements"][key] = value

        data = {
            "structure": structure,
            "archeType": arche_type,
            "recycling": recycling_info,
            "additionalData": additional_data,
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

        # Create filtered additionalData with only properties not covered in the structured data
        extracted_keys = []
        for key in elements.keys():
            if key.startswith("Document") or key == "numberOfDocuments":
                extracted_keys.append(key)

        additional_data = {"metadata": processed_docs.get("metadata", {})}

        # Only include elements we haven't explicitly handled
        filtered_elements = {}
        for key, value in elements.items():
            if key not in extracted_keys:
                filtered_elements[key] = value

        if filtered_elements:
            additional_data["elements"] = filtered_elements

        data = {
            "documents": documents,
            "totalDocuments": elements.get("numberOfDocuments", {}).get("value"),
            "additionalData": additional_data,
        }

        return DPPSection(title="Documentation", data=data)


class LocationSection(BaseDPPSection):
    """Asset location tracking and traceability information"""

    def process(self) -> DPPSection | None:
        location = self.get_submodel(SubmodelIdentifiers.ASSET_LOCATION)
        if not location:
            return None

        processed_location = self.process_submodel(location)
        elements = processed_location.get("elements", {})

        # Create filtered additionalData with only properties not already extracted
        extracted_keys = ["AssetLocatingInformation", "AssetTraces"]

        additional_data = {"metadata": processed_location.get("metadata", {})}

        # Only include elements we haven't explicitly handled
        filtered_elements = {}
        for key, value in elements.items():
            if key not in extracted_keys:
                filtered_elements[key] = value

        if filtered_elements:
            additional_data["elements"] = filtered_elements

        # Build a comprehensive data structure with all existing data
        data = {
            # Always include title and description
            "title": self._extract_display_name(location),
            "description": self._extract_description(location),
            # Process the key structures while preserving original data
            "trackingCapabilities": self._process_tracking_capabilities(elements),
            "traceability": self._process_traceability(elements),
            # Include fields (including empty ones) for structural consistency
            "addresses": [],
            "coordinateSystems": [],
            "visitedAreas": [],
            # Include filtered additionalData
            "additionalData": additional_data,
        }

        # Process areas if they exist - overriding the empty arrays only when we find them
        addresses_element = self._find_element_by_id(
            location.get("submodelElements", []), "Addresses"
        )
        if addresses_element:
            data["addresses"] = self._process_addresses(addresses_element)

        coordinates_element = self._find_element_by_id(
            location.get("submodelElements", []), "CoordinateSystems"
        )
        if coordinates_element:
            data["coordinateSystems"] = self._process_coordinate_systems(
                coordinates_element
            )

        areas_element = self._find_element_by_id(
            location.get("submodelElements", []), "VisitedAreas"
        )
        if areas_element:
            data["visitedAreas"] = self._process_visited_areas(areas_element)

        return DPPSection(title="Asset Location & Traceability", data=data)

    def _find_element_by_id(self, elements: list, id_short: str) -> dict:
        """Find an element by its idShort."""
        for element in elements:
            if element.get("idShort") == id_short:
                return element
        return {}

    def _extract_display_name(self, element):
        """Extract display name from an element."""
        if not element:
            return {}

        if "displayName" in element:
            return {
                item.get("language"): item.get("text")
                for item in element.get("displayName", [])
                if "language" in item and "text" in item
            }
        return {}

    def _extract_description(self, element):
        """Extract description from an element."""
        if not element:
            return {}

        if "description" in element:
            return {
                item.get("language"): item.get("text")
                for item in element.get("description", [])
                if "language" in item and "text" in item
            }
        return {}

    def _process_tracking_capabilities(self, elements):
        """Process asset location capabilities preserving original structure."""
        asset_locating = elements.get("AssetLocatingInformation", {})
        if not asset_locating:
            return {}

        locating_elements = asset_locating.get("elements", {})
        if not locating_elements:
            return {}

        result = {}

        # Process each capability while preserving original metadata
        for key, element in locating_elements.items():
            if key == "Localizable":
                result["localizable"] = {
                    "value": element.get("value", False),
                    "displayName": element.get("displayName", {}),
                }
            elif key == "AssetLocationServiceRealTimeCapability":
                result["realTimeCapability"] = {
                    "value": element.get("value", {}),
                    "displayName": element.get("displayName", {}),
                    "description": element.get("description", {}),
                }
            elif key == "RealtimeLocationSourceType":
                result["sourceType"] = {
                    "value": element.get("value", ""),
                    "displayName": element.get("displayName", {}),
                }
            elif key == "RealtimeLocationSource":
                result["source"] = {
                    "value": element.get("value", {}),
                    "displayName": element.get("displayName", {}),
                }
            # Process any other elements preserving full structure and metadata
            else:
                result[self._normalize_field_name(key)] = {
                    "value": element.get("value"),
                    "displayName": element.get("displayName", {}),
                    "description": element.get("description", {}),
                    "semanticId": element.get("semanticId", {}),
                }

        return result

    def _process_addresses(self, addresses_element):
        """Process address data from the raw element."""
        addresses = []

        # Process each address in the collection
        for address in addresses_element.get("value", []):
            address_data = {
                "metadata": {
                    "displayName": self._extract_display_name(address),
                    "description": self._extract_description(address),
                },
                "data": {},
            }

            # Process address fields - include fields even if value is null/undefined
            address_fields = {
                "AddressLine1": "addressLine1",
                "AddressLine2": "addressLine2",
                "AddressLine3": "addressLine3",
                "Citytown": "city",
                "City": "city",
                "Street": "street",
                "Statecounty": "state",
                "StateCounty": "state",
                "ZipCode": "zip",
                "NationalCode": "country",
                "AddressRemarks": "remarks",
                "AddressOfAdditionalLink": "additionalLink",
            }

            # First loop to find all fields regardless of their value
            for field in address.get("value", []):
                field_id = field.get("idShort")
                if not field_id:
                    continue

                # Map standard fields to consistent names
                mapped_name = address_fields.get(
                    field_id, self._normalize_field_name(field_id)
                )

                # Always include the field even if value is null
                if "value" in field:
                    address_data["data"][mapped_name] = field["value"]
                else:
                    address_data["data"][mapped_name] = None

            addresses.append(address_data)

        return addresses

    def _process_coordinate_systems(self, coord_systems_element):
        """Process coordinate systems data from the raw element."""
        coordinate_systems = []

        # Process each coordinate system
        for cs in coord_systems_element.get("value", []):
            cs_data = {
                "metadata": {
                    "displayName": self._extract_display_name(cs),
                    "description": self._extract_description(cs),
                },
                "properties": {},
                "groundControlPoints": [],
            }

            # Standard coordinate system field mapping
            cs_fields = {
                "CoordinateSystemName": "name",
                "CoordinateSystemId": "id",
                "CoordinateSystemType": "type",
                "CoordinateSystemAccuracy": "accuracy",
                "CoordinateSystemUnit": "unit",
                "ElevationReference": "elevationReference",
                "SeaLevelOfBaseHeight": "seaLevelBaseHeight",
            }

            # Process all properties including null values
            for field in cs.get("value", []):
                if not field or "idShort" not in field:
                    continue

                field_id = field["idShort"]

                # Special handling for ground control points
                if field_id == "GroundControlPoints":
                    cs_data[
                        "groundControlPoints"
                    ] = self._process_ground_control_points(field)
                    continue

                # Handle regular properties - include even if value is null/empty
                field_name = cs_fields.get(
                    field_id, self._normalize_field_name(field_id)
                )
                cs_data["properties"][field_name] = field.get("value")

            coordinate_systems.append(cs_data)

        return coordinate_systems

    def _process_ground_control_points(self, gcp_element):
        """Process ground control points data."""
        points = []

        for point in gcp_element.get("value", []):
            point_data = {"geographic": {}, "relative": {}}

            # Process geographic and relative coordinates including nulls
            for coord_element in point.get("value", []):
                if coord_element.get("idShort") == "GeographicCoordinates":
                    # Process all geographic coordinates
                    for geo_coord in coord_element.get("value", []):
                        if geo_coord.get("idShort") in [
                            "Longitude",
                            "Latitude",
                            "Altitude",
                        ]:
                            point_data["geographic"][
                                geo_coord["idShort"].lower()
                            ] = geo_coord.get("value")

                elif coord_element.get("idShort") == "RelativeCoordinates":
                    # Process all relative coordinates
                    for rel_coord in coord_element.get("value", []):
                        if rel_coord.get("idShort") in ["X", "Y", "Z"]:
                            point_data["relative"][
                                rel_coord["idShort"].lower()
                            ] = rel_coord.get("value")

                # Add any other coordinate elements that don't fit the standard structure
                else:
                    field_name = self._normalize_field_name(
                        coord_element.get("idShort", "")
                    )
                    if field_name:
                        point_data[field_name] = coord_element.get("value")

            points.append(point_data)

        return points

    def _process_visited_areas(self, visited_areas_element):
        """Process visited areas data from the raw element."""
        areas = []

        for area in visited_areas_element.get("value", []):
            area_data = {
                "metadata": {
                    "displayName": self._extract_display_name(area),
                    "description": self._extract_description(area),
                },
                "properties": {},
                "regionCoordinates": [],
                "addressReferences": [],
            }

            # Process all area properties including nulls
            for field in area.get("value", []):
                if not field or "idShort" not in field:
                    continue

                field_id = field["idShort"]

                # Special handling for nested collections
                if field_id == "AreaRegionCoordinates":
                    area_data["regionCoordinates"] = self._process_region_coordinates(
                        field
                    )
                elif field_id == "AddressReferences":
                    area_data["addressReferences"] = self._process_address_references(
                        field
                    )
                else:
                    # Handle different property types
                    if field.get("modelType") == "ReferenceElement":
                        area_data["properties"][
                            self._normalize_field_name(field_id)
                        ] = field.get("value")
                    elif field.get("modelType") == "File":
                        area_data["properties"][
                            self._normalize_field_name(field_id)
                        ] = field.get("value")
                    elif field.get("modelType") == "MultiLanguageProperty":
                        area_data["properties"][
                            self._normalize_field_name(field_id)
                        ] = field.get("value", [])
                    else:
                        # Regular property - include even if value is null
                        area_data["properties"][
                            self._normalize_field_name(field_id)
                        ] = field.get("value")

            areas.append(area_data)

        return areas

    def _process_region_coordinates(self, coordinates_element):
        """Process region coordinates for an area."""
        coordinates = []

        for coord in coordinates_element.get("value", []):
            coord_data = {}

            # Process all fields including nulls
            for field in coord.get("value", []):
                if not field or "idShort" not in field:
                    continue

                field_id = field["idShort"]

                # Handle X, Y, Z coordinates - they may be strings that need conversion in UI
                if field_id in ["X", "Y", "Z"]:
                    coord_data[field_id.lower()] = field.get("value")
                else:
                    coord_data[self._normalize_field_name(field_id)] = field.get(
                        "value"
                    )

            coordinates.append(coord_data)

        return coordinates

    def _process_address_references(self, references_element):
        """Process address references for an area."""
        references = []

        for ref in references_element.get("value", []):
            ref_data = {
                "value": ref.get("value"),
                "description": self._extract_description(ref),
            }

            # Add any other available fields for completeness
            if "semanticId" in ref:
                ref_data["semanticId"] = ref["semanticId"]

            references.append(ref_data)

        return references

    def _process_traceability(self, elements):
        """Process asset traces preserving all original data."""
        asset_traces = elements.get("AssetTraces", {})
        if not asset_traces:
            return {}

        result = {
            "displayName": asset_traces.get("displayName", {}),
            "description": asset_traces.get("description", {}),
            "references": {},
            "records": {"area": [], "location": []},
        }

        # Process reference elements
        for key, element in asset_traces.get("elements", {}).items():
            if element.get("modelType") == "ReferenceElement":
                field_name = self._normalize_field_name(key)
                result["references"][field_name] = {
                    "type": "reference",
                    "value": element.get("value", {}),
                    "description": element.get("description", {}),
                }

                if "semanticId" in element:
                    result["references"][field_name]["semanticId"] = element[
                        "semanticId"
                    ]

        # Process area records
        area_records = asset_traces.get("elements", {}).get("AreaRecords", {})
        if area_records:
            for record in area_records.get("value", []):
                record_data = {}

                for field in record.get("value", []):
                    if not field or "idShort" not in field:
                        continue

                    field_name = self._normalize_field_name(field["idShort"])

                    # Handle different field types
                    if field.get("modelType") == "ReferenceElement":
                        record_data[field_name] = field.get("value", {})
                    else:
                        record_data[field_name] = field.get("value")

                result["records"]["area"].append(record_data)

        # Process location records
        location_records = asset_traces.get("elements", {}).get("LocationRecords", {})
        if location_records:
            for record in location_records.get("value", []):
                record_data = {}

                for field in record.get("value", []):
                    if not field or "idShort" not in field:
                        continue

                    field_id = field["idShort"]
                    field_name = self._normalize_field_name(field_id)

                    # Special handling for Position
                    if (
                        field_id == "Position"
                        and field.get("modelType") == "SubmodelElementCollection"
                    ):
                        position = {}

                        for pos_field in field.get("value", []):
                            if pos_field.get("idShort") in ["X", "Y", "Z"]:
                                position[pos_field["idShort"].lower()] = pos_field.get(
                                    "value"
                                )

                        record_data["position"] = position
                    else:
                        # Regular property - include even if value is null
                        record_data[field_name] = field.get("value")

                result["records"]["location"].append(record_data)

        return result

    def _normalize_field_name(self, name):
        """Convert field names to camelCase."""
        if not name:
            return ""

        # Handle special cases for numeric indexes in names
        if "__" in name:
            name = name.replace("__", "_")

        parts = name.split("_")
        result = parts[0].lower()
        for part in parts[1:]:
            if part:
                result += part[0].upper() + part[1:].lower()

        return result


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

        # Create filtered additionalData with only properties not already extracted
        extracted_keys = ["Metadata", "Segments"]

        additional_data = {"metadata": processed_ts.get("metadata", {})}

        # Only include elements we haven't explicitly handled
        filtered_elements = {}
        for key, value in elements.items():
            if key not in extracted_keys:
                filtered_elements[key] = value

        if filtered_elements:
            additional_data["elements"] = filtered_elements

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
            "additionalData": additional_data,
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
    "compliance": ComplianceSection,  # Changed from "technical"
    "technical": TechnicalDataSection,  # Changed from "business"
    "materials": MaterialSection,
    "sustainability": SustainabilitySection,
    "documentation": DocumentationSection,
    "business": BusinessInfoSection,  # This matches the config now
    "location": LocationSection,
    "usage": UsageSection,
}
