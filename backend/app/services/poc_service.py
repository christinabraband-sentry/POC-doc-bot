"""Utility service for POC lifecycle operations and progress calculations."""

import logging
from datetime import date

from app.models.poc import POC
from app.models.phase import Phase, Task
from app.models.mutual_action_plan import Milestone

logger = logging.getLogger(__name__)

# Task statuses that count as "completed".
COMPLETED_STATUSES = {"completed", "done"}

# Task statuses that count as "in progress".
IN_PROGRESS_STATUSES = {"in_progress", "in progress"}


class POCService:
    """Stateless utility service for computing POC progress and metrics.

    All methods are static -- no instance state is required.
    """

    @staticmethod
    def calculate_progress(poc: POC) -> dict:
        """Calculate completion progress across all milestones and phases of a POC.

        Parameters
        ----------
        poc:
            A fully-loaded ``POC`` model instance (with ``milestones`` and
            ``phases`` relationships eagerly loaded).

        Returns
        -------
        dict
            Progress summary containing:

            - ``total_milestones`` (int)
            - ``completed_milestones`` (int)
            - ``milestones_pct`` (float): 0.0 -- 100.0
            - ``total_tasks`` (int)
            - ``completed_tasks`` (int)
            - ``in_progress_tasks`` (int)
            - ``tasks_pct`` (float): 0.0 -- 100.0
            - ``overall_pct`` (float): Weighted average (milestones 40 %, tasks 60 %).
            - ``phases`` (list[dict]): Per-phase breakdowns.
            - ``days_remaining`` (int | None): Days until ``poc_end_date``, or
              ``None`` if no end date is set.
            - ``days_elapsed`` (int | None): Days since ``poc_start_date``, or
              ``None`` if no start date is set.
        """
        milestones: list[Milestone] = poc.milestones or []
        phases: list[Phase] = poc.phases or []

        # --- Milestones ---
        total_milestones = len(milestones)
        completed_milestones = sum(
            1
            for m in milestones
            if (m.status or "").lower() in COMPLETED_STATUSES
        )
        milestones_pct = (
            (completed_milestones / total_milestones * 100.0)
            if total_milestones > 0
            else 0.0
        )

        # --- Tasks (aggregated across all phases) ---
        total_tasks = 0
        completed_tasks = 0
        in_progress_tasks = 0
        phase_progress_list: list[dict] = []

        for phase in phases:
            phase_data = POCService.get_phase_progress(phase)
            phase_progress_list.append(phase_data)

            total_tasks += phase_data["total_tasks"]
            completed_tasks += phase_data["completed_tasks"]
            in_progress_tasks += phase_data["in_progress_tasks"]

        tasks_pct = (
            (completed_tasks / total_tasks * 100.0) if total_tasks > 0 else 0.0
        )

        # --- Overall (weighted) ---
        # If there are both milestones and tasks, weight milestones 40% and tasks 60%.
        # If only one category exists, use that alone.
        if total_milestones > 0 and total_tasks > 0:
            overall_pct = milestones_pct * 0.4 + tasks_pct * 0.6
        elif total_milestones > 0:
            overall_pct = milestones_pct
        elif total_tasks > 0:
            overall_pct = tasks_pct
        else:
            overall_pct = 0.0

        # --- Date calculations ---
        today = date.today()
        days_remaining: int | None = None
        days_elapsed: int | None = None

        if poc.poc_end_date:
            days_remaining = (poc.poc_end_date - today).days

        if poc.poc_start_date:
            days_elapsed = (today - poc.poc_start_date).days

        return {
            "total_milestones": total_milestones,
            "completed_milestones": completed_milestones,
            "milestones_pct": round(milestones_pct, 1),
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "in_progress_tasks": in_progress_tasks,
            "tasks_pct": round(tasks_pct, 1),
            "overall_pct": round(overall_pct, 1),
            "phases": phase_progress_list,
            "days_remaining": days_remaining,
            "days_elapsed": days_elapsed,
        }

    @staticmethod
    def get_phase_progress(phase: Phase) -> dict:
        """Calculate progress metrics for a single phase.

        Parameters
        ----------
        phase:
            A ``Phase`` model instance with its ``tasks`` relationship loaded.

        Returns
        -------
        dict
            Phase progress containing:

            - ``phase_id`` (UUID)
            - ``phase_name`` (str)
            - ``sort_order`` (int)
            - ``total_tasks`` (int)
            - ``completed_tasks`` (int)
            - ``in_progress_tasks`` (int)
            - ``not_started_tasks`` (int)
            - ``completion_pct`` (float): 0.0 -- 100.0
        """
        tasks: list[Task] = phase.tasks or []
        total = len(tasks)

        completed = sum(
            1 for t in tasks if (t.status or "").lower() in COMPLETED_STATUSES
        )
        in_progress = sum(
            1 for t in tasks if (t.status or "").lower() in IN_PROGRESS_STATUSES
        )
        not_started = total - completed - in_progress

        completion_pct = (completed / total * 100.0) if total > 0 else 0.0

        return {
            "phase_id": phase.id,
            "phase_name": phase.name,
            "sort_order": phase.sort_order,
            "total_tasks": total,
            "completed_tasks": completed,
            "in_progress_tasks": in_progress,
            "not_started_tasks": not_started,
            "completion_pct": round(completion_pct, 1),
        }
