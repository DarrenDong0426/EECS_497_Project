import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from sqlalchemy import inspect, text
from models import db
from recordings import recordings_bp
from auth import auth_bp

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'recordings.db')

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{DB_PATH}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'change-this-to-a-random-secret-in-production'

db.init_app(app)
JWTManager(app)

app.register_blueprint(recordings_bp)
app.register_blueprint(auth_bp)


def run_schema_updates():
    inspector = inspect(db.engine)

    if 'recordings' in inspector.get_table_names():
        columns = {col['name'] for col in inspector.get_columns('recordings')}
        if 'shared' not in columns:
            db.session.execute(text('ALTER TABLE recordings ADD COLUMN shared BOOLEAN DEFAULT 0'))

    if 'replies' not in inspector.get_table_names():
        db.session.execute(text('''
            CREATE TABLE replies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                recording_id INTEGER NOT NULL,
                user_id VARCHAR(100) NOT NULL DEFAULT 'temp_user',
                text TEXT DEFAULT '',
                filename VARCHAR(255),
                duration INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(recording_id) REFERENCES recordings(id)
            )
        '''))

    if 'recording_likes' not in inspector.get_table_names():
        db.session.execute(text('''
            CREATE TABLE recording_likes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                recording_id INTEGER NOT NULL,
                user_id VARCHAR(100) NOT NULL DEFAULT 'temp_user',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(recording_id) REFERENCES recordings(id),
                UNIQUE(recording_id, user_id)
            )
        '''))

    db.session.commit()


with app.app_context():
    db.create_all()
    run_schema_updates()

if __name__ == '__main__':
    app.run(debug=True, port=5001, use_reloader=False)