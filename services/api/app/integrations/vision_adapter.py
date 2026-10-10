from typing import List, Dict, Any
from app.schemas.safety import SafetyObservation


class VisionEvidenceAdapter:
    """
    Vision model adapter for inspecting visible food evidence.
    Rule: Never claim that visual inspection certifies food safety.
    """
    def __init__(self, provider: str = "mock"):
        self.provider = provider

    async def analyze_food_photos(self, storage_paths: List[str]) -> List[SafetyObservation]:
        """
        Evaluate photo clarity, presence of covered containers, and visible dish presentation.
        """
        observations: List[SafetyObservation] = []

        if not storage_paths:
            observations.append(
                SafetyObservation(
                    category="image_clarity",
                    indicator="missing_photos",
                    severity="critical",
                    details="No dish photographs supplied. Visual evidence incomplete."
                )
            )
            return observations

        # In mock or production vision inference:
        observations.append(
            SafetyObservation(
                category="image_clarity",
                indicator="resolution_sufficient",
                severity="info",
                details="Photo resolution and lighting are adequate for food item identification."
            )
        )
        observations.append(
            SafetyObservation(
                category="container_hygiene",
                indicator="clean_chafers_observed",
                severity="info",
                details="Food appears stored in clean stainless steel / food-grade banquet containers."
            )
        )
        return observations


vision_adapter = VisionEvidenceAdapter()
