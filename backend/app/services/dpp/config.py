"""Configuration for DPP section mapping and processing."""

from enum import Enum

# Status constants for DPP sections
STATUS_AVAILABLE = "available"
STATUS_INCOMPLETE = "incomplete"
STATUS_UNAVAILABLE = "unavailable"


class SubmodelIdentifiers:
    """Template IDs for standard AAS submodels used in the DPP."""

    NAMEPLATE = "https://admin-shell.io/idta/SubmodelTemplate/DigitalNameplate/3/0"
    DOCUMENTATION = (
        "https://admin-shell.io/idta/SubmodelTemplate/HandoverDocumentation/1/0"
    )
    TECHNICAL_DATA = "https://admin-shell.io/ZVEI/TechnicalData/Submodel/1/2"
    CONTACT_INFORMATION = (
        "https://admin-shell.io/idta/SubmodelTemplate/ContactInformation/1/0"
    )
    HIERARCHICAL_STRUCTURE = (
        "https://admin-shell.io/idta/SubmodelTemplate/HierarchicalStructuresBoM/1/1"
    )
    CARBON_FOOTPRINT = (
        "https://admin-shell.io/idta/SubmodelTemplate/CarbonFootprint/0/9"
    )
    TIME_SERIES = "https://admin-shell.io/idta/SubmodelTemplate/TimeSeries/1/1"
    ASSET_LOCATION = (
        "https://admin-shell.io/idta/SubmodelTemplate/DataModelforAssetLocation/1/0"
    )


# Section requirements - match keys with SECTION_PROCESSORS in sections.py
SECTION_REQUIREMENTS = {
    "identification": {
        "title": "Product Identification",
        "icon": "product",
        "description": "Basic product details and identification information",
        "required": [SubmodelIdentifiers.NAMEPLATE],
        "optional": [],
    },
    "business": {  # This key MUST match the key in SECTION_PROCESSORS
        "title": "Business Information",
        "icon": "business",
        "description": "Company and contact information",
        "required": [SubmodelIdentifiers.CONTACT_INFORMATION],
        "optional": [],
    },
    "technical": {  # This key MUST match the key in SECTION_PROCESSORS
        "title": "Technical Data",
        "icon": "technical",
        "description": "Technical specifications and properties",
        "required": [SubmodelIdentifiers.TECHNICAL_DATA],
        "optional": [],
    },
    "materials": {
        "title": "Materials & Composition",
        "icon": "materials",
        "description": "Product composition and material information",
        "required": [SubmodelIdentifiers.HIERARCHICAL_STRUCTURE],
        "optional": [],
    },
    "sustainability": {
        "title": "Environmental Impact",
        "icon": "sustainability",
        "description": "Carbon footprint and environmental information",
        "required": [SubmodelIdentifiers.CARBON_FOOTPRINT],
        "optional": [],
    },
    "documentation": {
        "title": "Documentation",
        "icon": "documentation",
        "description": "Product manuals and technical documentation",
        "required": [SubmodelIdentifiers.DOCUMENTATION],
        "optional": [],
    },
    "location": {
        "title": "Asset Location",
        "icon": "location",
        "description": "Asset tracking and location information",
        "required": [SubmodelIdentifiers.ASSET_LOCATION],
        "optional": [],
    },
    "usage": {
        "title": "Usage Data",
        "icon": "usage",
        "description": "Time series data and usage statistics",
        "required": [SubmodelIdentifiers.TIME_SERIES],
        "optional": [],
    },
    "compliance": {
        "title": "Compliance & Standards",
        "icon": "compliance",
        "description": "Regulatory compliance and certifications",
        "required": [],
        "optional": [SubmodelIdentifiers.NAMEPLATE],
    },
}


# Interface format specifications
class DPPFormat(str, Enum):
    """Format options for DPP data export."""

    JSON = "json"
    HTML = "html"
    PDF = "pdf"
