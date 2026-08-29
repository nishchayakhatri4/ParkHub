from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=100)
    role: Literal["driver", "owner"] = "driver"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class AuthUser(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: Literal["driver", "owner"]
    verified_owner: bool = False


class AuthResponse(BaseModel):
    access_token: str | None
    refresh_token: str | None
    token_type: str = "bearer"
    user: AuthUser
    email_confirmation_required: bool = False
