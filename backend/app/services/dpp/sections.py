from typing import Any

from app.models import DPPSection, DPPSectionInfo

STATUS_AVAILABLE = "available"
STATUS_INCOMPLETE = "incomplete"
STATUS_UNAVAILABLE = "unavailable"


class SubmodelIdentifiers:
    """Template IDs for DPP-relevant submodels"""

    NAMEPLATE = "https://admin-shell.io/idta/SubmodelTemplate/DigitalNameplate/3/0"
    TECHNICAL_DATA = "https://admin-shell.io/ZVEI/TechnicalData/Submodel/1/2"
    CARBON_FOOTPRINT = (
        "https://admin-shell.io/idta/SubmodelTemplate/CarbonFootprint/0/9"
    )
    CONTACT = "https://admin-shell.io/idta/SubmodelTemplate/ContactInformation/1/0"
    DOCUMENTATION = (
        "https://admin-shell.io/idta/SubmodelTemplate/HandoverDocumentation/1/0"
    )
    HIERARCHY = (
        "https://admin-shell.io/idta/SubmodelTemplate/HierarchicalStructuresBoM/1/1"
    )


class BaseDPPSection:
    """Base class for DPP section processors with complete nested structure handling."""

    def __init__(self, aas_data: dict[str, Any]):
        self.aas_data = aas_data
        self.submodels = {
            sm.get("administration", {}).get("templateId"): sm
            for sm in aas_data.get("submodels", [])
        }

    def get_submodel(self, template_id: str) -> dict[str, Any] | None:
        """Get submodel by template ID."""
        return self.submodels.get(template_id)

    def process_property(self, prop: dict[str, Any]) -> dict[str, Any] | None:
        """Process any type of property with proper type handling."""
        result = {
            "idShort": prop.get("idShort"),
            "modelType": prop.get("modelType"),
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
                result["value"] = bool(value)
            else:  # xs:string, xs:date, xs:dateTime, xs:anyURI treated as strings
                result["value"] = str(value)

        return result

    def process_collection(self, collection: dict[str, Any]) -> dict[str, Any] | None:
        """Process a collection, returning None if no valid elements."""
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

            if processed:
                elements[element_id] = processed

        if not elements:
            return None

        return {
            "idShort": collection.get("idShort"),
            "modelType": collection.get("modelType"),
            "elements": elements,
        }

    def process_list(self, list_element: dict[str, Any]) -> dict[str, Any] | None:
        """Process a SubmodelElementList maintaining its structure."""
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

            if processed:
                elements.append(processed)

        if not elements:
            return None

        return {
            "idShort": list_element.get("idShort"),
            "modelType": "SubmodelElementList",
            "orderRelevant": list_element.get("orderRelevant", False),
            "elements": elements,
        }

    def process_entity(self, entity: dict[str, Any]) -> dict[str, Any] | None:
        """Process an Entity element maintaining its structure."""
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

            if processed:
                statements.append(processed)

        if not statements:
            return None

        return {
            "idShort": entity.get("idShort"),
            "modelType": "Entity",
            "entityType": entity.get("entityType"),
            "statements": statements,
        }

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

            if processed:
                elements[element_id] = processed

        return {
            "metadata": {
                "id": submodel.get("id"),
                "idShort": submodel.get("idShort"),
                "version": submodel.get("administration", {}).get("version"),
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

        data = {
            "product": {
                "name": elements.get("ManufacturerProductDesignation", {}).get("value"),
                "type": elements.get("ManufacturerProductType", {}).get("value"),
                "serial": elements.get("SerialNumber", {}).get("value"),
                "articleNumber": elements.get(
                    "ProductArticleNumberOfManufacturer", {}
                ).get("value"),
                "yearOfConstruction": elements.get("YearOfConstruction", {}).get(
                    "value"
                ),
                "countryOfOrigin": elements.get("CountryOfOrigin", {}).get("value"),
            },
            "manufacturer": {
                "name": elements.get("ManufacturerName", {}).get("value"),
                "productFamily": elements.get("ManufacturerProductFamily", {}).get(
                    "value"
                ),
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

        data = {
            "contacts": [
                {
                    "role": elements.get("RoleOfContactPerson", {}).get("value"),
                    "company": elements.get("Company", {}).get("value"),
                    "department": elements.get("Department", {}).get("value"),
                    "address": {
                        "street": elements.get("Street", {}).get("value"),
                        "city": elements.get("CityTown", {}).get("value"),
                        "postCode": elements.get("Zipcode", {}).get("value"),
                        "country": elements.get("NationalCode", {}).get("value"),
                    },
                    "communication": {
                        "email": elements.get("Email", {})
                        .get("elements", {})
                        .get("EmailAddress", {})
                        .get("value"),
                        "phone": elements.get("Phone", {})
                        .get("elements", {})
                        .get("TelephoneNumber", {})
                        .get("value"),
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

        return DPPSection(title="Technical Data", data=self.process_submodel(tech_data))


class SustainabilitySection(BaseDPPSection):
    """Sustainability information processor."""

    def process(self) -> DPPSection | None:
        carbon = self.get_submodel(SubmodelIdentifiers.CARBON_FOOTPRINT)
        if not carbon:
            return None

        processed_carbon = self.process_submodel(carbon)
        elements = processed_carbon.get("elements", {})
        pcf = elements.get("ProductCarbonFootprint", {}).get("elements", {})

        if not pcf:
            return None

        data = {
            "carbonFootprint": {
                "value": pcf.get("PCFCO2eq", {}).get("value"),
                "unit": "kg CO2 eq",
                "calculationMethod": pcf.get("PCFCalculationMethod", {}).get("value"),
                "validFrom": pcf.get("PublicationDate", {}).get("value"),
                "validUntil": pcf.get("ExpirationDate", {}).get("value"),
                "lifecycle": {
                    "phases": pcf.get("PCFLifeCyclePhase", {}).get("value"),
                    "reference": pcf.get("PCFReferenceValueForCalculation", {}).get(
                        "value"
                    ),
                },
            }
        }

        return DPPSection(title="Environmental Impact", data=data)


class ComplianceSection(BaseDPPSection):
    """Standards and compliance information"""

    def process(self) -> DPPSection | None:
        nameplate = self.get_submodel(SubmodelIdentifiers.NAMEPLATE)
        if not nameplate:
            return None

        markings = next(
            (
                x
                for x in nameplate.get("submodelElements", [])
                if x.get("idShort") == "Markings"
            ),
            None,
        )

        data = {"certifications": [], "standards": [], "markings": []}

        if markings:
            for marking in markings.get("value", []):
                marking_data = self.process_collection(marking)
                if marking_data:
                    data["markings"].append(
                        {
                            "name": marking_data.get("MarkingName"),
                            "file": marking_data.get("MarkingFile"),
                            "validFrom": marking_data.get("MarkingValidFrom"),
                            "validUntil": marking_data.get("MarkingValidUntil"),
                        }
                    )

        return DPPSection(title="Compliance & Standards", data=data)


class MaterialSection(BaseDPPSection):
    """Material composition and circularity information"""

    def process(self) -> DPPSection | None:
        hierarchy = self.get_submodel(SubmodelIdentifiers.HIERARCHY)
        if not hierarchy:
            return None

        def process_node(node: dict[str, Any]) -> dict[str, Any]:
            result = {
                "id": node.get("idShort"),
                "type": node.get("entityType"),
                "components": [],
            }

            statements = node.get("statements", [])
            for statement in statements:
                if statement.get("modelType") == "Entity":
                    result["components"].append(process_node(statement))

            return result

        entry_node = next(
            (
                x
                for x in hierarchy.get("submodelElements", [])
                if x.get("idShort") == "EntryNode"
            ),
            None,
        )

        data = {
            "structure": process_node(entry_node) if entry_node else {},
            "recycling": {
                "recyclable": True,  # This should come from actual data
                "materials": [],  # This should be populated with actual materials
            },
        }

        return DPPSection(title="Materials & Composition", data=data)


class DocumentationSection(BaseDPPSection):
    """Product documentation and manuals"""

    def process(self) -> DPPSection | None:
        docs = self.get_submodel(SubmodelIdentifiers.DOCUMENTATION)
        if not docs:
            return None

        data = {"documents": []}

        doc_elements = [
            elem
            for elem in docs.get("submodelElements", [])
            if elem.get("idShort", "").startswith("Document")
        ]

        for doc in doc_elements:
            doc_data = self.process_collection(doc)
            if doc_data:
                doc_info = {
                    "id": doc_data.get("DocumentId", {}).get("DocumentIdentifier"),
                    "title": doc_data.get("DocumentVersion", {}).get("Title"),
                    "type": doc_data.get("DocumentClassification", {}).get("ClassId"),
                    "version": doc_data.get("DocumentVersion", {}).get("Version"),
                    "language": doc_data.get("DocumentVersion", {}).get("Language"),
                    "file": doc_data.get("DocumentVersion", {}).get("DigitalFile"),
                }
                data["documents"].append(doc_info)

        return DPPSection(title="Documentation", data=data)


SECTION_PROCESSORS = {
    "identification": IdentificationSection,
    "compliance": ComplianceSection,
    "technical": TechnicalDataSection,
    "materials": MaterialSection,
    "sustainability": SustainabilitySection,
    "documentation": DocumentationSection,
}


def get_available_sections(aas_data: dict[str, Any]) -> list[DPPSectionInfo]:
    """Determine available DPP sections based on submodels."""
    sections = []

    for section_id, processor_class in SECTION_PROCESSORS.items():
        processor = processor_class(aas_data)
        section = processor.process()

        if section:
            sections.append(
                DPPSectionInfo(
                    id=section_id, title=section.title, status=STATUS_AVAILABLE
                )
            )

    return sections
