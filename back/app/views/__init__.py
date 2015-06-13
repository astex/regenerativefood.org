from app.views import user


def register(app):
    user.UserView.register(app)
    user.SessionView.register(app)
