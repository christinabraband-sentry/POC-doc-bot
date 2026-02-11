"""Gong API client service for searching calls and fetching transcripts."""

import asyncio
import base64
import logging
from datetime import datetime, timezone

import httpx
from fastapi import HTTPException

from app.config import Settings

logger = logging.getLogger(__name__)

# Maximum number of retries for rate-limited or transient-error requests.
MAX_RETRIES = 4

# Base delay in seconds for exponential backoff.
BASE_BACKOFF_SECONDS = 1.0

# HTTP timeout for individual Gong API requests (seconds).
REQUEST_TIMEOUT = 30.0


class GongService:
    """Async client for the Gong v2 API.

    Features:
    - Basic Auth with base64-encoded access_key:access_key_secret
    - Concurrency limiting via ``asyncio.Semaphore`` (max 3 in-flight requests)
    - Automatic retry with exponential backoff on 429 / 5xx responses
    """

    def __init__(self, settings: Settings) -> None:
        self.base_url = settings.gong_api_base_url.rstrip("/")
        self.access_key = settings.gong_access_key
        self.access_key_secret = settings.gong_access_key_secret
        self._semaphore = asyncio.Semaphore(3)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _ensure_configured(self) -> None:
        """Raise an HTTP 503 if Gong credentials are not configured."""
        if not self.access_key or not self.access_key_secret:
            raise HTTPException(
                status_code=503,
                detail=(
                    "Gong API credentials are not configured. "
                    "Set GONG_ACCESS_KEY and GONG_ACCESS_KEY_SECRET environment variables."
                ),
            )

    def _build_auth_header(self) -> str:
        """Return the ``Authorization`` header value for Basic Auth."""
        credentials = f"{self.access_key}:{self.access_key_secret}"
        encoded = base64.b64encode(credentials.encode()).decode()
        return f"Basic {encoded}"

    async def _make_request(
        self,
        method: str,
        path: str,
        json_data: dict | None = None,
    ) -> dict:
        """Make an authenticated HTTP request with rate limiting and retry.

        Parameters
        ----------
        method:
            HTTP method (``GET``, ``POST``, etc.).
        path:
            API path relative to the base URL (e.g. ``/calls/extensive``).
        json_data:
            Optional JSON body payload.

        Returns
        -------
        dict
            Parsed JSON response body.

        Raises
        ------
        HTTPException
            On non-retryable errors or when retries are exhausted.
        """
        self._ensure_configured()

        url = f"{self.base_url}{path}"
        headers = {
            "Authorization": self._build_auth_header(),
            "Content-Type": "application/json",
        }

        last_exception: Exception | None = None

        for attempt in range(MAX_RETRIES):
            async with self._semaphore:
                try:
                    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
                        response = await client.request(
                            method,
                            url,
                            headers=headers,
                            json=json_data,
                        )

                    # Successful response
                    if response.status_code == 200:
                        return response.json()

                    # Rate limited -- backoff and retry
                    if response.status_code == 429:
                        retry_after = float(
                            response.headers.get("Retry-After", BASE_BACKOFF_SECONDS)
                        )
                        wait = max(retry_after, BASE_BACKOFF_SECONDS * (2 ** attempt))
                        logger.warning(
                            "Gong API rate limited (429). Retrying in %.1fs (attempt %d/%d).",
                            wait,
                            attempt + 1,
                            MAX_RETRIES,
                        )
                        await asyncio.sleep(wait)
                        continue

                    # Server error -- backoff and retry
                    if response.status_code >= 500:
                        wait = BASE_BACKOFF_SECONDS * (2 ** attempt)
                        logger.warning(
                            "Gong API server error %d. Retrying in %.1fs (attempt %d/%d).",
                            response.status_code,
                            wait,
                            attempt + 1,
                            MAX_RETRIES,
                        )
                        await asyncio.sleep(wait)
                        continue

                    # Client error -- not retryable
                    logger.error(
                        "Gong API request failed: %d %s",
                        response.status_code,
                        response.text[:500],
                    )
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"Gong API error: {response.status_code} - {response.text[:300]}",
                    )

                except httpx.RequestError as exc:
                    last_exception = exc
                    wait = BASE_BACKOFF_SECONDS * (2 ** attempt)
                    logger.warning(
                        "Gong API network error: %s. Retrying in %.1fs (attempt %d/%d).",
                        str(exc),
                        wait,
                        attempt + 1,
                        MAX_RETRIES,
                    )
                    await asyncio.sleep(wait)

        # All retries exhausted
        logger.error("Gong API request failed after %d attempts.", MAX_RETRIES)
        raise HTTPException(
            status_code=502,
            detail=f"Gong API request failed after {MAX_RETRIES} retries: {last_exception}",
        )

    # ------------------------------------------------------------------
    # Public methods
    # ------------------------------------------------------------------

    async def search_calls(
        self,
        account_domain: str,
        date_from: str | None = None,
        date_to: str | None = None,
    ) -> list[dict]:
        """Search Gong calls by filtering participant emails for a domain.

        Calls ``POST /v2/calls/extensive`` with a date range filter and
        ``exposedFields.parties = true``, then filters results where at least
        one participant email contains *account_domain*.

        Parameters
        ----------
        account_domain:
            The customer domain to match (e.g. ``"acme.com"``).
        date_from:
            ISO-8601 date string for the start of the search window.
        date_to:
            ISO-8601 date string for the end of the search window.

        Returns
        -------
        list[dict]
            List of call metadata dicts, each containing keys like
            ``metaData``, ``parties``, ``gongCallId``, etc.
        """
        self._ensure_configured()

        domain_lower = account_domain.lower().strip()
        all_matching_calls: list[dict] = []
        cursor: str | None = None

        while True:
            body: dict = {
                "filter": {
                    "fromDateTime": date_from or "2020-01-01T00:00:00Z",
                    "toDateTime": date_to or datetime.now(timezone.utc).strftime(
                        "%Y-%m-%dT%H:%M:%SZ"
                    ),
                },
                "contentSelector": {
                    "exposedFields": {
                        "parties": True,
                    }
                },
            }

            if cursor:
                body["cursor"] = cursor

            data = await self._make_request("POST", "/calls/extensive", json_data=body)

            calls = data.get("calls", [])
            for call in calls:
                parties = call.get("parties", [])
                emails = [
                    p.get("emailAddress", "").lower()
                    for p in parties
                    if p.get("emailAddress")
                ]

                if any(domain_lower in email for email in emails):
                    # Build a normalized metadata dict
                    meta = call.get("metaData", {})
                    all_matching_calls.append(
                        {
                            "gong_call_id": meta.get("id", ""),
                            "title": meta.get("title", ""),
                            "started": meta.get("started", ""),
                            "duration_seconds": meta.get("duration", 0),
                            "participant_emails": emails,
                            "url": meta.get("url", ""),
                        }
                    )

            # Handle pagination
            records_cursor = data.get("records", {})
            cursor = records_cursor.get("cursor")
            total_records = records_cursor.get("totalRecords", 0)

            if not cursor or len(all_matching_calls) >= total_records:
                break

        logger.info(
            "Found %d Gong calls matching domain '%s'.",
            len(all_matching_calls),
            account_domain,
        )
        return all_matching_calls

    async def fetch_transcript(self, gong_call_id: str) -> str:
        """Fetch the full transcript text for a specific Gong call.

        Calls ``POST /v2/calls/transcript`` with a ``callIds`` filter and
        concatenates all sentences from all speakers into a single text string.

        Parameters
        ----------
        gong_call_id:
            The Gong-internal call identifier.

        Returns
        -------
        str
            The full transcript as a concatenated text block.

        Raises
        ------
        HTTPException
            If the call has no transcript or the API returns an error.
        """
        self._ensure_configured()

        body: dict = {
            "filter": {
                "callIds": [gong_call_id],
            }
        }

        data = await self._make_request("POST", "/calls/transcript", json_data=body)

        call_transcripts = data.get("callTranscripts", [])
        if not call_transcripts:
            logger.warning("No transcript found for Gong call %s.", gong_call_id)
            return ""

        # Concatenate all sentences across all transcript entries.
        lines: list[str] = []
        for transcript_entry in call_transcripts:
            transcript = transcript_entry.get("transcript", [])
            for segment in transcript:
                speaker_id = segment.get("speakerId", "Unknown")
                sentences = segment.get("sentences", [])
                for sentence in sentences:
                    text = sentence.get("text", "").strip()
                    if text:
                        lines.append(f"[Speaker {speaker_id}]: {text}")

        full_text = "\n".join(lines)

        logger.info(
            "Fetched transcript for call %s (%d characters).",
            gong_call_id,
            len(full_text),
        )
        return full_text
