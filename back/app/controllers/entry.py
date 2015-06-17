import uuid
from sqlalchemy import and_
from app.lib.database import db, commit
from app.controllers.base import RestController
from app.models.entry import Entry, EntryTag, Tag


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

    def filter_(self, q, filter_data):
        q = super(EntryController, self).filter_(q, filter_data)

        tags = filter_data.getlist('tag_names[]')
        if tags:
            q = q.filter(*[
                db.session.query(EntryTag).join(Tag).filter(
                    Tag.name == t, EntryTag.entry_id == Entry.id_
                ).exists() for t in tags
            ])

        return q

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

    def delete(self, id_, filter_data):
        db.session.query(EntryTag).filter(EntryTag.entry_id==id_).delete()
        return super(EntryController, self).delete(id_, filter_data)
