from needs import Need
from werkzeug.exceptions import Unauthorized


class BaseNeed(Need):
    error = Unauthorized
