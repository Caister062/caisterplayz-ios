import React, { useState } from 'react';
import { Image, Video, Sparkles, X } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
  const { user, profile } = useAuth();
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('none'); // 'none', 'image', 'video'
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);

    const newPost = {
      id: `post_${Date.now()}`,
      user_id: user?.id,
      content: content.trim(),
      media_type: mediaUrl.trim() ? mediaType : 'none',
      media_url: mediaUrl.trim() || '',
      like_count: 0,
      comment_count: 0,
      share_count: 0,
      created_at: new Date().toISOString(),
      author: {
        id: user?.id,
        display_name: profile?.display_name || 'Gamer',
        username: profile?.username || 'player',
        avatar_url: profile?.avatar_url || 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=user',
        fortnite_username: profile?.fortnite_username || '',
        is_verified: profile?.is_verified || false,
      },
      comments: [],
      is_liked: false,
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('posts').insert({
        user_id: user?.id,
        content: newPost.content,
        media_type: newPost.media_type,
        media_url: newPost.media_url,
      }).select().single();

      if (!error && data) {
        newPost.id = data.id;
      }
    }

    if (onPostCreated) {
      onPostCreated(newPost);
    }

    setSubmitting(false);
    setContent('');
    setMediaUrl('');
    setMediaType('none');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet animate-fade" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800' }}>Create Gaming Post</h3>
          </div>
          <button className="icon-btn" onClick={onClose} style={{ width: '32px', height: '32px' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <textarea
            className="input"
            rows={4}
            placeholder="Share your victory royale, trickshot, clutch play, or loadout tip! ⚡"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={1000}
            required
            autoFocus
          />

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className={`btn ${mediaType === 'image' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}
              onClick={() => setMediaType(mediaType === 'image' ? 'none' : 'image')}
            >
              <Image size={16} /> Image
            </button>
            <button
              type="button"
              className={`btn ${mediaType === 'video' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}
              onClick={() => setMediaType(mediaType === 'video' ? 'none' : 'video')}
            >
              <Video size={16} /> Gaming Clip
            </button>
          </div>

          {mediaType !== 'none' && (
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                {mediaType === 'image' ? 'Image URL or Upload link' : 'Video Clip URL (MP4 / WebM / QuickTime)'}
              </label>
              <input
                type="url"
                className="input"
                placeholder="https://..."
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                required
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {content.length}/1000 characters
            </span>
            <button type="submit" className="btn btn-primary" disabled={!content.trim() || submitting}>
              {submitting ? 'Dropping...' : 'Post to Storm ⚡'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
