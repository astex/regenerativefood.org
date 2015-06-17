from flask.ext.sqlalchemy import SQLAlchemy


db = SQLAlchemy()


def commit():
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        raise e
