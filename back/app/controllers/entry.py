from app.controllers.base import RestController
from app.models.entry import Entry


class EntryController(RestController):
    Model = Entry
