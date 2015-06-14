import uuid
from app.lib.database import db
from app.controllers.base import RestController
from app.models.entry import Entry


class EntryController(RestController):
    Model = Entry
    filters = {
        'owner_id': lambda d: Entry.owner_id == d.get('owner_id')
    }

    def post(self, data):
        data = data.copy()

        slug = data.get('slug')
        title = data.get('title')
        if not slug:
            slug = title.lower().replace(' ', '-')
        if db.session.query(Entry).filter(Entry.slug == slug).first():
            slug = slug + uuid.uuid4()
        data['slug'] = slug

        return super(EntryController, self).post(data)
