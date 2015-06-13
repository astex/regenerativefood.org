from flask import request, session
from werkzeug.exceptions import Unauthorized
from app.lib.database import db
from app.models.user import User
from app.views.base import View, RestView


class UserView(RestView):
    Model = User


class SessionView(View):
    def index(self):
        if not session:
            return self.json({})
        return self.json(session.get_dictionary())

    def post(self):
        user = db.session.query(User).filter(
            User.email == request.json.get('email')
        ).first()

        if not user:
            raise Unauthorized

        if not user.check_password(request.json.get('password')):
            raise Unauthorized

        session.clear()
        session['user_id'] = user.id_
        session.permanent = True
        return self.json(session.get_dictionary(), 201)

    def delete(self):
        if not session:
            raise Unauthorized

        session.clear()
        return self.json({}, 204)
