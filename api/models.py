from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Recording(db.Model):
    __tablename__ = 'recordings'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(100), nullable=False, default='temp_user')
    filename = db.Column(db.String(255), nullable=False)
    transcript = db.Column(db.Text, default='')
    duration = db.Column(db.Integer, default=0)
    shared = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'filename': self.filename,
            'transcript': self.transcript,
            'duration': self.duration,
            'shared': self.shared,
            'created_at': self.created_at.isoformat(),
        }

# TODO: Add more database classes here if needed (e.g., User, etc.)