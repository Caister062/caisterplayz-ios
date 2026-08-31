import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Flag, UserX, Trash2 } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { pb } from '../lib/pocketbase';
import { ReportModal } from './ReportModal';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Share } from '@capacitor/share';

export const PostCard = ({ post, onLikeToggle, onDelete, onBlockUser }) => {
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  const [reportOpen, setReportOpen] = useState(false);

  const author = post.expand?.user || post.author || {};
  const isAuthor = user?.id === (post.user || post.user_id);

  // Compute media URL from PocketBase record or direct link
  const mediaUrl = post.media
    ? pb.files.getUrl(post, post.media)
    : post.media_url || '';

  useEffect(() => {
    const fetchCommentsAndLikes = async () => {
      if (!post.id) return;

      try {
        // Fetch comments from PocketBase
        const commRecords = await pb.collection('comments').getList(1, 50, {
          filter: `post = "${post.id}"`,
          sort: 'created',
          expand: 'user',
        });
        setComments(commRecords.items);
        setCommentCount(commRecords.totalItems);

        // Check if user liked post
        if (user?.id) {
          const likeRecord = await pb.collection('likes').getFirstListItem(
            `post = "${post.id}" && user = "${user.id}"`
          ).catch(() => null);
          setIsLiked(!!likeRecord);
        }
      } catch (err) {
        // Safe catch if collections are empty
      }
    };

    fetchCommentsAndLikes();
  }, [post.id, user?.id]);

  const triggerHaptic = async (style = ImpactStyle.Light) => {
    try {
      await Haptics.impact({ style });
    } catch (e) {}
  };

  const handleLike = async () => {
    if (!user?.id) return;
    triggerHaptic(ImpactStyle.Medium);

    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikeCount((prev) => (nextState ? prev + 1 : Math.max(prev - 1, 0)));

    try {
      if (nextState) {
        await pb.collection('likes').create({ post: post.id, user: user.id });
        await pb.collection('posts').update(post.id, { 'like_count+': 1 });
      } else {
        const likeRecord = await pb.collection('likes').getFirstListItem(
          `post = "${post.id}" && user = "${user.id}"`
        ).catch(() => null);
        if (likeRecord) {
          await pb.collection('likes').delete(likeRecord.id);
          await pb.collection('posts').update(post.id, { 'like_count-': 1 });
        }
      }
    } catch (e) {
      console.error('Like error:', e);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user?.id) return;

    triggerHaptic();
    const content = newComment.trim();
    setNewComment('');

    try {
      const record = await pb.collection('comments').create(
        {
          post: post.id,
          user: user.id,
          content,
        },
        { expand: 'user' }
      );

      setComments((prev) => [...prev, record]);
      setCommentCount((prev) => prev + 1);
      await pb.collection('posts').update(post.id, { 'comment_count+': 1 });
    } catch (err) {
      console.error('Comment submission error:', err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    triggerHaptic();
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setCommentCount((prev) => Math.max(prev - 1, 0));

    try {
      await pb.collection('comments').delete(commentId);
      await pb.collection('posts').update(post.id, { 'comment_count-': 1 });
    } catch (e) {}
  };

  const handleShare = async () => {
    triggerHaptic();
    try {
      await Share.share({
        title: `Post by ${author.name || author.username || 'Gamer'} on CaisterPlayz`,
        text: post.content,
        url: window.location.href,
      });
    } catch (err) {
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Post by ${author.name || author.username || 'Gamer'} on CaisterPlayz`,
            text: post.content,
            url: window.location.href,
          });
        } catch (e) {}
      } else {
        navigator.clipboard.writeText(window.location.href);
        alert('Post link copied!');
      }
    }
  };

  return (
    <article className="card post-card animate-fade">
      {/* Header */}
      <div className="post-header">
        <div className="author-meta">
          <img
            src={author.avatar_url || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${author.id || 'author'}`}
            alt={author.name}
            className="avatar"
          />
          <div className="author-names">
            <div className="author-display">
              {author.name || author.username || 'Gamer'}
              {author.is_verified && <span className="verified-icon" title="Verified Creator">✓</span>}
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <span className="author-handle">@{author.username || 'player'}</span>
              {author.fortnite_username && (
                <span className="author-ign">⚡ IGN: {author.fortnite_username}</span>
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
                      if (onBlockUser) onBlockUser(author.id, author.name || author.username);
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
      {mediaUrl && (
        <div className="post-media-container">
          {post.media_type === 'video' ? (
            <video src={mediaUrl} controls playsInline preload="metadata" />
          ) : (
            <img src={mediaUrl} alt="Post content" loading="lazy" />
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
            <span>{commentCount}</span>
          </button>

          <button className="feed-action-btn" onClick={handleShare} aria-label="Share">
            <Share2 size={19} />
          </button>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {post.created ? new Date(post.created).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Recent'}
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
                No comments yet.
              </p>
            ) : (
              comments.map((comm) => {
                const commAuthor = comm.expand?.user || {};
                return (
                  <div key={comm.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'var(--bg-input)', padding: '0.5rem 0.75rem', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <img
                        src={commAuthor.avatar_url || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${comm.user}`}
                        alt=""
                        className="avatar sm"
                      />
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: '700' }}>
                          {commAuthor.name || commAuthor.username || 'Gamer'}
                        </div>
                        <div style={{ fontSize: '0.85rem' }}>{comm.content}</div>
                      </div>
                    </div>
                    {(user?.id === comm.user || isAuthor) && (
                      <button
                        onClick={() => handleDeleteComment(comm.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="post"
        targetId={post.id}
        targetName={author.name || author.username}
      />
    </article>
  );
};
