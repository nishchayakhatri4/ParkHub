from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=3, max_length=100)
    role: Literal["user", "owner"] = "user"

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        value = value.strip()

        if len(value.split()) < 2:
            raise ValueError("Please provide both first and last name")

        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class AuthUser(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: Literal["user", "owner"]

    # Kept temporarily for frontend compatibility.
    # Your current database does not have owner verification yet.
    verified_owner: bool = False


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUser

    # Kept temporarily so existing frontend code does not break.
    refresh_token: str | None = None
    email_confirmation_required: bool = False