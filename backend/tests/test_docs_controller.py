def test_openapi_json_is_served_without_jwt(client):
    response = client.get("/openapi.json")

    assert response.status_code == 200
    assert response.mimetype == "application/json"
    spec = response.get_json()
    assert spec["openapi"] == "3.1.0"
    assert "/transactions" in spec["paths"]


def test_swagger_ui_is_served_without_jwt_and_loads_the_openapi_json(client):
    response = client.get("/docs")

    assert response.status_code == 200
    assert response.mimetype == "text/html"
    html = response.get_data(as_text=True)
    assert "SwaggerUIBundle" in html
    assert "url: '/openapi.json'" in html
