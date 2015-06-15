import bcrypt

from app.lib.database import db
from app.models import ModelMixin


class User(ModelMixin, db.Model):
    name = db.Column(db.Unicode(length=255), nullable=False)
    email = db.Column(
        db.Unicode(length=255), nullable=False, unique=True, index=True
    )
    _password = db.Column('password', db.Binary(length=60), nullable=False)

    is_admin = db.Column(db.Boolean, nullable=False, default=False)

    @property
    def password(self):
        return self._password
    @password.setter
    def password(self, val):
        self._password = bcrypt.hashpw(val.encode('utf-8'), bcrypt.gensalt())

    def check_password(self, val):
        return bcrypt.hashpw(val.encode('utf-8'), self.password) == \
            self.password

    def get_dictionary(self, verbosity):
        d = {'id': self.id_, 'name': self.name}

        if verbosity not in ['admin', 'self']:
            return d

        d.update({'is_admin': self.is_admin, 'email': self.email})

        return d
