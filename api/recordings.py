import os
from datetime import datetime
from flask import Blueprint, jsonify, request, send_from_directory
from models import db, Recording

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'recordings')

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

recordings_bp = Blueprint('recordings', __name__)

TEMP_USER_ID = 'temp_user'


@recordings_bp.route('/api/recordings', methods=['POST'])
def upload_recording():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    audio = request.files['audio']
    transcript = request.form.get('transcript', '')
    duration = request.form.get('duration', 0, type=int)

    filename = f"recording_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.webm"
    audio.save(os.path.join(UPLOAD_FOLDER, filename))

    recording = Recording(
        user_id=TEMP_USER_ID,
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
def list_recordings():
    user_id = request.args.get('user_id')
    exclude_user = request.args.get('exclude_user')
    query = Recording.query
    if user_id:
        query = query.filter_by(user_id=user_id)
    if exclude_user:
        query = query.filter(Recording.user_id != exclude_user)
    recordings = query.order_by(Recording.created_at.desc()).all()
    return jsonify([r.to_dict() for r in recordings])


@recordings_bp.route('/api/recordings/<int:recording_id>', methods=['GET'])
def get_recording(recording_id):
    recording = Recording.query.get_or_404(recording_id)
    return jsonify(recording.to_dict())


@recordings_bp.route('/api/recordings/<int:recording_id>', methods=['DELETE'])
def delete_recording(recording_id):
    recording = Recording.query.get_or_404(recording_id)

    filepath = os.path.join(UPLOAD_FOLDER, recording.filename)
    if os.path.exists(filepath):
        os.remove(filepath)

    db.session.delete(recording)
    db.session.commit()
    return jsonify({'message': 'Recording deleted'}), 200


@recordings_bp.route('/api/recordings/<int:recording_id>/share', methods=['PUT'])
def share_recording(recording_id):
    recording = Recording.query.get_or_404(recording_id)
    recording.shared = True
    db.session.commit()
    return jsonify({'message': 'Recording shared', 'recording': recording.to_dict()})


@recordings_bp.route('/api/recordings/<int:recording_id>/similar', methods=['GET'])
def find_similar(recording_id):
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity

    target = Recording.query.get_or_404(recording_id)

    if not target.transcript or not target.transcript.strip():
        return jsonify([])

    # Get all other recordings that have transcripts
    others = Recording.query.filter(
        Recording.id != recording_id,
        Recording.transcript != '',
        Recording.transcript.isnot(None),
    ).all()

    if not others:
        return jsonify([])

    # Build corpus: target first, then all others
    corpus = [target.transcript] + [r.transcript for r in others]

    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(corpus)

    # Cosine similarity between target (index 0) and all others
    similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()

    # Pair scores with recordings, filter out zero similarity, sort descending
    results = []
    for i, score in enumerate(similarities):
        if score > 0.0:
            rec = others[i].to_dict()
            rec['similarity'] = round(float(score), 3)
            results.append(rec)

    results.sort(key=lambda x: x['similarity'], reverse=True)

    # Return top 10
    return jsonify(results[:10])


@recordings_bp.route('/api/recordings/<int:recording_id>/audio', methods=['GET'])
def get_audio_file(recording_id):
    recording = Recording.query.get_or_404(recording_id)
    return send_from_directory(UPLOAD_FOLDER, recording.filename)
