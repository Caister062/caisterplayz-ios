import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Flag, UserX, Trash2 } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ReportModal } from './ReportModal';

export const PostCard = ({ post, onLikeToggle, onDelete, onBlockUser }) => {
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [reportOpen, setReportOpen] = useState(false);

  const isAuthor = user?.id === post.user_id;

  const handleLike = async () => {
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikeCount((prev) => (nextState ? prev + 1 : Math.max(prev - 1, 0)));

    if (onLikeToggle) onLikeToggle(post.id, nextState);

    if (isSupabaseConfigured()) {
      if (nextState) {
        await supabase.from('likes').insert({ user_id: user?.id, post_id: post.id });
      } else {
        await supabase.from('likes').delete().match({ user_id: user?.id, post_id: post.id });
      }
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const commentObj = {
      id: `comm_${Date.now()}`,
      post_id: post.id,
      user_id: user?.id,
      author: {
        id: user?.id,
        display_name: user?.user_metadata?.display_name || 'You',
        username: user?.user_metadata?.username || 'player',
        avatar_url: user?.user_metadata?.avatar_url || 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=user',
        is_verified: user?.user_metadata?.is_verified || false,
      },
      content: newComment.trim(),
      created_at: new Date().toISOString(),
    };

    setComments((prev) => [...prev, commentObj]);
    setNewComment('');

    if (isSupabaseConfigured()) {
      await supabase.from('comments').insert({
        post_id: post.id,
        user_id: user?.id,
        content: commentObj.content,
      });
    }
  };

  const handleDeleteComment = async (commentId) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    if (isSupabaseConfigured()) {
      await supabase.from('comments').delete().eq('id', commentId);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.author?.display_name} on CaisterPlayz`,
          text: post.content,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share dismissed');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Post link copied to clipboard!');
    }
  };

  return (
    <article className="card post-card animate-fade">
      {/* Header */}
      <div className="post-header">
        <div className="author-meta">
          <img
            src={post.author?.avatar_url || 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=author'}
            alt={post.author?.display_name}
            className="avatar"
          />
          <div className="author-names">
            <div className="author-display">
              {post.author?.display_name || 'Gamer'}
              {post.author?.is_verified && <span className="verified-icon" title="Verified Creator">✓</span>}
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <span className="author-handle">@{post.author?.username || 'player'}</span>
              {post.author?.fortnite_username && (
                <span className="author-ign">⚡ IGN: {post.author.fortnite_username}</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <button
            className="icon-btn"
            style={{ width: '32px', height: '32px' }}
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreHorizontal size={18} />
          </button>

          {showMenu && (
            <div
              style={{
                position: 'absolute',
                top: '38px',
                right: 0,
                background: 'var(--bg-secondary)',
                border: 'var(--border-subtle)',
                borderRadius: '12px',
                padding: '0.4rem',
                minWidth: '170px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.8)',
                zIndex: 30,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
              }}
            >
              {isAuthor ? (
                <button
                  className="tab-item"
                  style={{ color: 'var(--accent-red)', width: '100%', justifyContent: 'flex-start', padding: '0.5rem', gap: '0.5rem' }}
                  onClick={() => {
                    setShowMenu(false);
                    if (onDelete) onDelete(post.id);
                  }}
                >
                  <Trash2 size={16} /> Delete Post
                </button>
              ) : (
                <>
                  <button
                    className="tab-item"
                    style={{ width: '100%', justifyContent: 'flex-start', padding: '0.5rem', gap: '0.5rem' }}
                    onClick={() => {
                      setShowMenu(false);
                      setReportOpen(true);
                    }}
                  >
                    <Flag size={16} color="var(--accent-red)" /> Report Post
                  </button>
                  <button
                    className="tab-item"
                    style={{ width: '100%', justifyContent: 'flex-start', padding: '0.5rem', gap: '0.5rem' }}
                    onClick={() => {
                      setShowMenu(false);
                      if (onBlockUser) onBlockUser(post.author?.id, post.author?.display_name);
                    }}
                  >
                    <UserX size={16} color="var(--text-muted)" /> Block User
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="post-content-text">{post.content}</div>

      {/* Media (Images & Clips) */}
      {post.media_url && (
        <div className="post-media-container">
          {post.media_type === 'video' ? (
            <video src={post.media_url} controls playsInline preload="metadata" />
          ) : (
            <img src={post.media_url} alt="Post content" loading="lazy" />
          )}
        </div>
      )}

      {/* Actions */}
      <div className="post-footer">
        <div className="action-row">
          <button
            className={`feed-action-btn ${isLiked ? 'liked' : ''}`}
            onClick={handleLike}
            aria-label="Like post"
          >
            <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
            <span>{likeCount}</span>
          </button>

          <button
            className="feed-action-btn"
            onClick={() => setShowComments(!showComments)}
            aria-label="Comments"
          >
            <MessageCircle size={20} />
            <span>{comments.length}</span>
          </button>

          <button className="feed-action-btn" onClick={handleShare} aria-label="Share">
            <Share2 size={19} />
          </button>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {post.created_at ? new Date(post.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Recent'}
        </span>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '0.5rem', borderTop: 'var(--border-subtle)' }}>
          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="input"
              style={{ minHeight: '38px', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', minHeight: '38px' }}>
              Send
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {comments.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem' }}>
                No comments yet. Drop the first thought!
              </p>
            ) : (
              comments.map((comm) => (
                <div key={comm.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'var(--bg-input)', padding: '0.5rem 0.75rem', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <img
                      src={comm.author?.avatar_url || 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=user'}
                      alt=""
                      className="avatar sm"
                    />
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: '700' }}>
                        {comm.author?.display_name || 'Gamer'}
                      </div>
                      <div style={{ fontSize: '0.85rem' }}>{comm.content}</div>
                    </div>
                  </div>
                  {(user?.id === comm.user_id || isAuthor) && (
                    <button
                      onClick={() => handleDeleteComment(comm.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="post"
        targetId={post.id}
        targetName={post.author?.display_name}
      />
    </article>
  );
};
