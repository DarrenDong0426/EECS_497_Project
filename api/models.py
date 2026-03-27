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

    replies = db.relationship('Reply', backref='recording', lazy='dynamic', cascade='all, delete-orphan')
    likes = db.relationship('RecordingLike', backref='recording', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'filename': self.filename,
            'transcript': self.transcript,
            'duration': self.duration,
            'shared': self.shared,
            'created_at': self.created_at.isoformat(),
            'replies_count': self.replies.count(),
            'likes_count': self.likes.count(),
        }


class Reply(db.Model):
    __tablename__ = 'replies'

    id = db.Column(db.Integer, primary_key=True)
    recording_id = db.Column(db.Integer, db.ForeignKey('recordings.id'), nullable=False, index=True)
    user_id = db.Column(db.String(100), nullable=False, default='temp_user')
    text = db.Column(db.Text, default='')
    filename = db.Column(db.String(255), nullable=True)
    duration = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'recording_id': self.recording_id,
            'user_id': self.user_id,
            'text': self.text,
            'filename': self.filename,
            'duration': self.duration,
            'created_at': self.created_at.isoformat(),
            'type': 'recording' if self.filename else 'text',
        }


class RecordingLike(db.Model):
    __tablename__ = 'recording_likes'

    id = db.Column(db.Integer, primary_key=True)
    recording_id = db.Column(db.Integer, db.ForeignKey('recordings.id'), nullable=False, index=True)
    user_id = db.Column(db.String(100), nullable=False, default='temp_user')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('recording_id', 'user_id', name='uq_recording_like_user'),
    )

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    username = db.Column(db.String(100), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    avatar_filename = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'username': self.username,
            'avatar_filename': self.avatar_filename,
            'created_at': self.created_at.isoformat(),
        }