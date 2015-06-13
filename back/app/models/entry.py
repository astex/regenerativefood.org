from app.lib.database import db
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
