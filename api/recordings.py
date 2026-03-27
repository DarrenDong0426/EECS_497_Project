import os
from datetime import datetime
import calendar
from flask import Blueprint, jsonify, request, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Recording, Reply, RecordingLike

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'recordings')
REPLIES_FOLDER = os.path.join(UPLOAD_FOLDER, 'replies')

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(REPLIES_FOLDER, exist_ok=True)

recordings_bp = Blueprint('recordings', __name__)


@recordings_bp.route('/api/recordings', methods=['POST'])
@jwt_required()
def upload_recording():
    user_id = get_jwt_identity()
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    audio = request.files['audio']
    transcript = request.form.get('transcript', '')
    duration = request.form.get('duration', 0, type=int)

    filename = f"recording_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.webm"
    audio.save(os.path.join(UPLOAD_FOLDER, filename))

    recording = Recording(
        user_id=user_id,
        filename=filename,
        transcript=transcript,
        duration=duration,
        shared=False,
    )
    db.session.add(recording)
    db.session.commit()

    return jsonify({
        'message': 'Recording saved',
        'recording': recording.to_dict(),
    }), 201


@recordings_bp.route('/api/recordings', methods=['GET'])
@jwt_required()
def list_recordings():
    user_id = get_jwt_identity()
    date_str = request.args.get('date')
    exclude_user = request.args.get('exclude_user')

    query = Recording.query

    if date_str:
        try:
            target = datetime.strptime(date_str, '%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'Invalid date format'}), 400
        start = target.replace(hour=0, minute=0, second=0)
        end   = target.replace(hour=23, minute=59, second=59)
        query = query.filter(
            Recording.user_id == user_id,
            Recording.created_at >= start,
            Recording.created_at <= end,
        ).order_by(Recording.created_at.asc())
    else:
        req_user_id = request.args.get('user_id')
        if req_user_id:
            query = query.filter(Recording.user_id == int(req_user_id))
        elif exclude_user:
            query = query.filter(Recording.user_id != exclude_user)
        else:
            query = query.filter(Recording.shared == True)
        query = query.order_by(Recording.created_at.desc())
        
    return jsonify([r.to_dict() for r in query.all()])


@recordings_bp.route('/api/recordings/counts', methods=['GET'])
@jwt_required()
def get_recording_counts():
    user_id = get_jwt_identity()
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)

    if not year or not month:
        return jsonify({'error': 'year and month are required'}), 400

    from sqlalchemy import func

    start = datetime(year, month, 1)
    end = datetime(year, month, calendar.monthrange(year, month)[1], 23, 59, 59)

    rows = (
        db.session.query(
            func.date(Recording.created_at).label('day'),
            func.count(Recording.id).label('count')
        )
        .filter(
            Recording.user_id == user_id,
            Recording.created_at >= start,
            Recording.created_at <= end,
        )
        .group_by(func.date(Recording.created_at))
        .all()
    )

    counts = {str(row.day): row.count for row in rows}
    return jsonify(counts)


@recordings_bp.route('/api/recordings/<int:recording_id>', methods=['GET'])
@jwt_required()
def get_recording(recording_id):
    user_id = get_jwt_identity()
    recording = Recording.query.get_or_404(recording_id)
    data = recording.to_dict()
    data['liked_by_me'] = RecordingLike.query.filter_by(recording_id=recording_id, user_id=user_id).first() is not None
    return jsonify(data)


@recordings_bp.route('/api/recordings/<int:recording_id>', methods=['DELETE'])
@jwt_required()
def delete_recording(recording_id):
    recording = Recording.query.get_or_404(recording_id)

    filepath = os.path.join(UPLOAD_FOLDER, recording.filename)
    if os.path.exists(filepath):
        os.remove(filepath)

    for reply in recording.replies.all():
        if reply.filename:
            reply_path = os.path.join(REPLIES_FOLDER, reply.filename)
            if os.path.exists(reply_path):
                os.remove(reply_path)

    db.session.delete(recording)
    db.session.commit()
    return jsonify({'message': 'Recording deleted'}), 200


