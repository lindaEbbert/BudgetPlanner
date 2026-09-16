import pytest

from src.app.services import category_service, category_suggestion_service
from src.app.services.category_suggestion_service import NO_SUGGESTION, CategorySuggestion


def test_suggests_the_existing_category_the_model_picked(model_answers, user):
    category_service.create_category(user.id, "Miete")
    groceries, _ = category_service.create_category(user.id, "Lebensmittel")
    model_answers(existing_category_name="Lebensmittel")

    suggestion = category_suggestion_service.suggest_category(user.id, "Rewe", "Wocheneinkauf", "EXPENSE")

    assert suggestion == CategorySuggestion(category_id=groceries.id)


def test_suggests_a_new_category_name_when_no_existing_category_fits(model_answers, user):
    category_service.create_category(user.id, "Miete")
    model_answers(new_category_name="Streaming")

    suggestion = category_suggestion_service.suggest_category(user.id, "Netflix", None, "EXPENSE")

    assert suggestion == CategorySuggestion(new_category_name="Streaming")


@pytest.mark.parametrize("model_answer", [
    {"existing_category_name": "lebensmittel"},
    {"new_category_name": " LEBENSMITTEL "},
])
def test_name_matching_an_existing_category_ignoring_case_suggests_that_category(model_answers, user, model_answer):
    groceries, _ = category_service.create_category(user.id, "Lebensmittel")
    model_answers(**model_answer)

    suggestion = category_suggestion_service.suggest_category(user.id, "Rewe", None, "EXPENSE")

    assert suggestion == CategorySuggestion(category_id=groceries.id)


@pytest.mark.parametrize("model_answer", [
    {},
    {"new_category_name": "  "},
])
def test_model_without_an_answer_returns_no_suggestion(model_answers, user, model_answer):
    category_service.create_category(user.id, "Lebensmittel")
    model_answers(**model_answer)

    suggestion = category_suggestion_service.suggest_category(user.id, "Überweisung", None, "EXPENSE")

    assert suggestion == NO_SUGGESTION


def test_user_without_categories_gets_a_new_category_name(model_answers, user):
    model_answers(new_category_name="Lebensmittel")

    suggestion = category_suggestion_service.suggest_category(user.id, "Rewe", None, "EXPENSE")

    assert suggestion == CategorySuggestion(new_category_name="Lebensmittel")


@pytest.mark.parametrize("error", [
    TimeoutError("Request timed out"),
    ValueError("Model output does not conform to the expected schema"),
])
def test_failing_model_call_returns_no_suggestion(monkeypatch, user, error):
    category_service.create_category(user.id, "Lebensmittel")
    monkeypatch.setenv("Z_AI_API_KEY", "test-key")

    def failing_generate_object(**kwargs):
        raise error

    monkeypatch.setattr(category_suggestion_service, "generate_object", failing_generate_object)

    suggestion = category_suggestion_service.suggest_category(user.id, "Rewe", None, "EXPENSE")

    assert suggestion == NO_SUGGESTION


def test_missing_z_ai_api_key_returns_no_suggestion_without_calling_the_model(monkeypatch, model_answers, user):
    category_service.create_category(user.id, "Lebensmittel")
    calls = model_answers(existing_category_name="Lebensmittel")
    monkeypatch.delenv("Z_AI_API_KEY")
    # Must not silently fall back to an OpenAI key from the environment.
    monkeypatch.setenv("OPENAI_API_KEY", "some-openai-key")

    suggestion = category_suggestion_service.suggest_category(user.id, "Rewe", None, "EXPENSE")

    assert suggestion == NO_SUGGESTION
    assert calls == []


def test_sends_transaction_text_and_category_names_but_no_ids_to_the_model(model_answers, user):
    rent, _ = category_service.create_category(user.id, "Miete")
    groceries, _ = category_service.create_category(user.id, "Lebensmittel")
    calls = model_answers()

    category_suggestion_service.suggest_category(user.id, "Rewe", "Wocheneinkauf", "EXPENSE")

    [call] = calls
    sent_text = "\n".join(value for value in call.values() if isinstance(value, str))
    for expected in ("Rewe", "Wocheneinkauf", "EXPENSE", "Miete", "Lebensmittel"):
        assert expected in sent_text
    for private_id in (user.id, rent.id, groceries.id):
        assert str(private_id) not in sent_text
