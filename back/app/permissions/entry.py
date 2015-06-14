from flask import session
from app.lib.database import db
from app.permissions.base import BaseNeed
from app.models.entry import Entry


class OwnerNeed(BaseNeed):
    def __init__(self, entry_id):
        self.entry_id = entry_id

    def is_met(self):
        return bool(db.session.query(Entry).filter(
            Entry.id_ == self.entry_id,
            Entry.owner_id == session.get('user_id')
        ).first())
