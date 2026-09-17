import json
import threading
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


@pytest.fixture
def fake_z_ai(monkeypatch):
    """Local stand-in for the z.ai chat completions API that records every request."""
    state = SimpleNamespace(answer={}, requests=[])

    class Handler(BaseHTTPRequestHandler):
        def do_POST(self):
            body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
            state.requests.append({
                "path": self.path,
                "authorization": self.headers.get("Authorization"),
                "body": body,
            })
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
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)

        def log_message(self, *args):
            pass

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    threading.Thread(target=server.serve_forever, kwargs={"poll_interval": 0.05}, daemon=True).start()
    monkeypatch.setenv("Z_AI_API_KEY", "test-key")
    monkeypatch.setattr(
        category_suggestion_service, "Z_AI_BASE_URL", f"http://127.0.0.1:{server.server_port}/api/paas/v4/"
    )
    # If the client swap in _build_model ever stops working, fail locally instead of calling the real OpenAI API.
    monkeypatch.setenv("OPENAI_BASE_URL", "http://127.0.0.1:9/")

    yield state

    server.shutdown()
    server.server_close()


def test_suggestion_request_reaches_the_z_ai_endpoint_with_key_model_and_thinking_disabled(fake_z_ai, user):
    groceries, _ = category_service.create_category(user.id, "Lebensmittel")
    fake_z_ai.answer = {"existing_category_name": "Lebensmittel", "new_category_name": None}

    suggestion = category_suggestion_service.suggest_category(user.id, "Rewe", "Wocheneinkauf", "EXPENSE")

    assert suggestion == CategorySuggestion(category_id=groceries.id)
    assert fake_z_ai.requests
    for request in fake_z_ai.requests:
        assert request["path"] == "/api/paas/v4/chat/completions"
        assert request["authorization"] == "Bearer test-key"
        assert request["body"]["model"] == "glm-4.7-flash"
        assert request["body"]["thinking"] == {"type": "disabled"}
