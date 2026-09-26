"""
Target Mapping Audit Module.
Audits proposed mappings from official source hazard classifications (HPSDMA, CWC, IMD, GSI)
to project target risk classes (low, medium, high, critical).

Current Status: NOT APPROVED (Waiting for official ground truth data and definitions).
"""

from typing import Dict, Any, List
from training.target_mapping import GLOBAL_TARGET_MAPPER

PROPOSED_MAPPING_AUDIT = [
    {
        "source": "CWC Hydro-Telemetry",
        "official_classification": "Normal",
        "official_definition": "River stage below Warning Level threshold.",
        "proposed_project_class": "low",
        "evidence": "River water level within normal non-flood bounds.",
        "approval_status": "NOT APPROVED"
    },
    {
        "source": "CWC Hydro-Telemetry",
        "official_classification": "Above Normal",
        "official_definition": "River stage exceeding normal bounds, approaching Warning Level.",
        "proposed_project_class": "medium",
        "evidence": "Elevated river stage indicating heightened catchment runoff.",
        "approval_status": "NOT APPROVED"
    },
    {
        "source": "CWC Hydro-Telemetry",
        "official_classification": "Severe",
        "official_definition": "River stage exceeding Warning Level, approaching Danger Level.",
        "proposed_project_class": "high",
        "evidence": "Water stage exceeding official Warning Level.",
        "approval_status": "NOT APPROVED"
    },
    {
        "source": "CWC Hydro-Telemetry",
        "official_classification": "Extreme",
        "official_definition": "River stage exceeding Danger Level or Highest Flood Level (HFL).",
        "proposed_project_class": "critical",
        "evidence": "Water stage exceeding official Danger Mark threshold.",
        "approval_status": "NOT APPROVED"
    },
    {
        "source": "IMD Weather Warnings",
        "official_classification": "Green",
        "official_definition": "No weather warning.",
        "proposed_project_class": "low",
        "evidence": "Standard non-extreme meteorological conditions.",
        "approval_status": "NOT APPROVED"
    },
    {
        "source": "IMD Weather Warnings",
        "official_classification": "Yellow",
        "official_definition": "Watch and stay updated on heavy rainfall.",
        "proposed_project_class": "medium",
        "evidence": "Moderate to heavy precipitation advisory.",
        "approval_status": "NOT APPROVED"
    },
    {
        "source": "IMD Weather Warnings",
        "official_classification": "Orange",
        "official_definition": "Alert and prepare for heavy to very heavy rainfall.",
        "proposed_project_class": "high",
        "evidence": "Heavy to very heavy rainfall alert.",
        "approval_status": "NOT APPROVED"
    },
    {
        "source": "IMD Weather Warnings",
        "official_classification": "Red",
        "official_definition": "Take action for extremely heavy rainfall.",
        "proposed_project_class": "critical",
        "evidence": "Extremely heavy rainfall warning.",
        "approval_status": "NOT APPROVED"
    }
]

def generate_target_mapping_audit_report() -> Dict[str, Any]:
    """
    Generates structured audit dictionary for target mapping rules.
    """
    is_approved = GLOBAL_TARGET_MAPPER.is_approved()
    return {
        "global_approval_status": "APPROVED" if is_approved else "NOT APPROVED",
        "overall_status": "BLOCKED — WAITING FOR OFFICIAL GROUND TRUTH",
        "audit_entries": PROPOSED_MAPPING_AUDIT,
        "policy_note": "No target mappings will be applied to training datasets until formal engineering approval is granted."
    }

if __name__ == "__main__":
    report = generate_target_mapping_audit_report()
    print(f"\n==========================================")
    print(f" TARGET MAPPING AUDIT STATUS: {report['global_approval_status']}")
    print(f"==========================================")
    for entry in report["audit_entries"]:
        print(f"  [{entry['source']}] '{entry['official_classification']}' -> Proposed: '{entry['proposed_project_class']}' | Status: {entry['approval_status']}")
    print()
