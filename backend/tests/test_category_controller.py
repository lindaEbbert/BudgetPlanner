import uuid

import pytest

from src.app.services import auth_service, category_service


def test_categories_endpoint_lists_categories_of_authenticated_user(client, user, auth_headers):
    category_service.create_category(user.id, "Miete")

    response = client.get("/categories", headers=auth_headers)

    assert response.status_code == 200
    assert [c["name"] for c in response.get_json()] == ["Miete"]


def test_categories_endpoint_rejects_request_without_jwt(client):
    response = client.get("/categories")

    assert response.status_code == 401


def test_restore_endpoint_returns_the_restored_category(client, user, auth_headers):
    rent, _ = category_service.create_category(user.id, "Miete")
    category_service.delete_category(rent.id, user.id)

    response = client.post(f"/categories/{rent.id}/restore", headers=auth_headers)

    assert response.status_code == 200
    assert response.get_json()["id"] == str(rent.id)
    assert response.get_json()["name"] == "Miete"


def test_restore_endpoint_refuses_when_an_active_category_has_the_name(client, user, auth_headers):
    rent, _ = category_service.create_category(user.id, "Miete")
    category_service.delete_category(rent.id, user.id)
    category_service.create_category(user.id, "Miete", ignore_deleted_category=True)

    response = client.post(f"/categories/{rent.id}/restore", headers=auth_headers)

    assert response.status_code == 409
    assert "error" in response.get_json()


@pytest.fixture
def other_users_deleted_category():
    other, _ = auth_service.register_user("other@example.com", "Other User", "other-password")
    category, _ = category_service.create_category(other.id, "Miete")
    category_service.delete_category(category.id, other.id)
    return category


@pytest.mark.parametrize("case", ["foreign", "missing", "active"])
def test_restore_endpoint_only_restores_own_deleted_categories(
    client, user, auth_headers, other_users_deleted_category, case
):
    active, _ = category_service.create_category(user.id, "Wohnen")
    category_id = {
        "foreign": other_users_deleted_category.id,
        "missing": uuid.uuid4(),
        "active": active.id,
    }[case]

    response = client.post(f"/categories/{category_id}/restore", headers=auth_headers)

    assert response.status_code == 404


def test_restore_endpoint_rejects_request_without_jwt(client):
    response = client.post(f"/categories/{uuid.uuid4()}/restore")

    assert response.status_code == 401


def test_create_endpoint_reports_a_deleted_category_with_the_name(client, user, auth_headers):
    rent, _ = category_service.create_category(user.id, "Miete")
    category_service.delete_category(rent.id, user.id)

    response = client.post("/categories", json={"name": "miete"}, headers=auth_headers)

    assert response.status_code == 409
    deleted_category = response.get_json()["deletedCategory"]
    assert deleted_category["id"] == str(rent.id)
    assert deleted_category["name"] == "Miete"
    assert deleted_category["deletedAt"]


def test_create_endpoint_creates_a_new_category_when_told_to_ignore_the_deleted_one(client, user, auth_headers):
    rent, _ = category_service.create_category(user.id, "Miete")
    category_service.delete_category(rent.id, user.id)

    response = client.post(
        "/categories", json={"name": "Miete", "ignoreDeletedCategory": True}, headers=auth_headers
    )

    assert response.status_code == 201
    assert response.get_json()["id"] != str(rent.id)


def test_update_endpoint_reports_a_deleted_category_with_the_new_name(client, user, auth_headers):
    rent, _ = category_service.create_category(user.id, "Miete")
    category_service.delete_category(rent.id, user.id)
    housing, _ = category_service.create_category(user.id, "Wohnen")

    response = client.put(f"/categories/{housing.id}", json={"name": "Miete"}, headers=auth_headers)

    assert response.status_code == 409
    assert response.get_json()["deletedCategory"]["id"] == str(rent.id)


def test_update_endpoint_renames_when_told_to_ignore_the_deleted_category(client, user, auth_headers):
    rent, _ = category_service.create_category(user.id, "Miete")
    category_service.delete_category(rent.id, user.id)
    housing, _ = category_service.create_category(user.id, "Wohnen")

    response = client.put(
        f"/categories/{housing.id}", json={"name": "Miete", "ignoreDeletedCategory": True}, headers=auth_headers
    )

    assert response.status_code == 200
    assert response.get_json() | {"createdAt": None} == {
        "id": str(housing.id), "name": "Miete", "userId": str(user.id), "createdAt": None
    }


def test_create_endpoint_only_ignores_the_deleted_category_on_an_explicit_true(client, user, auth_headers):
    rent, _ = category_service.create_category(user.id, "Miete")
    category_service.delete_category(rent.id, user.id)

    response = client.post(
        "/categories", json={"name": "Miete", "ignoreDeletedCategory": "false"}, headers=auth_headers
    )

    assert response.status_code == 409
    assert response.get_json()["deletedCategory"]["id"] == str(rent.id)
