from typing import Generic, TypeVar, Type, Optional
from sqlalchemy.orm import Session

T = TypeVar("T")


class BaseRepository(Generic[T]):
    def __init__(self, model: Type[T], db: Session):
        self.model = model
        self.db = db

    def get_by_id(self, entity_id: int) -> Optional[T]:
        return self.db.query(self.model).filter(self.model.id == entity_id).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> list[T]:
        return self.db.query(self.model).offset(skip).limit(limit).all()

    def create(self, obj_data: dict) -> T:
        instance = self.model(**obj_data)
        self.db.add(instance)
        self.db.commit()
        self.db.refresh(instance)
        return instance

    def update(self, entity_id: int, obj_data: dict) -> Optional[T]:
        instance = self.get_by_id(entity_id)
        if instance is None:
            return None
        for key, value in obj_data.items():
            setattr(instance, key, value)
        self.db.commit()
        self.db.refresh(instance)
        return instance

    def delete(self, entity_id: int) -> bool:
        instance = self.get_by_id(entity_id)
        if instance is None:
            return False
        self.db.delete(instance)
        self.db.commit()
        return True

    def count(self, **filters) -> int:
        query = self.db.query(self.model)
        for attr, value in filters.items():
            query = query.filter(getattr(self.model, attr) == value)
        return query.count()
