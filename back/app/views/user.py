from flask import request, session
from werkzeug.exceptions import Unauthorized, BadRequest
from app.lib.database import db
from app.controllers.user import UserController
from app.views.base import View, RestView
from app.models.user import User
from app.permissions.base import BaseNeed
from app.permissions.user import admin_need, login_need, SelfNeed


class UserView(RestView):
    def get_controller(self):
        return UserController()

    def parse(self, model):
        try:
            verbosity = request.args['verbosity']
        except KeyError:
            raise BadRequest('Please pass a verbosity.')

        return model.get_dictionary(verbosity)

    def get_verbosity_need(self, user_id=None):
        verbosity = request.args.get('verbosity')

        need = admin_need
        if verbosity == 'self':
            need |= SelfNeed(user_id)
        elif verbosity == 'guest':
            need |= login_need

        return need

    def get_content_need(self):
        is_admin = request.json.get('is_admin')

        need = admin_need
        if not is_admin:
            need |= BaseNeed()

        return need

    def index(self):
        with self.get_verbosity_need():
            return super(UserView, self).index()

    def get(self, id_):
        with self.get_verbosity_need(id_):
            return super(UserView, self).get(id_)

    def post(self):
        with self.get_content_need():
            return super(UserView, self).post()

    def put(self, id_):
        need = admin_need | SelfNeed(id_)
        with need & self.get_content_need():
            return super(UserView, self).put(id_)

    def delete(self, id_):
        with admin_need | SelfNeed(id_):
            return super(UserView, self).delete(id_)


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

    @login_need
    def delete(self):
        session.clear()
        return self.json({}, 204)
