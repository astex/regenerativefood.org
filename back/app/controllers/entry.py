import uuid
from app.lib.database import db
from app.controllers.base import RestController
from app.models.entry import Entry


class EntryController(RestController):
    Model = Entry
    filters = {
        'owner_id': lambda d: Entry.owner_id == d.get('owner_id'),
        'parent_id': lambda d: Entry.parent_id == d.get('parent_id'),
        'parent_id__null': lambda d: (
            (Entry.parent_id == None)
            if d.get('parent_id__null')
            else (Entry.parent_id != None)
        )
    }

    def post(self, data, filter_data):
        data = data.copy()

        slug = data.get('slug')
        title = data.get('title')
        if not slug:
            slug = title.lower().replace(' ', '-')
        if db.session.query(Entry).filter(Entry.slug == slug).first():
            slug = slug + uuid.uuid4()
        data['slug'] = slug

        return super(EntryController, self).post(data, filter_data)
