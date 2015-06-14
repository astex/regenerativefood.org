import uuid
from app.lib.database import db
from app.controllers.base import RestController
from app.models.entry import Entry


class EntryController(RestController):
    Model = Entry

    def post(self, data):
        data = data.copy()

        slug = data.get('slug')
        title = data.get('title')
        if not slug:
            slug = title.lower().replace(' ', '-')
        if db.session.query(Entry).filter(Entry.slug == slug).first():
            slug = slug + uuid.uuid4()
        data['slug'] = slug

        super(EntryController, self).post(data)
