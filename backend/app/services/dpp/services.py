from datetime import datetime

from sqlmodel import Session

from app.models import CompleteDPP, DPPSection, DPPSectionInfo
from app.services.aas import services as aas_services

from .sections import SECTION_PROCESSORS, get_available_sections


async def get_dpp_sections(aas_id: str, session: Session) -> list[DPPSectionInfo]:
    """Get list of available DPP sections for an AAS."""
    try:
        aas_data = aas_services.get_asset_by_id(aas_id, session)
        return get_available_sections(aas_data)
    except Exception as e:
        raise ValueError(f"Error retrieving DPP sections: {str(e)}")


async def get_dpp_section(aas_id: str, section_id: str, session: Session) -> DPPSection:
    """Get detailed content for a specific DPP section."""
    try:
        aas_data = aas_services.get_asset_by_id(aas_id, session)

        processor_class = SECTION_PROCESSORS.get(section_id)
        if not processor_class:
            raise ValueError(f"Section '{section_id}' not recognized")

        processor = processor_class(aas_data)
        section = processor.process()

        if not section:
            raise ValueError(f"Required data for section '{section_id}' not available")

        return section
    except Exception as e:
        raise ValueError(f"Error retrieving DPP section: {str(e)}")


async def generate_complete_dpp(
    aas_id: str, format: str, session: Session
) -> CompleteDPP:
    """Generate complete DPP in requested format."""
    try:
        aas_data = aas_services.get_asset_by_id(aas_id, session)
        sections = {}

        # Process each available section
        for section_id, processor_class in SECTION_PROCESSORS.items():
            processor = processor_class(aas_data)
            section = processor.process()
            if section:
                sections[section_id] = section

        # Generate metadata for the DPP
        metadata = {
            "generated_by": "DPP Service v1.0",
            "generated_at": datetime.utcnow().isoformat(),
            "aas_version": aas_data.get("administration", {}).get("version"),
            "format": format,
            "source_aas_id": aas_id,
        }

        return CompleteDPP(
            id=aas_id,
            generated_at=datetime.utcnow().isoformat(),
            format=format,
            sections=sections,
            metadata=metadata,
        )
    except Exception as e:
        raise ValueError(f"Error generating complete DPP: {str(e)}")
