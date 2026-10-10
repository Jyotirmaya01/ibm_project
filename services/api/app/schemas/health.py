from pydantic import BaseModel, Field
from datetime import datetime, timezone


class HealthResponse(BaseModel):
    status: str = Field(default="ok", description="Service operational status")
    version: str = Field(default="0.1.0", description="API version")
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Current server UTC timestamp"
    )
    environment: str = Field(..., description="Running environment")
    engine: str = Field(default="AnnaSetu AI Core", description="Service identifier")
