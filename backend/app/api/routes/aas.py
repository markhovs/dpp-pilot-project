from fastapi import APIRouter, Depends, HTTPException

from app.aas import services as aas_services
from app.api.deps import SessionDep, get_current_active_superuser

router = APIRouter(prefix="/aas", tags=["AAS"])

# -------------------------------------------------------------------
# Admin-only endpoints (superusers only)
# -------------------------------------------------------------------


@router.get(
    "/templates",
    summary="List available AASX template packages",
    dependencies=[Depends(get_current_active_superuser)],
)
async def list_templates():
    """
    Return a list of available AASX template packages.
    This endpoint is available only to superusers.
    """
    try:
        return aas_services.list_templates()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/",
    summary="Create a new AAS from selected submodel templates",
    dependencies=[Depends(get_current_active_superuser)],
)
async def create_aas(
    session: SessionDep, template_ids: list[str], asset_data: dict = None
):
    """
    Create a new AAS instance by attaching one or more submodel templates.

    - **template_ids**: A list of template identifiers (as defined in the template metadata) to attach.
    - **asset_data**: Optional additional asset metadata (e.g. custom AAS id, global asset id, asset kind).

    This endpoint is restricted to superusers.
    """
    try:
        new_aas = aas_services.create_asset_from_submodel_templates(
            template_ids, asset_data, session
        )
        return new_aas
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# -------------------------------------------------------------------
# Public endpoints (accessible to any user)
# -------------------------------------------------------------------


@router.get("/", summary="List all AAS instances")
async def list_all_aas(session: SessionDep):
    """
    Return a list of all stored AAS assets.
    Accessible to all users.
    """
    try:
        return aas_services.get_all_assets(session)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{aas_id:path}", summary="Retrieve a specific AAS instance by ID")
async def get_aas(aas_id: str, session: SessionDep):
    """
    Retrieve a single AAS instance by its unique identifier.

    The use of the ":path" parameter ensures that IDs containing slashes (e.g. URL‐like IDs)
    are captured correctly.
    Accessible to all users.
    """
    try:
        return aas_services.get_asset_by_id(session, aas_id)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