@recordings_bp.route('/api/recordings/<int:recording_id>/share', methods=['PUT'])
@jwt_required()
def share_recording(recording_id):
    recording = Recording.query.get_or_404(recording_id)
    recording.shared = True
    db.session.commit()
    return jsonify({'message': 'Recording shared', 'recording': recording.to_dict()})


@recordings_bp.route('/api/recordings/<int:recording_id>/like', methods=['POST'])
@jwt_required()
def toggle_like(recording_id):
    user_id = get_jwt_identity()
    Recording.query.get_or_404(recording_id)

    existing = RecordingLike.query.filter_by(recording_id=recording_id, user_id=user_id).first()
    if existing:
        db.session.delete(existing)
        liked = False
    else:
        db.session.add(RecordingLike(recording_id=recording_id, user_id=user_id))
        liked = True

    db.session.commit()
    likes_count = RecordingLike.query.filter_by(recording_id=recording_id).count()
    return jsonify({'liked': liked, 'likes_count': likes_count})


@recordings_bp.route('/api/recordings/<int:recording_id>/replies', methods=['GET'])
@jwt_required()
def list_replies(recording_id):
    Recording.query.get_or_404(recording_id)
    replies = Reply.query.filter_by(recording_id=recording_id).order_by(Reply.created_at.desc()).all()
    return jsonify([reply.to_dict() for reply in replies])


@recordings_bp.route('/api/recordings/<int:recording_id>/replies', methods=['POST'])
@jwt_required()
def create_reply(recording_id):
    user_id = get_jwt_identity()
    Recording.query.get_or_404(recording_id)

    text = request.form.get('text', '').strip()
    duration = request.form.get('duration', 0, type=int)
    audio = request.files.get('audio')
    filename = None

    if audio:
        filename = f"reply_{recording_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.webm"
        audio.save(os.path.join(REPLIES_FOLDER, filename))

    if not text and not filename:
        return jsonify({'error': 'Reply must include text or audio'}), 400

    reply = Reply(
        recording_id=recording_id,
        user_id=user_id,
        text=text,
        filename=filename,
        duration=duration,
    )
    db.session.add(reply)
    db.session.commit()

    return jsonify({'message': 'Reply created', 'reply': reply.to_dict(), 'replies_count': Reply.query.filter_by(recording_id=recording_id).count()}), 201


# No @jwt_required() on audio routes so the browser can play audio directly
@recordings_bp.route('/api/replies/<int:reply_id>/audio', methods=['GET'])
def get_reply_audio_file(reply_id):
    reply = Reply.query.get_or_404(reply_id)
    if not reply.filename:
        return jsonify({'error': 'This reply does not have audio'}), 404
    return send_from_directory(REPLIES_FOLDER, reply.filename)


@recordings_bp.route('/api/recordings/<int:recording_id>/similar', methods=['GET'])
@jwt_required()
def find_similar(recording_id):
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity

    target = Recording.query.get_or_404(recording_id)

    if not target.transcript or not target.transcript.strip():
        return jsonify([])

    others = Recording.query.filter(
        Recording.id != recording_id,
        Recording.transcript != '',
        Recording.transcript.isnot(None),
    ).all()

    if not others:
        return jsonify([])

    corpus = [target.transcript] + [r.transcript for r in others]
    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(corpus)
    similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()

    results = []
    for i, score in enumerate(similarities):
        if score > 0.0:
            rec = others[i].to_dict()
            rec['similarity'] = round(float(score), 3)
            results.append(rec)

    results.sort(key=lambda x: x['similarity'], reverse=True)
    return jsonify(results[:10])


# No @jwt_required() on audio routes so the browser can play audio directly
@recordings_bp.route('/api/recordings/<int:recording_id>/audio', methods=['GET'])
def get_audio_file(recording_id):
    recording = Recording.query.get_or_404(recording_id)
    return send_from_directory(UPLOAD_FOLDER, recording.filename)