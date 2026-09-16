from src.app.services import category_service


def test_created_category_is_listed_for_its_user(user):
    category_service.create_category(user.id, "Lebensmittel")

    categories = category_service.get_user_categories(user.id)

    assert [c.name for c in categories] == ["Lebensmittel"]
