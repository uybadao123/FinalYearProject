# app/models/user.py
from typing import Optional
from pydantic import BaseModel
from enum import Enum

class SystemRole(str, Enum):
    ADMIN = "admin"
    CONTENT_COLLABORATOR = "content_collaborator"
    GARDENER = "gardener"

class UserProfile(BaseModel):
    uid: str
    email: str
    full_name: str
    image_url: Optional[str] = None
    experience_level: Optional[str] = None
    role: SystemRole = SystemRole.GARDENER

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    image_url: Optional[str] = None
    experience_level: Optional[str] = None