import json
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from types import SimpleNamespace

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
    monkeypatch.setenv("LLM_BASE_URL", "http://127.0.0.1:9/v1")
    monkeypatch.setenv("LLM_MODEL", "test-model")

    def failing_generate_object(**kwargs):
        raise error

    monkeypatch.setattr(category_suggestion_service, "generate_object", failing_generate_object)

    suggestion = category_suggestion_service.suggest_category(user.id, "Rewe", None, "EXPENSE")

    assert suggestion == NO_SUGGESTION


@pytest.mark.parametrize("missing_setting", ["LLM_BASE_URL", "LLM_MODEL"])
def test_missing_endpoint_setting_returns_no_suggestion_without_calling_the_model(
    monkeypatch, model_answers, user, missing_setting
):
    category_service.create_category(user.id, "Lebensmittel")
    calls = model_answers(existing_category_name="Lebensmittel")
    monkeypatch.delenv(missing_setting)
    # Must not silently fall back to OpenAI via its own environment variables.
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


@pytest.fixture
def fake_llm_endpoint(monkeypatch):
    """Local stand-in for an OpenAI-compatible chat completions API that records every request."""
    state = SimpleNamespace(answer={}, requests=[], delay_seconds=0)

    class Handler(BaseHTTPRequestHandler):
        def do_POST(self):
            body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
            state.requests.append({
                "path": self.path,
                "authorization": self.headers.get("Authorization"),
                "body": body,
            })
            time.sleep(state.delay_seconds)
            payload = json.dumps({
                "id": "chatcmpl-test",
                "object": "chat.completion",
                "created": 0,
                "model": body["model"],
                "choices": [{
                    "index": 0,
                    "finish_reason": "stop",
                    "message": {"role": "assistant", "content": json.dumps(state.answer)},
                }],
                "usage": {"prompt_tokens": 1, "completion_tokens": 1, "total_tokens": 2},
            }).encode()
            try:
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
            except ConnectionError:
                # The client already gave up (timeout test); nothing left to answer.
                pass

        def log_message(self, *args):
            pass

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    threading.Thread(target=server.serve_forever, kwargs={"poll_interval": 0.05}, daemon=True).start()
    monkeypatch.setenv("LLM_BASE_URL", f"http://127.0.0.1:{server.server_port}/v1")
    monkeypatch.setenv("LLM_MODEL", "test-model")
    monkeypatch.setenv("LLM_API_KEY", "test-key")
    # If the client swap in _build_model ever stops working, fail locally instead of calling the real OpenAI API.
    monkeypatch.setenv("OPENAI_BASE_URL", "http://127.0.0.1:9/")

    yield state

    server.shutdown()
    server.server_close()


def test_suggestion_request_reaches_the_configured_endpoint_with_its_model_and_key(fake_llm_endpoint, user):
    groceries, _ = category_service.create_category(user.id, "Lebensmittel")
    fake_llm_endpoint.answer = {"existing_category_name": "Lebensmittel", "new_category_name": None}

    suggestion = category_suggestion_service.suggest_category(user.id, "Rewe", "Wocheneinkauf", "EXPENSE")

    assert suggestion == CategorySuggestion(category_id=groceries.id)
    assert fake_llm_endpoint.requests
    for request in fake_llm_endpoint.requests:
        assert request["path"] == "/v1/chat/completions"
        assert request["authorization"] == "Bearer test-key"
        assert request["body"]["model"] == "test-model"
        # No provider-specific parameters: any OpenAI-compatible endpoint must accept the request.
        assert "thinking" not in request["body"]


def test_endpoint_without_api_key_still_gets_the_request(monkeypatch, fake_llm_endpoint, user):
    groceries, _ = category_service.create_category(user.id, "Lebensmittel")
    fake_llm_endpoint.answer = {"existing_category_name": "Lebensmittel", "new_category_name": None}
    monkeypatch.delenv("LLM_API_KEY")
    # A local server like LM Studio needs no key; an OpenAI key must never leak to it.
    monkeypatch.setenv("OPENAI_API_KEY", "some-openai-key")

    suggestion = category_suggestion_service.suggest_category(user.id, "Rewe", None, "EXPENSE")

    assert suggestion == CategorySuggestion(category_id=groceries.id)
    assert fake_llm_endpoint.requests
    for request in fake_llm_endpoint.requests:
        assert "some-openai-key" not in (request["authorization"] or "")


def test_endpoint_slower_than_the_configured_timeout_returns_no_suggestion(monkeypatch, fake_llm_endpoint, user):
    category_service.create_category(user.id, "Lebensmittel")
    fake_llm_endpoint.answer = {"existing_category_name": "Lebensmittel", "new_category_name": None}
    fake_llm_endpoint.delay_seconds = 1
    monkeypatch.setenv("LLM_TIMEOUT_SECONDS", "0.2")

    suggestion = category_suggestion_service.suggest_category(user.id, "Rewe", None, "EXPENSE")

    assert suggestion == NO_SUGGESTION
