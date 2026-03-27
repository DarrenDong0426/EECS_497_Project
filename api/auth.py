import os
from flask import Blueprint, jsonify, request, send_from_directory
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime
import bcrypt
from models import db, User, Recording, Reply

auth_bp = Blueprint('auth', __name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
AVATARS_FOLDER = os.path.join(BASE_DIR, 'avatars')
os.makedirs(AVATARS_FOLDER, exist_ok=True)


@auth_bp.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not email or not username or not password:
        return jsonify({'error': 'Email, username, and password are required'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409

    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    user = User(email=email, username=username, password_hash=password_hash)
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({'token': token, 'user': user.to_dict()}), 201


@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
        return jsonify({'error': 'Invalid email or password'}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({'token': token, 'user': user.to_dict()}), 200


@auth_bp.route('/api/auth/me', methods=['GET'])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())


@auth_bp.route('/api/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)

    username = request.form.get('username', '').strip()
    if username:
        user.username = username

    avatar = request.files.get('avatar')
    if avatar:
        filename = f"avatar_{user_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.jpg"
        avatar.save(os.path.join(AVATARS_FOLDER, filename))
        user.avatar_filename = filename

    db.session.commit()
    return jsonify(user.to_dict())


@auth_bp.route('/api/profile/avatar/<filename>', methods=['GET'])
def get_avatar(filename):
    return send_from_directory(AVATARS_FOLDER, filename)


@auth_bp.route('/api/profile/stats', methods=['GET'])
@jwt_required()
def get_stats():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)

    total_recordings = Recording.query.filter_by(user_id=user_id).count()
    total_replies = Reply.query.filter_by(user_id=user_id).count()
    communities_count = Recording.query.filter_by(user_id=user_id, shared=True).distinct().count()
    member_since = user.created_at.strftime('%B %Y')

    return jsonify({
        'total_recordings': total_recordings,
        'total_replies': total_replies,
        'communities_count': communities_count,
        'member_since': member_since,
    })