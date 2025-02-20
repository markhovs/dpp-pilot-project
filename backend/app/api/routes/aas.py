from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from app.aas import services as aas_services
from app.api.deps import SessionDep, get_current_active_superuser, get_current_user
from app.models import (
    AASAssetCreateFromTemplatesRequest,
    AASAssetMetadataUpdate,
    AASAttachSubmodelsRequest,
    AASSubmodelDataUpdate,
)

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
    response_model=dict[str, Any],  # Returning the fully resolved AAS as a dict
)
async def create_aas(body: AASAssetCreateFromTemplatesRequest, session: SessionDep):
    """
    Create a new AAS instance by attaching one or more submodel templates.
    - **template_ids**: A list of template identifiers (as defined in the template metadata) to attach.
    - **asset_data**: Optional additional asset metadata (e.g. custom AAS id, global asset id, asset kind).
    This endpoint is restricted to superusers.
    """
    try:
        new_aas = aas_services.create_asset_from_templates(
            body.template_ids, body.asset_data or {}, session
        )
        return new_aas
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch(
    "/{aas_id}/metadata",
    summary="Update metadata on an AAS instance",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=dict[str, Any],
)
async def update_aas_metadata(
    aas_id: str, metadata: AASAssetMetadataUpdate, session: SessionDep
):
    """
    Update metadata on an AAS instance
    """
    try:
        updated_aas = aas_services.update_asset_metadata(
            aas_id, metadata.dict(exclude_unset=True), session
        )
        return updated_aas
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch(
    "/{aas_id}/submodels/attach",
    summary="Attach new submodel(s) to an existing AAS asset",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=dict[str, Any],
)
async def attach_submodels(
    aas_id: str, body: AASAttachSubmodelsRequest, session: SessionDep
):
    """
    Attach new submodel instance(s) (derived from the provided template IDs) to the specified AAS asset.
    This endpoint is restricted to superusers.
    """
    try:
        updated_aas = aas_services.attach_submodels_to_asset(
            aas_id, body.template_ids, session
        )
        return updated_aas
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete(
    "/{aas_id}/submodels/{submodel_id:path}",
    summary="Remove a submodel from an AAS",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=dict[str, Any],
)
async def remove_submodel(aas_id: str, submodel_id: str, session: SessionDep):
    """
    Remove a specific submodel (by its ID) from an existing AAS.
    """
    try:
        updated_aas = aas_services.remove_submodel_from_asset(
            aas_id, submodel_id, session
        )
        return updated_aas
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete(
    "/{aas_id}",
    summary="Delete an AAS instance (cascade deletion of submodels)",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=dict,
)
async def delete_aas(aas_id: str, session: SessionDep):
    """
    Delete an AAS asset and all its associated submodels.
    This endpoint is restricted to admins.
    """
    try:
        aas_services.delete_asset(aas_id, session)
        return {"detail": "AAS asset deleted successfully."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# -------------------------------------------------------------------
# Authenticated user endpoints (authenticated users only)
# -------------------------------------------------------------------


@router.get(
    "/",
    summary="List all AAS instances",
    dependencies=[Depends(get_current_user)],
    response_model=list[dict[str, Any]],
)
async def list_all_aas(session: SessionDep):
    """
    Return a list of all stored AAS assets (each asset is returned as raw AAS JSON).
    Accessible to all authenticated users.
    """
    try:
        return aas_services.get_all_assets(session)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch(
    "/{aas_id}/submodels/{submodel_id:path}",
    summary="Update data on a submodel instance for a given AAS",
    dependencies=[Depends(get_current_user)],
    response_model=dict[str, Any],
)
async def update_submodel_data(
    aas_id: str, submodel_id: str, body: AASSubmodelDataUpdate, session: SessionDep
):
    """
    Update data on a specific submodel instance (e.g. property values or dynamic data) for a given AAS.
    """
    try:
        updated_submodel = aas_services.update_submodel_data(
            aas_id, submodel_id, body.new_data, session
        )
        return updated_submodel
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# -------------------------------------------------------------------
# Public endpoints (accessible to any user)
# -------------------------------------------------------------------


@router.get(
    "/{aas_id:path}",
    summary="Retrieve a specific AAS instance by ID",
    # response_model=Dict[str, Any],
)
async def get_aas(aas_id: str, session: SessionDep):
    """
    Retrieve a single AAS instance by its unique identifier.
    """
    try:
        return aas_services.get_asset_by_id(aas_id, session)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
