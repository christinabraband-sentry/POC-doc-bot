"""Service for mapping customer tech stacks to Sentry documentation links."""

import json
import logging
import uuid
from pathlib import Path

logger = logging.getLogger(__name__)

# Mapping from success-criteria feature names (case-insensitive prefix match)
# to the relevant ``doc_sections`` keys and ``product_docs`` keys that should
# be linked.
FEATURE_TO_DOC_SECTIONS: dict[str, dict] = {
    "Error Monitoring": {
        "platform_sections": ["getting_started", "error_monitoring"],
        "product_docs": [],
    },
    "Performance Monitoring": {
        "platform_sections": ["performance"],
        "product_docs": ["performance", "web_vitals", "distributed_tracing"],
    },
    "Session Replay": {
        "platform_sections": ["session_replay"],
        "product_docs": ["session_replay"],
    },
    "Release Health": {
        "platform_sections": ["releases"],
        "product_docs": ["release_health", "releases"],
    },
    "Effective Alerts": {
        "platform_sections": [],
        "product_docs": ["alerts", "issue_alerts", "metric_alerts"],
    },
    "Discover & Dashboards": {
        "platform_sections": [],
        "product_docs": ["dashboards", "discover"],
    },
    "Integrations": {
        "platform_sections": [],
        "product_docs": [],
        "integration_docs": ["slack", "jira", "github"],
    },
    "Profiling": {
        "platform_sections": ["profiling"],
        "product_docs": ["profiling"],
    },
    "User Feedback": {
        "platform_sections": ["user_feedback"],
        "product_docs": ["user_feedback"],
    },
}

# Categories used to group platforms in the tech-stack selector UI.
PLATFORM_CATEGORY_MAP: dict[str, str] = {
    "javascript": "language",
    "node": "language",
    "python": "language",
    "java": "language",
    "dotnet": "language",
    "go": "language",
    "ruby": "language",
    "php": "language",
    "kotlin": "language",
    "dart": "language",
    "elixir": "language",
    "rust": "language",
    "react-native": "mobile",
    "apple": "mobile",
    "android": "mobile",
    "unity": "game_engine",
    "unreal": "game_engine",
}


