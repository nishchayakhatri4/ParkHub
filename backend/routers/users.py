from fastapi import APIRouter, HTTPException, status

from app.dependencies import CurrentUserDep
from models.user import UserProfile, UserUpdate
from services.supabase import get_supabase_admin


router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserProfile)
def get_me(current_user: CurrentUserDep) -> dict:
    profile = get_supabase_admin().table("profiles").select("*").eq("id", str(current_user.id)).single().execute().data
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return profile


@router.patch("/me", response_model=UserProfile)
def update_me(payload: UserUpdate, current_user: CurrentUserDep) -> dict:
    changes = payload.model_dump(exclude_none=True)
    if not changes:
        return get_me(current_user)
    result = get_supabase_admin().table("profiles").update(changes).eq("id", str(current_user.id)).execute().data
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return result[0]
