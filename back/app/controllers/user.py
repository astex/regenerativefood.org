from app.controllers.base import RestController
from app.models.user import User


class UserController(RestController):
    Model = User
