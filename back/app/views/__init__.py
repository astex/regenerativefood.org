from app.views import entry
from app.views import user


def register(app):
    entry.EntryView.register(app)
    user.UserView.register(app)
    user.SessionView.register(app)
