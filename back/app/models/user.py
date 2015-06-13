import bcrypt

from app.lib.database import db
from app.models import ModelMixin


class User(ModelMixin, db.Model):
    email = db.Column(
        db.Unicode(length=255), nullable=False, unique=True, index=True
    )
    _password = db.Column('password', db.Unicode(length=255), nullable=False)

    @property
    def password(self):
        return self._password
    @password.setter
    def password(self, val):
        self._password = bcrypt.hashpw(val.encode('utf-8'), bcrypt.gensalt())

    def check_password(self, val):
        return bcrypt.hashpw(val.encode('utf-8'), self.password) == \
            self.password

    def get_dictionary(self):
        return {'id': self.id_, 'email': self.email}
