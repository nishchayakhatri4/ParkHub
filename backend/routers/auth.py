from fastapi import APIRouter, HTTPException, status

from models.auth import AuthResponse, AuthUser, LoginRequest, RegisterRequest
from services.supabase import create_supabase_auth_client, get_supabase_admin


router = APIRouter(prefix="/auth", tags=["Authentication"])


def _profile_for(user_id: str) -> dict:
    profile = (
        get_supabase_admin().table("profiles")
        .select("id,email,full_name,role,verified_owner").eq("id", user_id).single().execute().data
    )
    if not profile:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="User profile was not created")
    return profile


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest) -> AuthResponse:
    try:
        result = create_supabase_auth_client().auth.sign_up(
            {
                "email": str(payload.email),
                "password": payload.password,
                "options": {"data": {"full_name": payload.full_name, "role": payload.role}},
            }
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if result.user is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Registration failed")
    profile = _profile_for(str(result.user.id))
    return AuthResponse(
        access_token=result.session.access_token if result.session else None,
        refresh_token=result.session.refresh_token if result.session else None,
        user=AuthUser(**profile),
        email_confirmation_required=result.session is None,
    )


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest) -> AuthResponse:
    try:
        result = create_supabase_auth_client().auth.sign_in_with_password(
            {"email": str(payload.email), "password": payload.password}
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password") from exc
    if result.user is None or result.session is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    profile = _profile_for(str(result.user.id))
    return AuthResponse(
        access_token=result.session.access_token,
        refresh_token=result.session.refresh_token,
        user=AuthUser(**profile),
    )
