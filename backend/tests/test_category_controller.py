from src.app.services import category_service


def test_categories_endpoint_lists_categories_of_authenticated_user(client, user, auth_headers):
    category_service.create_category(user.id, "Miete")

    response = client.get("/categories", headers=auth_headers)

    assert response.status_code == 200
    assert [c["name"] for c in response.get_json()] == ["Miete"]


def test_categories_endpoint_rejects_request_without_jwt(client):
    response = client.get("/categories")

    assert response.status_code == 401
