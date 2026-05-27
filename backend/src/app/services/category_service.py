from src.app.repositories.category_repository import CategoryRepository
from src.app.models.categories import CategoryType

category_repository = CategoryRepository()


def get_user_categories(user_id):
    return category_repository.get_all_by_user(user_id)


def create_category(user_id, name: str, category_type: str):
    if category_repository.name_exists_for_user(user_id, name):
        return None, "Kategorie mit diesem Namen existiert bereits"

    category = category_repository.create_category(
        user_id=user_id,
        name=name,
        category_type=CategoryType[category_type]
    )
    return category, None


def update_category(category_id, user_id, name: str = None, category_type: str = None):
    category = category_repository.get_by_id(category_id)
    if not category:
        return None, "Kategorie nicht gefunden"
    if str(category.user_id) != str(user_id):
        return None, "Keine Berechtigung"

    data = {}
    if name and name != category.name:
        if category_repository.name_exists_for_user(user_id, name):
            return None, "Name bereits vergeben"
        data['name'] = name
    if category_type:
        data['type'] = CategoryType[category_type]

    updated = category_repository.update(category, data)
    return updated, None


def delete_category(category_id, user_id):
    category = category_repository.get_by_id(category_id)
    if not category:
        return False, "Kategorie nicht gefunden"
    if str(category.user_id) != str(user_id):
        return False, "Keine Berechtigung"

    category_repository.soft_delete(category_id)
    return True, None