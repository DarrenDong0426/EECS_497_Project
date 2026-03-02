import os
from flask import Flask
from flask_cors import CORS
from models import db
from recordings import recordings_bp

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'recordings.db')

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{DB_PATH}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# Register route blueprints
# TODO: Register more blueprints here if you add more route files (e.g., users_bp, etc.). See models.py
app.register_blueprint(recordings_bp)

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, port=5001, use_reloader=False)
