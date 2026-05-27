from src.app.db import db


class BaseRepository:
    def __init__(self, model):
        self.model = model

    def get_by_id(self, entity_id):
        return self.model.query.get(entity_id)

    def get_all(self):
        return self.model.query.all()

    def create(self, data: dict):
        entity = self.model(**data)
        db.session.add(entity)
        db.session.commit()
        return entity

    def update(self, entity, data: dict):
        for key, value in data.items():
            setattr(entity, key, value)
        db.session.commit()
        return entity

    def delete(self, entity):
        db.session.delete(entity)
        db.session.commit()