from app.models.entry import Entry
from app.views.base import RestView


class EntryView(RestView):
    Model = Entry
