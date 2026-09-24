from src.app.services import category_service


def test_created_category_is_listed_for_its_user(user):
    category_service.create_category(user.id, "Lebensmittel")

    categories = category_service.get_user_categories(user.id)

    assert [c.name for c in categories] == ["Lebensmittel"]


def test_creating_a_category_with_the_name_of_a_deleted_one_reports_the_deleted_category(user):
    rent, _ = category_service.create_category(user.id, "Miete")
    category_service.delete_category(rent.id, user.id)

    category, error = category_service.create_category(user.id, "Miete")

    assert error == category_service.DELETED_CATEGORY_WITH_NAME
    assert category.id == rent.id
    assert category.deleted_at is not None
    assert category_service.get_user_categories(user.id) == []


def test_creating_a_category_despite_a_deleted_one_with_that_name_creates_a_new_category(user):
    rent, _ = category_service.create_category(user.id, "Miete")
    category_service.delete_category(rent.id, user.id)

    category, error = category_service.create_category(user.id, "Miete", ignore_deleted_category=True)

    assert error is None
    assert category.id != rent.id
    assert [(c.id, c.name) for c in category_service.get_user_categories(user.id)] == [(category.id, "Miete")]


def test_the_most_recently_deleted_category_is_reported_ignoring_case_and_surrounding_whitespace(user):
    older, _ = category_service.create_category(user.id, "Miete")
    category_service.delete_category(older.id, user.id)
    newer, _ = category_service.create_category(user.id, "miete", ignore_deleted_category=True)
    category_service.delete_category(newer.id, user.id)

    category, _ = category_service.create_category(user.id, "  MIETE ")

    assert category.id == newer.id


def test_renaming_to_the_name_of_a_deleted_category_changes_nothing_and_reports_it(user):
    rent, _ = category_service.create_category(user.id, "Miete")
    category_service.delete_category(rent.id, user.id)
    housing, _ = category_service.create_category(user.id, "Wohnen")

    category, error = category_service.update_category(housing.id, user.id, name="Miete")

    assert error == category_service.DELETED_CATEGORY_WITH_NAME
    assert category.id == rent.id
    assert [c.name for c in category_service.get_user_categories(user.id)] == ["Wohnen"]


def test_renaming_to_the_name_of_a_deleted_category_with_confirmation_renames(user):
    rent, _ = category_service.create_category(user.id, "Miete")
    category_service.delete_category(rent.id, user.id)
    housing, _ = category_service.create_category(user.id, "Wohnen")

    category, error = category_service.update_category(
        housing.id, user.id, name="Miete", ignore_deleted_category=True
    )

    assert error is None
    assert [(c.id, c.name) for c in category_service.get_user_categories(user.id)] == [(housing.id, "Miete")]


def test_restoring_a_deleted_category_brings_it_back_with_its_id(user):
    rent, _ = category_service.create_category(user.id, "Miete")
    category_service.delete_category(rent.id, user.id)

    category, error = category_service.restore_category(rent.id, user.id)

    assert error is None
    assert category.deleted_at is None
    assert [(c.id, c.name) for c in category_service.get_user_categories(user.id)] == [(rent.id, "Miete")]


def test_an_active_category_name_is_taken_regardless_of_case_and_surrounding_whitespace(user):
    category_service.create_category(user.id, "Miete")
    housing, _ = category_service.create_category(user.id, "Wohnen")

    created, create_error = category_service.create_category(user.id, " miete ")
    renamed, rename_error = category_service.update_category(housing.id, user.id, name="MIETE")

    assert (created, renamed) == (None, None)
    assert create_error == "Kategorie mit diesem Namen existiert bereits"
    assert rename_error == "Name bereits vergeben"
    assert sorted(c.name for c in category_service.get_user_categories(user.id)) == ["Miete", "Wohnen"]


def test_a_category_can_be_renamed_to_its_own_name_in_different_case(user):
    rent, _ = category_service.create_category(user.id, "miete")

    category, error = category_service.update_category(rent.id, user.id, name="Miete")

    assert error is None
    assert category.name == "Miete"


def test_restoring_is_refused_while_an_active_category_has_the_name_in_different_case(user):
    rent, _ = category_service.create_category(user.id, "Miete")
    category_service.delete_category(rent.id, user.id)
    category_service.create_category(user.id, "miete", ignore_deleted_category=True)

    category, error = category_service.restore_category(rent.id, user.id)

    assert category is None
    assert error == "Es gibt bereits eine aktive Kategorie mit diesem Namen"
