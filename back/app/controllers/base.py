import six
from werkzeug.exceptions import NotFound
from app.lib.database import db, commit


class RestController(object):
    Model = None

    filters = {}

    def filter_(self, q, filter_data):
        for k, f in six.iteritems(self.filters):
            if k in filter_data:
                q = q.filter(f(filter_data))
        return q

    def index(self, filter_data):
        q = db.session.query(self.Model)
        q = self.filter_(q, filter_data)
        return q.all()

    def get(self, id_, filter_data=None):
        if filter_data == None:
            filter_data = {}

        model = db.session.query(self.Model).filter(self.Model.id_==id_).first()
        if not model:
            raise NotFound
        return model

    def post(self, data, filter_data):
        model = self.Model(**data)
        db.session.add(model)
        commit()
        return model

    def put(self, id_, data, filter_data):
        model = self.get(id_)
        model.update(data)
        db.session.add(model)
        commit()
        return model

    def delete(self, id_, filter_data):
        model = self.get(id_)
        db.session.delete(model)
        commit()
        return {}
