from fastapi import APIRouter, HTTPException

from app.api.deps import SessionDep
from app.models import CompleteDPP, DPPSection, DPPSectionInfo
from app.services.dpp import services as dpp_services

router = APIRouter(prefix="/dpp", tags=["DPP"])


@router.get(
    "/{aas_id}/sections",
    response_model=list[DPPSectionInfo],
    summary="List available DPP sections",
)
async def list_dpp_sections(aas_id: str, session: SessionDep) -> list[DPPSectionInfo]:
    """
    Get available DPP sections and their metadata.

    Args:
        aas_id: ID of the AAS to generate DPP for
        session: Database session dependency

    Returns:
        List of available DPP sections with their status
    """
    try:
        return await dpp_services.get_dpp_sections(aas_id, session)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/{aas_id}/section/{section_id}",
    response_model=DPPSection,
    summary="Get DPP section content",
)
async def get_dpp_section(
    aas_id: str, section_id: str, session: SessionDep
) -> DPPSection:
    """
    Get detailed content for a specific DPP section.

    Args:
        aas_id: ID of the AAS
        section_id: ID of the section to retrieve
        session: Database session dependency

    Returns:
        Detailed content of the requested DPP section
    """
    try:
        return await dpp_services.get_dpp_section(aas_id, section_id, session)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/{aas_id}/download", response_model=CompleteDPP, summary="Download complete DPP"
)
async def download_complete_dpp(
    aas_id: str, session: SessionDep, format: str = "json"
) -> CompleteDPP:
    """
    Download complete DPP in requested format.

    Args:
        aas_id: ID of the AAS to generate DPP for
        format: Output format (default: json)
        session: Database session dependency

    Returns:
        Complete DPP document with all available sections
    """
    try:
        dpp = await dpp_services.generate_complete_dpp(aas_id, format, session)

        # If a specific format is requested other than JSON, handle it here
        if format != "json":
            # TODO: Implement other format handlers (PDF, etc.)
            raise HTTPException(
                status_code=400, detail=f"Format '{format}' not yet supported"
            )

        return dpp
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
