import React, { useState, useEffect, useCallback } from 'react';
import NavBar from '../../components/NavBar/NavBar';
import RecordingCard from '../../components/RecordingCard/RecordingCard';
import '../../components/RecordingCard/RecordingCard.css';
import '../../pages/Record/Record.css';

import API from '../../config';

function CommunityPage({
  onNavigate,
  onStartReplyRecording,
  initialSelectedRecordingId,
  onInitialSelectionConsumed,
}) {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  const fetchRecordings = async () => {
    try {
      const res = await fetch(`${API}/api/recordings`);
      const data = await res.json();
      const shared = data.filter((r) => r.shared);
      const enriched = await Promise.all(shared.map(async (r) => {
        try {
          const details = await fetch(`${API}/api/recordings/${r.id}`).then((d) => d.json());
          return {
            ...r,
            likes_count: details.likes_count || 0,
            replies_count: details.replies_count || 0,
            liked_by_me: details.liked_by_me || false,
          };
        } catch (err) {
          return r;
        }
      }));
      setRecordings(enriched);
    } catch (err) {
      console.error('Failed to fetch recordings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async (recordingId) => {
    try {
      const res = await fetch(`${API}/api/recordings/${recordingId}/replies`);
      const data = await res.json();
      setReplies(data);
    } catch (err) {
      console.error('Failed to fetch replies:', err);
    }
  };

  useEffect(() => {
    fetchRecordings();
  }, []);

  const handleToggleLike = async (recordingId) => {
    try {
      const res = await fetch(`${API}/api/recordings/${recordingId}/like`, { method: 'POST' });
      const data = await res.json();
      setRecordings((prev) => prev.map((rec) => (
        rec.id === recordingId
          ? { ...rec, likes_count: data.likes_count, liked_by_me: data.liked }
          : rec
      )));
    } catch (err) {
      console.error('Failed to like recording:', err);
    }
  };

  const handleOpenReplies = useCallback(async (recordingId) => {
    let rec = recordings.find((r) => r.id === recordingId);

    if (!rec) {
      try {
        rec = await fetch(`${API}/api/recordings/${recordingId}`).then((d) => d.json());
      } catch (err) {
        console.error('Failed to fetch recording details:', err);
      }
    }

    setSelectedRecording(rec || null);
    await fetchReplies(recordingId);
  }, [recordings]);

  useEffect(() => {
    if (!initialSelectedRecordingId) return;

    handleOpenReplies(initialSelectedRecordingId);
    if (onInitialSelectionConsumed) {
      onInitialSelectionConsumed();
    }
  }, [handleOpenReplies, initialSelectedRecordingId, onInitialSelectionConsumed]);

  const handleBackToCommunity = () => {
    setSelectedRecording(null);
    setReplies([]);
    setReplyText('');
  };

  const submitTextReply = async () => {
    if (!replyText.trim() || !selectedRecording) return;
    setReplyLoading(true);
    try {
      const formData = new FormData();
      formData.append('text', replyText.trim());
      await fetch(`${API}/api/recordings/${selectedRecording.id}/replies`, {
        method: 'POST',
        body: formData,
      });
      setReplyText('');
      await fetchReplies(selectedRecording.id);
      setRecordings((prev) => prev.map((r) => (r.id === selectedRecording.id
        ? { ...r, replies_count: (r.replies_count || 0) + 1 }
        : r)));
    } catch (err) {
      console.error('Failed to submit text reply:', err);
    } finally {
      setReplyLoading(false);
    }
  };

  if (selectedRecording) {
    return (
      <div className="screen">
        <div className="screen-content community-content replies-screen">
          <button className="back-link" onClick={handleBackToCommunity}>← Back to community</button>
          <h1 className="page-title">Replies</h1>
          <p className="page-subtitle">Reply with text or a recording</p>

          <div className="reply-form">
            <textarea
              placeholder="Write a text reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn" onClick={submitTextReply} disabled={replyLoading}>
                Post text reply
              </button>
              <button
                className="btn"
                onClick={() => onStartReplyRecording && onStartReplyRecording(selectedRecording.id)}
              >
                Record audio reply
              </button>
            </div>
          </div>

          <div className="reply-list">
            {replies.length === 0 && <p className="page-subtitle">No replies yet.</p>}
            {replies.map((reply) => (
              <div className="reply-item" key={reply.id}>
                <div className="reply-meta">
                  {new Date(reply.created_at).toLocaleString('en-US')}
                </div>
                {reply.text ? <div>{reply.text}</div> : null}
                {reply.type === 'recording' && (
                  <audio controls src={`${API}/api/replies/${reply.id}/audio`} style={{ width: '100%', marginTop: 8 }} />
                )}
              </div>
            ))}
          </div>
        </div>
        <NavBar active="community" onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="screen-content community-content">
        <h1 className="page-title">Community Recordings</h1>
        <p className="page-subtitle">Listen to what others have shared</p>

        {loading && <p className="page-subtitle">Loading...</p>}

        {!loading && recordings.length === 0 && (
          <div className="empty-state">
            <p className="empty-state-text">No recordings shared yet.</p>
            <p className="empty-state-hint">
              Record something and share it with the community!
            </p>
          </div>
        )}

        {!loading && recordings.length > 0 && (
          <div className="recordings-list">
            {recordings.map((rec) => (
              <RecordingCard
                key={rec.id}
                recording={rec}
                actions={{
                  liked: !!rec.liked_by_me,
                  likesCount: rec.likes_count,
                  repliesCount: rec.replies_count,
                  onToggleLike: handleToggleLike,
                  onOpenReplies: handleOpenReplies,
                }}
              />
            ))}
          </div>
        )}
      </div>
      <NavBar active="community" onNavigate={onNavigate} />
    </div>
  );
}

export default CommunityPage;
