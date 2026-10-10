import uuid
from typing import Dict, Any, Optional
from langgraph.graph import StateGraph, END
from app.agent.state import FoodRescueState, MissionStage
from app.agent.nodes import (
    intake_validation_node,
    safety_evaluation_node,
    demand_discovery_node,
    optimization_node,
    recipient_outreach_node,
    handover_coordination_node,
    human_checkpoint_node,
)

# In-memory store for active and completed mission runs
MISSION_RUN_DATABASE: Dict[str, FoodRescueState] = {}


def route_after_intake(state: FoodRescueState) -> str:
    if state.get("requires_human_review"):
        return "human_checkpoint"
    return "safety_evaluation"


def route_after_safety(state: FoodRescueState) -> str:
    if state.get("requires_human_review"):
        return "human_checkpoint"
    return "demand_discovery"


def route_after_demand(state: FoodRescueState) -> str:
    if state.get("requires_human_review"):
        return "human_checkpoint"
    return "optimization"


def build_food_rescue_graph() -> StateGraph:
    """Constructs the LangGraph StateGraph workflow for AnnaSetu missions."""
    builder = StateGraph(FoodRescueState)

    # Add Nodes
    builder.add_node("intake_validation", intake_validation_node)
    builder.add_node("safety_evaluation", safety_evaluation_node)
    builder.add_node("demand_discovery", demand_discovery_node)
    builder.add_node("optimization", optimization_node)
    builder.add_node("recipient_outreach", recipient_outreach_node)
    builder.add_node("handover_coordination", handover_coordination_node)
    builder.add_node("human_checkpoint", human_checkpoint_node)

    # Set Entry Point
    builder.set_entry_point("intake_validation")

    # Add Conditional & Direct Edges
    builder.add_conditional_edges("intake_validation", route_after_intake)
    builder.add_conditional_edges("safety_evaluation", route_after_safety)
    builder.add_conditional_edges("demand_discovery", route_after_demand)
    builder.add_edge("optimization", "recipient_outreach")
    builder.add_edge("recipient_outreach", "handover_coordination")
    builder.add_edge("handover_coordination", END)
    builder.add_edge("human_checkpoint", END)

    return builder.compile()


# Compiled Singleton Graph
FOOD_RESCUE_GRAPH = build_food_rescue_graph()


def init_mission_state(listing_id: str) -> FoodRescueState:
    """Initializes a new FoodRescueState object."""
    mission_id = f"mission_{uuid.uuid4().hex[:8]}"
    return {
        "mission_id": mission_id,
        "listing_id": listing_id,
        "stage": MissionStage.INITIALIZED.value,
        "title": "",
        "food_name": "",
        "total_quantity_kg": 0.0,
        "pickup_address": "",
        "has_photo_evidence": False,
        "safety_cleared": False,
        "safety_rule_version": "",
        "safety_hold_reason": None,
        "eligible_recipients": [],
        "allocation_plan_id": None,
        "allocated_kg": 0.0,
        "unallocated_kg": 0.0,
        "allocations": [],
        "optimizer_engine": "",
        "outreach_status": "PENDING",
        "replan_count": 0,
        "max_replans": 3,
        "requires_human_review": False,
        "human_checkpoint_reason": None,
        "human_review_resolved": False,
        "audit_trail": [],
    }


async def execute_mission_workflow(listing_id: str) -> FoodRescueState:
    """Execute the compiled LangGraph workflow from start to finish or checkpoint."""
    state = init_mission_state(listing_id)
    MISSION_RUN_DATABASE[state["mission_id"]] = state
    
    final_output = await FOOD_RESCUE_GRAPH.ainvoke(state)
    MISSION_RUN_DATABASE[final_output["mission_id"]] = final_output
    return final_output


async def resume_mission_after_review(mission_id: str, supervisor_notes: str = "") -> FoodRescueState:
    """
    Resumes a held mission after authorized human reviewer resolution.
    Resumes graph execution from demand discovery onwards.
    """
    state = MISSION_RUN_DATABASE.get(mission_id)
    if not state:
        raise KeyError(f"Mission '{mission_id}' not found.")

    state["requires_human_review"] = False
    state["human_review_resolved"] = True
    state["safety_cleared"] = True
    state["stage"] = MissionStage.DEMAND_DISCOVERY.value
    state["audit_trail"].append({
        "timestamp": uuid.uuid4().hex,
        "step": "SUPERVISOR_OVERRIDE",
        "message": f"Held mission resolved by coordinator: {supervisor_notes}",
        "metadata": {"notes": supervisor_notes},
    })

    # Continue remainder of workflow from demand_discovery through optimization
    state = await demand_discovery_node(state)
    if not state["requires_human_review"]:
        state = await optimization_node(state)
        state = await recipient_outreach_node(state)
        state = await handover_coordination_node(state)

    MISSION_RUN_DATABASE[mission_id] = state
    return state
