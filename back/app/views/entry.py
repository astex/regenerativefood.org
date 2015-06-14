from app.views.base import RestView
from app.controllers.entry import EntryController
from app.permissions.user import login_need, admin_need
from app.permissions.entry import OwnerNeed


class EntryView(RestView):
    def get_controller(self):
        return EntryController()

    @login_need
    def index(self):
        return super(EntryView, self).index()

    @login_need
    def get(self, id_):
        return super(EntryView, self).get(id_)

    @login_need
    def post(self):
        return super(EntryView, self).post()

    def put(self, id_):
        with admin_need | OwnerNeed(id_):
            return super(EntryView, self).put(id_)

    def delete(self, id_):
        with admin_need | OwnerNeed(id_):
            return super(EntryView, self).delete(id_)
