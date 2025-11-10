from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


class NodeModel(BaseModel):
    id: str
    type: str
    properties: Dict[str, Any]
    createdBy: Optional[str] = None
    updatedBy: Optional[str] = None

    model_config = ConfigDict(extra="ignore")


class EdgeModel(BaseModel):
    id: str
    sourceId: str
    targetId: str
    type: str
    properties: Dict[str, Any]

    model_config = ConfigDict(extra="ignore")


class DatasetModel(BaseModel):
    nodes: List[NodeModel] = Field(default_factory=list)
    edges: List[EdgeModel] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    @model_validator(mode="after")
    def ensure_not_empty(self) -> "DatasetModel":
        if not self.nodes and not self.edges:
            raise ValueError("Dataset must contain at least one node or edge")
        return self


@dataclass(slots=True)
class MigrationJobRecord:
    job_id: str
    source: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    metrics: Dict[str, Any] = field(default_factory=dict)
    image_digest: Optional[str] = None
    logs_url: Optional[str] = None
