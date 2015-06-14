from werkzeug.exceptions import NotFound
from app.lib.database import db


class RestController(object):
    Model = None

    def commit(self):
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise e

    def index(self):
        return db.session.query(self.Model).all()

    def get(self, id_):
        model = db.session.query(self.Model).filter(self.Model.id_==id_).first()
        if not model:
            raise NotFound
        return model

    def post(self, data):
        model = self.Model(**request.json)
        db.session.add(model)
        self.commit()
        return model

    def put(self, id_, data):
        model = self.get(id_)
        model.update(data)
        db.session.add(model)
        self.commit()
        return model

    def delete(self, id_):
        model = self.get(id_)
        db.session.delete(model)
        self.commit()
        return {}
