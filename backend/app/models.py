import uuid
from datetime import datetime
from typing import Any

from pydantic import EmailStr
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Column, Field, Relationship, SQLModel


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=40)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


class AASAssetBase(SQLModel):
    data: dict[str, Any] | None = None


class AASAsset(AASAssetBase, table=True):
    __tablename__ = "aas_asset"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True,
        sa_column_kwargs={"unique": True},
    )
    # Make 'data' non-optional at the DB layer.
    data: dict[str, Any] = Field(sa_column=Column(JSONB, nullable=False))

    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        description="Timestamp when the AAS was created.",
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        description="Timestamp when the AAS was last updated.",
    )


class AASAssetCreateFromTemplatesRequest(SQLModel):
    template_ids: list[str]
    asset_data: dict[str, Any] | None = None


class AASAssetMetadataUpdate(SQLModel):
    global_asset_id: str | None = None
    description: str | None = None
    display_name: str | None = None


class AASAttachSubmodelsRequest(SQLModel):
    template_ids: list[str]


class AASAssetPublic(AASAssetBase):
    id: str
    # Here 'data' is not optional in the actual DB record.
    data: dict[str, Any]
    created_at: datetime
    updated_at: datetime


class AASAssetsPublic(SQLModel):
    data: list[AASAssetPublic]
    count: int


class AASSubmodelBase(SQLModel):
    data: dict[str, Any] | None = None


class AASSubmodel(AASSubmodelBase, table=True):
    __tablename__ = "aas_submodel"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True,
        sa_column_kwargs={"unique": True},
    )
    data: dict[str, Any] = Field(sa_column=Column(JSONB, nullable=False))

    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        description="Timestamp when the submodel was created.",
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        description="Timestamp when the submodel was last updated.",
    )


class AASSubmodelDataUpdate(SQLModel):
    """
    For updating property values in a submodel (the service reads `new_data`).
    """

    new_data: dict[str, Any]


class AASSubmodelPublic(AASSubmodelBase):
    id: str
    data: dict[str, Any]
    created_at: datetime
    updated_at: datetime


class AASSubmodelsPublic(SQLModel):
    data: list[AASSubmodelPublic]
    count: int


# Shared properties
class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


# Properties to receive on item creation
class ItemCreate(ItemBase):
    pass


# Properties to receive on item update
class ItemUpdate(ItemBase):
    title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str = Field(max_length=255)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")


# Properties to return via API, id is always required
class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)
