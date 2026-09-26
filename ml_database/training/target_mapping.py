"""
Target Mapping Module for Supervised Flash-Flood Risk Ground Truth.
Provides explicit, traceable mapping configuration from official source warning/severity
classifications (HPSDMA, CWC, IMD, GSI) to project target classes.

CRITICAL POLICY ENFORCEMENT:
1. Automatic or arbitrary label conversions (e.g. 'Severe' -> 'high') are strictly forbidden.
2. Raises TargetMappingNotConfigured error if an unmapped or unapproved classification is encountered.
3. Requires explicit, documented engineering sign-off before any target mapping is activated.
"""

from typing import Dict, Any, Optional

class TargetMappingNotConfigured(Exception):
    """Raised when an official source category has no approved project target mapping."""
    pass

class TargetMappingNotApproved(Exception):
    """Raised when mapping configuration exists but has not received formal project approval."""
    pass

# Intended Target Classes
PROJECT_TARGET_CLASSES = {"low", "medium", "high", "critical"}

class TargetMapper:
    """
    Manages explicit target mapping rules from official source categories to project target classes.
    """
    def __init__(self):
        self._mappings: Dict[str, Dict[str, str]] = {}
        self._approved: bool = False  # Set to True ONLY after formal ground truth sign-off

    def register_mapping(self, source_name: str, source_category: str, target_class: str):
        """
        Registers an explicit mapping rule for a specific source category.
        Target class must be one of ['low', 'medium', 'high', 'critical'].
        """
        if target_class not in PROJECT_TARGET_CLASSES:
            raise ValueError(f"Invalid target class '{target_class}'. Must be one of {PROJECT_TARGET_CLASSES}")
        
        if source_name not in self._mappings:
            self._mappings[source_name] = {}
            
        self._mappings[source_name][source_category] = target_class

    def set_approval_status(self, approved: bool):
        """
        Sets formal engineering approval status for target mapping configuration.
        """
        self._approved = approved

    def is_approved(self) -> bool:
        """
        Returns whether the target mapping configuration is formally approved.
        """
        return self._approved

    def map_category(self, source_name: str, source_category: str) -> str:
        """
        Maps source category to project target class.
        Raises TargetMappingNotApproved if mapping is not approved.
        Raises TargetMappingNotConfigured if category has no explicit mapping rule.
        """
        if not self._approved:
            raise TargetMappingNotApproved(
                f"Target mapping configuration for '{source_name}' is NOT APPROVED. "
                "Official ground truth mapping requires formal project sign-off before use."
            )

        source_map = self._mappings.get(source_name, {})
        if source_category not in source_map:
            raise TargetMappingNotConfigured(
                f"No explicit target mapping configured for source '{source_name}' category '{source_category}'. "
                "Automatic conversion is forbidden per project policy."
            )

        return source_map[source_category]

# Global Default Mapper Instance
GLOBAL_TARGET_MAPPER = TargetMapper()

def map_official_category(source_name: str, source_category: str) -> str:
    """
    Helper function using global target mapper instance.
    """
    return GLOBAL_TARGET_MAPPER.map_category(source_name, source_category)
