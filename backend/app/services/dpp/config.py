"""Configuration for DPP section mapping and processing."""


# Template IDs for DPP-relevant submodels
class SubmodelIdentifiers:
    """Template IDs for DPP-relevant submodels."""

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
    ASSET_LOCATION = (
        "https://admin-shell.io/idta/SubmodelTemplate/DataModelforAssetLocation/1/0"
    )
    TIME_SERIES = "https://admin-shell.io/idta/SubmodelTemplate/TimeSeries/1/1"


# Status constants for section availability
STATUS_AVAILABLE = "available"
STATUS_INCOMPLETE = "incomplete"
STATUS_UNAVAILABLE = "unavailable"

# Mapping of section IDs to required and optional submodels
SECTION_REQUIREMENTS = {
    "identification": {
        "required": [SubmodelIdentifiers.NAMEPLATE],
        "optional": [],
        "title": "Product Identification",
        "icon": "identification-badge",
        "description": "Basic product and manufacturer identification information",
    },
    "technical": {
        "required": [SubmodelIdentifiers.TECHNICAL_DATA],
        "optional": [],
        "title": "Technical Data",
        "icon": "gear",
        "description": "Technical specifications and parameters",
    },
    "sustainability": {
        "required": [SubmodelIdentifiers.CARBON_FOOTPRINT],
        "optional": [],
        "title": "Environmental Impact",
        "icon": "leaf",
        "description": "Carbon footprint and environmental impact data",
    },
    "business": {
        "required": [SubmodelIdentifiers.CONTACT],
        "optional": [],
        "title": "Business Information",
        "icon": "building",
        "description": "Contact information and business details",
    },
    "materials": {
        "required": [SubmodelIdentifiers.HIERARCHY],
        "optional": [],
        "title": "Materials & Composition",
        "icon": "cube",
        "description": "Product composition and material information",
    },
    "documentation": {
        "required": [SubmodelIdentifiers.DOCUMENTATION],
        "optional": [],
        "title": "Documentation",
        "icon": "file-text",
        "description": "Technical documentation and manuals",
    },
    "compliance": {
        "required": [SubmodelIdentifiers.NAMEPLATE],
        "optional": [],
        "title": "Compliance & Standards",
        "icon": "check-circle",
        "description": "Regulatory compliance and certification information",
    },
    "location": {
        "required": [SubmodelIdentifiers.ASSET_LOCATION],
        "optional": [],
        "title": "Asset Location",
        "icon": "map-pin",
        "description": "Location tracking and history information",
    },
    "usage": {
        "required": [SubmodelIdentifiers.TIME_SERIES],
        "optional": [],
        "title": "Usage Data",
        "icon": "activity",
        "description": "Product usage statistics and history",
    },
}

# EU DPP section priority order (used for display)
EU_DPP_SECTION_ORDER = [
    "identification",
    "compliance",
    "technical",
    "materials",
    "sustainability",
    "business",
    "documentation",
    "location",
    "usage",
]

# Core sections required for minimal viable DPP
CORE_DPP_SECTIONS = ["identification", "technical", "compliance", "sustainability"]

# Map of EU DPP requirements to our section IDs
EU_REQUIREMENT_MAPPING = {
    "product_identification": "identification",
    "technical_specifications": "technical",
    "environmental_footprint": "sustainability",
    "material_composition": "materials",
    "compliance_information": "compliance",
    "usage_instructions": "documentation",
    "contact_details": "business",
}
