from app.views.base import RestView
from app.controllers.entry import EntryController


class EntryView(RestView):
    def get_controller(self):
        return EntryController()
