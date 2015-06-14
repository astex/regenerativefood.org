from werkzeug.exceptions import NotFound
from flask import jsonify, request
from flask.ext.classy import FlaskView
from app.lib.database import db


class View(FlaskView):
    def json(self, obj, status=200):
        return jsonify(data=obj), status

    def parse(self, model):
        return model.get_dictionary()


class RestView(View):
    def get_controller(self):
        pass

    def index(self):
        return self.json([self.parse(m) for m in self.get_controller().index()])

    def get(self, id_):
        return self.json(self.parse(self.get_controller().get(id_)))

    def post(self):
        return self.json(self.parse(
            self.get_controller().post(request.json)
        ), 201)

    def put(self, id_):
        return self.json(self.parse(
            self.get_controller().put(id_, request.json)
        ))

    def delete(self, id_):
        return self.json(self.get_controller().delete(id_), 204)
