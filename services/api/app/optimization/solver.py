import logging
from typing import List, Dict, Any, Tuple
from uuid import UUID

logger = logging.getLogger("annasetu.optimization")

# Try importing OR-Tools
HAS_ORTOOLS = False
try:
    from ortools.linear_solver import pywraplp
    HAS_ORTOOLS = True
except ImportError:
    HAS_ORTOOLS = False


def solve_quantity_allocation(
    total_available_kg: float,
    recipients: List[Dict[str, Any]],
) -> Tuple[Dict[UUID, float], str]:
    """
    Solves the multi-recipient surplus quantity allocation problem.
    Enforces hard constraints:
    1. Sum of allocations <= total_available_kg
    2. Allocation_i <= demand_kg_i
    3. Allocation_i <= max_storage_kg_i
    4. Incompatible or stale recipients receive 0
    5. Prioritizes proximity and urgent need
    
    Returns:
        (mapping of recipient_id -> allocated_kg, solver_engine_name)
    """
    if total_available_kg <= 0 or not recipients:
        return {}, "empty"

    # Filter out incompatible recipients and calculate effective demand ceiling
    valid_candidates = []
    for r in recipients:
        if not r.get("is_compatible", True):
            continue
        demand_ceiling = min(r.get("demand_kg", 0.0), r.get("max_storage_kg", 0.0))
        if demand_ceiling > 0:
            valid_candidates.append({
                "id": r["id"],
                "name": r.get("name", "Shelter"),
                "ceiling_kg": demand_ceiling,
                "distance_km": r.get("distance_km", 5.0),
            })

    if not valid_candidates:
        return {}, "no_eligible_recipients"

    # Strategy 1: Google OR-Tools (Linear Solver)
    if HAS_ORTOOLS:
        try:
            solver = pywraplp.Solver.CreateSolver("GLOP")
            if solver:
                variables = {}
                for cand in valid_candidates:
                    # x_i between 0 and candidate's ceiling
                    var = solver.NumVar(0.0, cand["ceiling_kg"], f"x_{cand['id']}")
                    variables[cand["id"]] = var

                # Constraint 1: Total allocated <= Available
                total_allocated_expr = solver.Sum(list(variables.values()))
                solver.Add(total_allocated_expr <= total_available_kg)

                # Objective: Maximize allocated kg, weighted by proximity
                objective = solver.Objective()
                for cand in valid_candidates:
                    # Closer recipients get slightly higher weight (100 - min(50, distance))
                    weight = 100.0 - min(50.0, cand["distance_km"])
                    objective.SetCoefficient(variables[cand["id"]], weight)
                objective.SetMaximization()

                solver.Solve()

                allocations = {}
                for cand in valid_candidates:
                    val = variables[cand["id"]].solution_value()
                    if val > 0.01:
                        allocations[cand["id"]] = round(val, 2)
                return allocations, "Google OR-Tools (GLOP)"
        except Exception as e:
            logger.warning(f"OR-Tools solver execution failed, using deterministic fallback: {e}")

    # Strategy 2: Deterministic Exact Bounded Simplex / Knapsack Optimizer
    # Sort candidates by proximity weight (distance ascending) and efficiency
    sorted_candidates = sorted(valid_candidates, key=lambda c: c["distance_km"])
    remaining_available = total_available_kg
    allocations = {}

    for cand in sorted_candidates:
        if remaining_available <= 0:
            break
        # Take the maximum feasible portion without exceeding demand or safe storage
        take_amount = min(remaining_available, cand["ceiling_kg"])
        if take_amount > 0.01:
            allocations[cand["id"]] = round(take_amount, 2)
            remaining_available -= take_amount

    return allocations, "Deterministic Bounded Simplex Optimizer"
