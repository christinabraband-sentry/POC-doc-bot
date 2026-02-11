"""AI analysis service using Claude for extracting value framework from call transcripts."""

import json
import logging
from datetime import datetime, timezone

import anthropic

from app.config import Settings

logger = logging.getLogger(__name__)


class AIAnalysisService:
    """Integrates with the Anthropic Claude API to analyze call transcripts
    and extract structured value-framework information for POC planning.

    Uses the synchronous ``anthropic.Anthropic`` client because this service
    is designed to run inside background tasks (not blocking the event loop).
    """

    SYSTEM_PROMPT = """You are an expert sales engineering analyst at Sentry, specializing in extracting value framework information from customer call transcripts. Your task is to analyze one or more call transcripts and extract structured information about the customer's needs and challenges.

You must extract the following five categories:

1. CURRENT CHALLENGES: What problems, pain points, and frustrations does the customer currently face with their error monitoring, performance monitoring, or observability tooling? Include specific tools they mention and what fails.

2. IMPACT: What is the business impact of these challenges? How do they affect developer productivity, incident response time, customer experience, or revenue?

3. IDEAL FUTURE STATE: What does the customer want their ideal workflow to look like? What outcomes are they hoping to achieve?

4. EVERYDAY METRICS: What KPIs, SLAs, or metrics does the customer track or care about? (e.g., MTTR, crash-free rate, error rate, deploy frequency)

5. CORE REQUIREMENTS: What are the must-have requirements for any solution? What features or capabilities are non-negotiable?

Respond ONLY with valid JSON in this exact structure:
{
  "current_challenges": "...",
  "impact": "...",
  "ideal_future_state": "...",
  "everyday_metrics": "...",
  "core_requirements": "...",
  "confidence_score": 0.85,
  "evidence": {
    "current_challenges": ["direct quote or paraphrase"],
    "impact": ["..."],
    "ideal_future_state": ["..."],
    "everyday_metrics": ["..."],
    "core_requirements": ["..."]
  }
}

For each field, write 2-4 clear, concise sentences synthesizing information across all transcripts. The confidence_score should reflect how explicitly the transcript data supports your extractions (0.0 = guessing, 1.0 = verbatim). Include evidence as short quotes or close paraphrases."""

    def __init__(self, settings: Settings) -> None:
        if not settings.anthropic_api_key:
            raise ValueError(
                "Anthropic API key is not configured. "
                "Set the ANTHROPIC_API_KEY environment variable."
            )
        self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        self.model = settings.anthropic_model

    async def analyze_transcripts(
        self,
        account_name: str,
        transcripts: list[dict],
    ) -> dict:
        """Analyze one or more call transcripts and extract value framework data.

        This method calls the Claude API synchronously (appropriate for
        background task execution) and parses the structured JSON response.

        Parameters
        ----------
        account_name:
            The customer / account company name for context.
        transcripts:
            A list of transcript dicts, each containing:
            - ``title`` (str): Call title or description.
            - ``date`` (str): Date of the call (ISO format or human-readable).
            - ``text`` (str): Full transcript text.

        Returns
        -------
        dict
            A result dict with keys:
            - ``extracted_data`` (dict): The parsed value framework JSON.
            - ``raw_response`` (str): The raw text returned by Claude.
            - ``model_used`` (str): The model identifier that was used.
            - ``token_usage`` (dict): Token counts (input, output).

        Raises
        ------
        ValueError
            If the Claude response cannot be parsed as valid JSON.
        anthropic.APIError
            On upstream API failures.
        """
        user_prompt = self._build_user_prompt(account_name, transcripts)

        logger.info(
            "Sending %d transcript(s) for account '%s' to Claude model '%s'.",
            len(transcripts),
            account_name,
            self.model,
        )

        # Use the synchronous client -- this service runs in background tasks.
        response = self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            temperature=0.2,
            system=self.SYSTEM_PROMPT,
            messages=[
                {"role": "user", "content": user_prompt},
            ],
        )

        raw_text = response.content[0].text.strip()

        token_usage = {
            "input_tokens": response.usage.input_tokens,
            "output_tokens": response.usage.output_tokens,
        }

        logger.info(
            "Received Claude response: %d input tokens, %d output tokens.",
            token_usage["input_tokens"],
            token_usage["output_tokens"],
        )

        # Parse the JSON response. Claude may wrap it in markdown fences.
        extracted_data = self._parse_json_response(raw_text)

        return {
            "extracted_data": extracted_data,
            "raw_response": raw_text,
            "model_used": self.model,
            "token_usage": token_usage,
        }

    def _build_user_prompt(
        self,
        account_name: str,
        transcripts: list[dict],
    ) -> str:
        """Build the user prompt containing formatted transcript blocks.

        Parameters
        ----------
        account_name:
            Customer company name.
        transcripts:
            List of transcript dicts with ``title``, ``date``, and ``text``.

        Returns
        -------
        str
            The fully assembled user-facing prompt.
        """
        parts: list[str] = [
            f"Analyze the following call transcript(s) for the customer account: **{account_name}**.",
            "",
            f"There are {len(transcripts)} transcript(s) to analyze.",
            "",
        ]

        for idx, transcript in enumerate(transcripts, start=1):
            title = transcript.get("title", f"Call {idx}")
            call_date = transcript.get("date", "Unknown date")
            text = transcript.get("text", "")

            parts.append(f"--- TRANSCRIPT {idx}: {title} (Date: {call_date}) ---")
            parts.append("")
            parts.append(text)
            parts.append("")
            parts.append(f"--- END TRANSCRIPT {idx} ---")
            parts.append("")

        parts.append(
            "Based on the transcript(s) above, extract the value framework "
            "information as specified. Return ONLY valid JSON."
        )

        return "\n".join(parts)

    @staticmethod
    def _parse_json_response(raw_text: str) -> dict:
        """Attempt to parse Claude's response as JSON.

        Handles the common case where the model wraps its response in
        markdown code fences (```json ... ```).

        Parameters
        ----------
        raw_text:
            The raw text content from the Claude API response.

        Returns
        -------
        dict
            Parsed JSON data.

        Raises
        ------
        ValueError
            If parsing fails after all cleanup attempts.
        """
        text = raw_text.strip()

        # Strip markdown code fences if present
        if text.startswith("```"):
            # Remove opening fence (```json or just ```)
            first_newline = text.index("\n")
            text = text[first_newline + 1 :]
            # Remove closing fence
            if text.endswith("```"):
                text = text[: -3].strip()

        try:
            return json.loads(text)
        except json.JSONDecodeError as exc:
            logger.error(
                "Failed to parse Claude response as JSON: %s\nRaw text: %s",
                str(exc),
                raw_text[:1000],
            )
            raise ValueError(
                f"Failed to parse AI response as JSON: {exc}. "
                f"Raw response (first 500 chars): {raw_text[:500]}"
            ) from exc