class DocsMappingService:
    """Maps customer tech stack entries and success criteria to relevant
    Sentry documentation URLs.

    Loads platform / guide data from ``sentry_platforms.json`` at
    instantiation time and provides lookup and link-generation methods.
    """

    def __init__(self) -> None:
        data_path = Path(__file__).parent.parent / "data" / "sentry_platforms.json"
        with open(data_path) as f:
            self.platform_data: dict = json.load(f)

        # Pre-build a case-insensitive lookup index for fast resolution.
        self._lookup_index: dict[str, dict] = self._build_lookup_index()

    # ------------------------------------------------------------------
    # Index building
    # ------------------------------------------------------------------

    def _build_lookup_index(self) -> dict[str, dict]:
        """Create a case-insensitive name -> platform/guide info mapping.

        The index keys are lowercased display names (and also the raw
        platform/guide keys) so callers can search by any common name.
        """
        index: dict[str, dict] = {}
        platforms = self.platform_data.get("platforms", {})

        for platform_key, platform_info in platforms.items():
            display_name = platform_info.get("display_name", platform_key)
            base_url = platform_info.get("base_url", "")

            entry = {
                "display_name": display_name,
                "base_url": base_url,
                "platform_key": platform_key,
                "guide_key": None,
            }

            # Index by display name and platform key
            index[display_name.lower()] = entry
            index[platform_key.lower()] = entry

            # Index all guides under this platform
            guides = platform_info.get("guides", {})
            for guide_key, guide_info in guides.items():
                guide_display = guide_info.get("display_name", guide_key)
                guide_base_url = guide_info.get("base_url", "")

                guide_entry = {
                    "display_name": guide_display,
                    "base_url": guide_base_url,
                    "platform_key": platform_key,
                    "guide_key": guide_key,
                }

                index[guide_display.lower()] = guide_entry
                index[guide_key.lower()] = guide_entry

        return index

    # ------------------------------------------------------------------
    # Public methods
    # ------------------------------------------------------------------

    def resolve_platform(self, name: str) -> dict | None:
        """Resolve a technology name to a matching Sentry platform or guide.

        Parameters
        ----------
        name:
            Human-readable tech name such as ``"React"``, ``"Django"``,
            ``"iOS"``, ``"Next.js"``, etc.

        Returns
        -------
        dict | None
            A dict with ``display_name``, ``base_url``, ``platform_key``,
            and ``guide_key`` (``None`` when it matches the top-level platform
            rather than a guide).  Returns ``None`` if no match is found.
        """
        key = name.strip().lower()

        # Direct lookup
        if key in self._lookup_index:
            return dict(self._lookup_index[key])

        # Fuzzy: try stripping common suffixes / prefixes
        # e.g. "node.js" -> "node", "asp.net core" -> "aspnetcore"
        normalized = (
            key.replace(".js", "")
            .replace(".", "")
            .replace(" ", "")
            .replace("-", "")
        )
        for index_key, value in self._lookup_index.items():
            index_normalized = (
                index_key.replace(".js", "")
                .replace(".", "")
                .replace(" ", "")
                .replace("-", "")
            )
            if normalized == index_normalized:
                return dict(value)

        # Substring match as a last resort (prefer shorter index keys)
        candidates: list[tuple[str, dict]] = []
        for index_key, value in self._lookup_index.items():
            if key in index_key or index_key in key:
                candidates.append((index_key, value))

        if candidates:
            # Prefer the most specific (longest) match
            candidates.sort(key=lambda c: len(c[0]), reverse=True)
            return dict(candidates[0][1])

        logger.debug("No Sentry platform match found for '%s'.", name)
        return None

    def generate_links(
        self,
        tech_stack_entries: list,
        success_criteria: list,
    ) -> list[dict]:
        """Generate documentation links based on tech stack and success criteria.

        For each tech-stack entry the method:
        1. Resolves it to a Sentry platform/guide.
        2. Generates a *Getting Started* link.
        3. For each **HIGH** priority success criterion, generates relevant
           platform-section and product-level documentation links.

        Parameters
        ----------
        tech_stack_entries:
            List of ``TechStackEntry`` model instances (or dicts with at least
            ``id``, ``name``, ``category``, ``sentry_platform_key``).
        success_criteria:
            List of ``SuccessCriterion`` model instances (or dicts with at
            least ``feature``, ``priority``).

        Returns
        -------
        list[dict]
            Each dict contains:
            - ``tech_stack_entry_id`` (UUID | None)
            - ``category`` (str): link category
            - ``title`` (str)
            - ``url`` (str)
            - ``relevance_note`` (str | None)
        """
        doc_sections = self.platform_data.get("doc_sections", {})
        product_docs = self.platform_data.get("product_docs", {})
        integration_docs = self.platform_data.get("integration_docs", {})

        links: list[dict] = []
        sort_counter = 0

        # Collect HIGH priority feature names for later matching.
        high_priority_features = self._extract_high_priority_features(success_criteria)

        for entry in tech_stack_entries:
            entry_id = self._get_attr(entry, "id")
            entry_name = self._get_attr(entry, "name", "")
            platform_key = self._get_attr(entry, "sentry_platform_key")

            # Resolve to platform info
            resolved = None
            if platform_key:
                resolved = self._lookup_index.get(platform_key.lower())
            if not resolved:
                resolved = self.resolve_platform(entry_name)

            if not resolved:
                logger.debug(
                    "Skipping unresolved tech stack entry: %s", entry_name
                )
                continue

            base_url = resolved["base_url"].rstrip("/") + "/"
            display_name = resolved["display_name"]

            # 1) Getting Started link (always included)
            sort_counter += 1
            links.append(
                {
                    "tech_stack_entry_id": entry_id,
                    "category": "getting_started",
                    "title": f"Getting Started with {display_name}",
                    "url": base_url,
                    "relevance_note": f"Setup and installation guide for {display_name}.",
                    "sort_order": sort_counter,
                }
            )

            # 2) For each high-priority feature, add relevant links
            for feature in high_priority_features:
                mapping = self._match_feature(feature)
                if not mapping:
                    continue

                # Platform-specific section links
                for section_key in mapping.get("platform_sections", []):
                    section_path = doc_sections.get(section_key, "")
                    if not section_path and section_key != "getting_started":
                        continue
                    # Skip duplicate getting-started links
                    if section_key == "getting_started":
                        continue

                    section_url = f"{base_url}{section_path}"
                    section_title = section_key.replace("_", " ").title()

                    sort_counter += 1
                    links.append(
                        {
                            "tech_stack_entry_id": entry_id,
                            "category": section_key,
                            "title": f"{display_name} - {section_title}",
                            "url": section_url,
                            "relevance_note": (
                                f"Relevant for success criterion: {feature}."
                            ),
                            "sort_order": sort_counter,
                        }
                    )

                # Product-level doc links
                for product_key in mapping.get("product_docs", []):
                    product_url = product_docs.get(product_key)
                    if not product_url:
                        continue

                    product_title = product_key.replace("_", " ").title()
                    sort_counter += 1
                    links.append(
                        {
                            "tech_stack_entry_id": entry_id,
                            "category": "product_docs",
                            "title": f"Sentry {product_title}",
                            "url": product_url,
                            "relevance_note": (
                                f"Product documentation relevant to: {feature}."
                            ),
                            "sort_order": sort_counter,
                        }
                    )

                # Integration doc links
                for integration_key in mapping.get("integration_docs", []):
                    integration_info = integration_docs.get(integration_key)
                    if not integration_info:
                        continue

                    sort_counter += 1
                    links.append(
                        {
                            "tech_stack_entry_id": entry_id,
                            "category": "integration",
                            "title": f"{integration_info['display_name']} Integration",
                            "url": integration_info["url"],
                            "relevance_note": (
                                f"Integration setup for: {feature}."
                            ),
                            "sort_order": sort_counter,
                        }
                    )

        # Deduplicate links by URL (keep first occurrence per URL).
        seen_urls: set[str] = set()
        deduplicated: list[dict] = []
        for link in links:
            if link["url"] not in seen_urls:
                seen_urls.add(link["url"])
                deduplicated.append(link)

        logger.info("Generated %d documentation links.", len(deduplicated))
        return deduplicated

    def get_available_platforms(self) -> list[dict]:
        """Return all available platforms and guides for the tech stack selector.

        Returns
        -------
        list[dict]
            Each dict contains:
            - ``category`` (str): ``"language"``, ``"framework"``,
              ``"mobile"``, ``"desktop"``, ``"game_engine"``
            - ``name`` (str): Human-readable display name.
            - ``platform_key`` (str): Top-level platform key.
            - ``guide_key`` (str | None): Guide key if this is a guide.
        """
        platforms = self.platform_data.get("platforms", {})
        results: list[dict] = []

        for platform_key, platform_info in platforms.items():
            category = PLATFORM_CATEGORY_MAP.get(platform_key, "language")
            display_name = platform_info.get("display_name", platform_key)

            # Add the top-level platform
            results.append(
                {
                    "category": category,
                    "name": display_name,
                    "platform_key": platform_key,
                    "guide_key": None,
                }
            )

            # Add each guide as a "framework" entry
            guides = platform_info.get("guides", {})
            for guide_key, guide_info in guides.items():
                guide_display = guide_info.get("display_name", guide_key)
                results.append(
                    {
                        "category": "framework",
                        "name": guide_display,
                        "platform_key": platform_key,
                        "guide_key": guide_key,
                    }
                )

        return results

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _get_attr(obj, attr: str, default=None):
        """Get an attribute from either a model instance or a dict."""
        if isinstance(obj, dict):
            return obj.get(attr, default)
        return getattr(obj, attr, default)

    @staticmethod
    def _extract_high_priority_features(success_criteria: list) -> list[str]:
        """Return the feature names of all HIGH-priority success criteria."""
        features: list[str] = []
        for criterion in success_criteria:
            if isinstance(criterion, dict):
                priority = criterion.get("priority", "")
                feature = criterion.get("feature", "")
            else:
                priority = getattr(criterion, "priority", "") or ""
                feature = getattr(criterion, "feature", "") or ""

            if priority.upper() == "HIGH" and feature:
                features.append(feature)
        return features

    @staticmethod
    def _match_feature(feature: str) -> dict | None:
        """Match a feature name to a ``FEATURE_TO_DOC_SECTIONS`` entry.

        Uses case-insensitive prefix/substring matching so that slight
        variations (e.g. ``"Performance"`` vs ``"Performance Monitoring"``)
        still resolve correctly.
        """
        feature_lower = feature.lower().strip()

        # Exact match first
        for key, mapping in FEATURE_TO_DOC_SECTIONS.items():
            if key.lower() == feature_lower:
                return mapping

        # Prefix / substring match
        for key, mapping in FEATURE_TO_DOC_SECTIONS.items():
            key_lower = key.lower()
            if feature_lower.startswith(key_lower) or key_lower.startswith(feature_lower):
                return mapping

        # Keyword match as a last resort
        for key, mapping in FEATURE_TO_DOC_SECTIONS.items():
            key_words = set(key.lower().split())
            feature_words = set(feature_lower.split())
            if key_words & feature_words:
                return mapping

        return None
