from typing import TypedDict, List, Dict, Any, Optional
from enum import Enum


class MissionStage(str, Enum):
    INITIALIZED = "INITIALIZED"
    INTAKE_VALIDATION = "INTAKE_VALIDATION"
    SAFETY_EVALUATION = "SAFETY_EVALUATION"
    DEMAND_DISCOVERY = "DEMAND_DISCOVERY"
    OPTIMIZATION = "OPTIMIZATION"
    RECIPIENT_OUTREACH = "RECIPIENT_OUTREACH"
    HANDOVER_COORDINATION = "HANDOVER_COORDINATION"
    COMPLETED = "COMPLETED"
    HUMAN_CHECKPOINT = "HUMAN_CHECKPOINT"
    FAILED = "FAILED"


class FoodRescueState(TypedDict):
    """
    Authoritative state for a multi-recipient food rescue mission.
    Maintained and checkpointed across LangGraph execution steps.
    """
    mission_id: str
    listing_id: str
    stage: str
    
    # Intake & Evidence
    title: str
    food_name: str
    total_quantity_kg: float
    pickup_address: str
    has_photo_evidence: bool
    
    # Safety Gate
    safety_cleared: bool
    safety_rule_version: str
    safety_hold_reason: Optional[str]
    
    # Candidates & Demand
    eligible_recipients: List[Dict[str, Any]]
    
    # Optimization & Allocation
    allocation_plan_id: Optional[str]
    allocated_kg: float
    unallocated_kg: float
    allocations: List[Dict[str, Any]]
    optimizer_engine: str
    
    # Coordination & Replanning
    outreach_status: str  # PENDING, OFFERED, CONFIRMED, PARTIALLY_ACCEPTED, DECLINED
    replan_count: int
    max_replans: int
    
    # Human in the loop
    requires_human_review: bool
    human_checkpoint_reason: Optional[str]
    human_review_resolved: bool
    
    # Execution Audit Trail
    audit_trail: List[Dict[str, Any]]
