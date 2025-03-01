from enum import Enum

from fastapi import APIRouter, HTTPException, Path, Query, status

from app.api.deps import SessionDep
from app.models import CompleteDPP, DPPSection, DPPSectionInfo
from app.services.dpp import services as dpp_services

router = APIRouter(prefix="/dpp", tags=["DPP"])


class DPPFormat(str, Enum):
    """Supported DPP export formats"""

    JSON = "json"
    # PDF removed to keep dependencies minimal


@router.get(
    "/{aas_id}/sections",
    response_model=list[DPPSectionInfo],
    summary="List available DPP sections",
    response_description="List of available DPP sections with their status",
    status_code=status.HTTP_200_OK,
)
async def list_dpp_sections(
    aas_id: str = Path(..., description="ID of the AAS to generate DPP for"),
    status_filter: str | None = Query(
        None, description="Filter sections by status (available, incomplete)"
    ),
    session: SessionDep = None,
) -> list[DPPSectionInfo]:
    """
    Get available DPP sections and their metadata.

    Args:
        aas_id: ID of the AAS to generate DPP for
        status_filter: Optional filter for section status
        session: Database session dependency

    Returns:
        List of available DPP sections with their status
    """
    try:
        sections = await dpp_services.get_dpp_sections(aas_id, session)

        # Filter sections if status_filter is provided
        if status_filter:
            sections = [s for s in sections if s.status == status_filter]

        return sections
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.get(
    "/{aas_id}/section/{section_id}",
    response_model=DPPSection,
    summary="Get DPP section content",
    response_description="Detailed content of the requested DPP section",
    status_code=status.HTTP_200_OK,
)
async def get_dpp_section(
    aas_id: str = Path(..., description="ID of the AAS"),
    section_id: str = Path(..., description="ID of the section to retrieve"),
    include_raw: bool = Query(
        False, description="Whether to include raw data in the response"
    ),
    session: SessionDep = None,
) -> DPPSection:
    """
    Get detailed content for a specific DPP section.

    Args:
        aas_id: ID of the AAS
        section_id: ID of the section to retrieve
        include_raw: Whether to include raw data in the response
        session: Database session dependency

    Returns:
        Detailed content of the requested DPP section
    """
    try:
        section = await dpp_services.get_dpp_section(
            aas_id, section_id, include_raw, session
        )
        return section
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.get(
    "/{aas_id}/download",
    response_model=CompleteDPP,
    summary="Download complete DPP in JSON format",
    response_description="Complete DPP document with all available sections",
)
async def download_complete_dpp(
    aas_id: str = Path(..., description="ID of the AAS to generate DPP for"),
    include_raw: bool = Query(
        False, description="Whether to include raw data in the output"
    ),
    session: SessionDep = None,
):
    """
    Download complete DPP in JSON format.

    Args:
        aas_id: ID of the AAS to generate DPP for
        include_raw: Whether to include raw data in the output
        session: Database session dependency

    Returns:
        Complete DPP document with all available sections
    """
    try:
        # Generate JSON DPP
        dpp = await dpp_services.generate_complete_dpp(
            aas_id, "raw" if include_raw else "clean", session
        )
        return dpp

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )
