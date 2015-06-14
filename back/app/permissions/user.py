from flask import session
from app.permissions.base import BaseNeed


class LoginNeed(BaseNeed):
    def is_met(self):
        return bool(session)
login_need = LoginNeed()


class AdminNeed(BaseNeed):
    def is_met(self):
        return session and session.user.is_admin
admin_need = AdminNeed()


class SelfNeed(BaseNeed):
    def __init__(self, user_id):
        self.user_id = user_id

    def is_met(self):
        return session and str(session.get('user_id')) == self.user_id
