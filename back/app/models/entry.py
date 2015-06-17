from app.lib.database import db, commit
from app.models import ModelMixin


class Entry(ModelMixin, db.Model):
    slug = db.Column(
        db.Unicode(length=255), nullable=False, unique=True, index=True
    )
    title = db.Column(db.Unicode(length=255), nullable=False)
    created = db.Column(db.DateTime, default=db.func.now())
    parser = db.Column(db.Unicode(length=255), nullable=False)
    src = db.Column(db.UnicodeText, nullable=False)
    owner_id = db.Column(
        db.Integer, db.ForeignKey('user.id'), nullable=False
    )
    parent_id = db.Column(db.Integer, db.ForeignKey('entry.id'))

    def get_dictionary(self):
        d = super(Entry, self).get_dictionary()
        d['tags'] = [
            t.name for t in db.session.query(Tag).join(EntryTag).filter(
                EntryTag.entry_id == self.id_
            ).all()
        ]
        return d

    def parse_tags(self, tag_names):
        """Parses a list of tag names into EntryTags and Tags for an entry."""
        names = [t.strip().lower() for t in tag_names if t.strip()]
        tags = [
            db.session.query(Tag).filter(Tag.name == name).first() or
            Tag(name=name)
            for name in names
        ]
        db.session.add_all([t for t in tags if not t.id_])
        commit()
        entry_tags = [
            db.session.query(EntryTag).filter(
                EntryTag.entry_id == self.id_, EntryTag.tag_id == tag.id_
            ).first() or
            EntryTag(entry_id=self.id_, tag_id=tag.id_)
            for tag in tags
        ]
        db.session.add_all([e for e in entry_tags if not e.id_])
        commit()
        db.session.query(EntryTag).filter(
            ~EntryTag.id_.in_([e.id_ for e in entry_tags]),
            EntryTag.entry_id==self.id_
        ).delete(synchronize_session=False)
        commit()


class EntryTag(ModelMixin, db.Model):
    entry_id = db.Column(db.Integer, db.ForeignKey('entry.id'))
    tag_id = db.Column(db.Integer, db.ForeignKey('tag.id'))


class Tag(ModelMixin, db.Model):
    name = db.Column(
        db.Unicode(length=255), nullable=False, unique=True, index=True
    )
