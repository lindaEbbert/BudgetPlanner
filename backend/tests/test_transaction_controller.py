import pytest

from src.app.services import category_service


def test_category_suggestion_endpoint_returns_the_matching_category(client, user, auth_headers, model_answers):
    groceries, _ = category_service.create_category(user.id, "Lebensmittel")
    model_answers(existing_category_name="Lebensmittel")

    response = client.post(
        "/transactions/category-suggestion",
        json={"name": "Rewe", "description": "Wocheneinkauf", "type": "EXPENSE"},
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.get_json() == {"categoryId": str(groceries.id), "newCategoryName": None}


def test_category_suggestion_endpoint_rejects_request_without_jwt(client):
    response = client.post("/transactions/category-suggestion", json={"name": "Rewe", "type": "EXPENSE"})

    assert response.status_code == 401


@pytest.mark.parametrize("body", [
    {"type": "EXPENSE"},
    {"name": "Rewe"},
    {"name": "", "type": "EXPENSE"},
    {"name": "Rewe", "type": "SONSTIGES"},
])
def test_category_suggestion_endpoint_requires_name_and_a_valid_type(client, auth_headers, model_answers, body):
    calls = model_answers(existing_category_name="Lebensmittel")

    response = client.post("/transactions/category-suggestion", json=body, headers=auth_headers)

    assert response.status_code == 400
    assert calls == []
