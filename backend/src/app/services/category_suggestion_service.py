import json
import logging
import os
import uuid
from dataclasses import dataclass

from ai_sdk import generate_object, openai
from openai import OpenAI
from pydantic import BaseModel

from src.app.repositories.category_repository import CategoryRepository

category_repository = CategoryRepository()
logger = logging.getLogger(__name__)

# Suggestions are fetched while the user fills in the form, so fail fast.
DEFAULT_LLM_TIMEOUT_SECONDS = 10
# Local servers like LM Studio need no key, but the OpenAI client requires one.
# Passing a placeholder also keeps the client from sending OPENAI_API_KEY to a foreign endpoint.
LLM_API_KEY_PLACEHOLDER = "not-needed"


@dataclass(frozen=True)
class CategorySuggestion:
    category_id: uuid.UUID | None = None
    new_category_name: str | None = None


NO_SUGGESTION = CategorySuggestion()


class _ModelAnswer(BaseModel):
    existing_category_name: str | None
    new_category_name: str | None


SYSTEM_PROMPT = """You categorize transactions of a personal budget planner.
If one of the user's existing categories fits the transaction, answer with its exact name in "existing_category_name".
Otherwise propose a short new category name in "new_category_name", in the language of the existing categories (German if there are none).
If the transaction cannot be categorized, leave both fields null.
Respond only with JSON: {"existing_category_name": string | null, "new_category_name": string | null}"""


def _build_prompt(name, description, transaction_type, category_names):
    return (
        f"Transaction name: {name}\n"
        f"Description: {description or '-'}\n"
        f"Type: {transaction_type}\n"
        f"Existing categories: {json.dumps(category_names, ensure_ascii=False)}"
    )


def _build_model():
    base_url = os.getenv("LLM_BASE_URL")
    model_name = os.getenv("LLM_MODEL")
    api_key = os.getenv("LLM_API_KEY") or LLM_API_KEY_PLACEHOLDER
    timeout_seconds = float(os.getenv("LLM_TIMEOUT_SECONDS") or DEFAULT_LLM_TIMEOUT_SECONDS)
    if not base_url or not model_name:
        # No default endpoint: without configuration nothing may be sent anywhere.
        raise RuntimeError("LLM_BASE_URL and LLM_MODEL must be set")

    model = openai(model_name, api_key=api_key)
    # ai_sdk's openai() cannot set a base URL, so swap in a client pointed at the configured endpoint.
    # No retries: generate_object already falls back to a second request on failure.
    model._client = OpenAI(
        api_key=api_key,
        base_url=base_url,
        timeout=timeout_seconds,
        max_retries=0,
    )
    return model


def suggest_category(user_id, name: str, description: str | None, transaction_type: str) -> CategorySuggestion:
    categories = category_repository.get_all_by_user(user_id)

    try:
        result = generate_object(
            model=_build_model(),
            schema=_ModelAnswer,
            system=SYSTEM_PROMPT,
            prompt=_build_prompt(name, description, transaction_type, [c.name for c in categories]),
        )
    except Exception as error:
        # A suggestion is optional; any provider failure just means "no suggestion".
        logger.warning("Category suggestion failed: %s", error)
        return NO_SUGGESTION
    answer = result.object

    # Match loosely so the model's spelling never leads to a near-duplicate category.
    categories_by_name = {category.name.casefold(): category for category in categories}
    for proposed_name in (answer.existing_category_name, answer.new_category_name):
        category = categories_by_name.get((proposed_name or "").strip().casefold())
        if category:
            return CategorySuggestion(category_id=category.id)

    new_category_name = (answer.new_category_name or "").strip()
    if not new_category_name:
        return NO_SUGGESTION
    return CategorySuggestion(new_category_name=new_category_name)
