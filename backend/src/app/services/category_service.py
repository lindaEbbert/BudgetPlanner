from src.app.repositories.category_repository import CategoryRepository

category_repository = CategoryRepository()

CATEGORY_NOT_FOUND = "Kategorie nicht gefunden"
# Comes together with the deleted category in place of the created or renamed one,
# so the client can offer to restore it or go on anyway.
DELETED_CATEGORY_WITH_NAME = "Es gibt eine gelöschte Kategorie mit diesem Namen"


def get_user_categories(user_id):
    return category_repository.get_all_by_user(user_id)


def _deleted_category_with_name(user_id, name: str, ignore_deleted_category: bool):
    if ignore_deleted_category:
        return None
    return category_repository.find_latest_deleted_by_name(user_id, name)


def create_category(user_id, name: str, ignore_deleted_category: bool = False):
    if category_repository.name_exists_for_user(user_id, name):
        return None, "Kategorie mit diesem Namen existiert bereits"

    deleted_category = _deleted_category_with_name(user_id, name, ignore_deleted_category)
    if deleted_category:
        return deleted_category, DELETED_CATEGORY_WITH_NAME

    category = category_repository.create_category(
        user_id=user_id,
        name=name
    )
    return category, None


def update_category(category_id, user_id, name: str = None, ignore_deleted_category: bool = False):
    category = category_repository.get_by_id(category_id)
    if not category:
        return None, CATEGORY_NOT_FOUND
    if str(category.user_id) != str(user_id):
        return None, "Keine Berechtigung"

    data = {}
    if name and name != category.name:
        if category_repository.name_exists_for_user(user_id, name, except_category_id=category.id):
            return None, "Name bereits vergeben"
        deleted_category = _deleted_category_with_name(user_id, name, ignore_deleted_category)
        if deleted_category:
            return deleted_category, DELETED_CATEGORY_WITH_NAME
        data['name'] = name

    updated = category_repository.update(category, data)
    return updated, None


def delete_category(category_id, user_id):
    category = category_repository.get_by_id(category_id)
    if not category:
        return False, CATEGORY_NOT_FOUND
    if str(category.user_id) != str(user_id):
        return False, "Keine Berechtigung"

    category_repository.soft_delete(category_id)
    return True, None


def restore_category(category_id, user_id):
    category = category_repository.get_by_id(category_id)
    if not category or str(category.user_id) != str(user_id) or category.deleted_at is None:
        return None, CATEGORY_NOT_FOUND
    if category_repository.name_exists_for_user(user_id, category.name):
        return None, "Es gibt bereits eine aktive Kategorie mit diesem Namen"

    category = category_repository.update(category, {'deleted_at': None})
    return category, None
