import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Flag, UserX, Trash2 } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { pb, getDatabase } from '../lib/pocketbase';
import { ReportModal } from './ReportModal';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import confetti from 'canvas-confetti';

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
  const [animateHeart, setAnimateHeart] = useState(false);

  const author = post.expand?.user || post.author || {};
  const isAuthor = user?.id === (post.user || post.user_id);

  const mediaUrl = post.media && pb
    ? pb.files.getUrl(post, post.media)
    : post.media_url || '';

  useEffect(() => {
    const fetchCommentsAndLikes = async () => {
      if (!post.id) return;

      try {
        const db = await getDatabase();

        // 1. Fetch comments
        const allComments = await db.getAllFromIndex('comments', 'post', post.id);
        if (allComments && allComments.length > 0) {
          setComments(allComments);
          setCommentCount(allComments.length);
        }

        // 2. Check likes
        if (user?.id) {
          const likeRecord = await db.getFromIndex('likes', 'post_user', [post.id, user.id]);
          setIsLiked(!!likeRecord);
        }
      } catch (err) {
        console.error('Error fetching comments/likes:', err);
      }
    };

    fetchCommentsAndLikes();
  }, [post.id, user?.id]);

  const triggerHaptic = async (style = ImpactStyle.Light) => {
    try {
      await Haptics.impact({ style });
    } catch (e) {}
  };

  const handleLike = async (e) => {
    if (!user?.id) return;
    triggerHaptic(ImpactStyle.Medium);

    const nextState = !isLiked;
    setIsLiked(nextState);
    const newCount = nextState ? likeCount + 1 : Math.max(likeCount - 1, 0);
    setLikeCount(newCount);

    if (nextState) {
      setAnimateHeart(true);
      setTimeout(() => setAnimateHeart(false), 500);

      // Micro particle burst on like
      if (e?.clientX && e?.clientY) {
        confetti({
          particleCount: 20,
          spread: 45,
          origin: {
            x: e.clientX / window.innerWidth,
            y: e.clientY / window.innerHeight,
          },
          colors: ['#00d2ff', '#9d4edd', '#ff3b30', '#ffd60a'],
          ticks: 120,
          gravity: 1.2,
          scalar: 0.7,
        });
      }
    }

    try {
      const db = await getDatabase();
      if (nextState) {
        await db.put('likes', { id: `like_${post.id}_${user.id}`, post: post.id, user: user.id });

        // Record real notification for the post author if it's someone else
        const postAuthorId = post.user || author.id;
        if (postAuthorId && postAuthorId !== user.id) {
          await db.put('notifications', {
            id: `notif_like_${Date.now()}_${user.id}`,
            recipient: postAuthorId,
            type: 'like',
            actor_id: user.id,
            actor_name: user.name || user.username || 'A player',
            actor_avatar: user.avatar_url || '',
            created: new Date().toISOString(),
          });
        }
      } else {
        await db.delete('likes', `like_${post.id}_${user.id}`);
      }

      // Update post in db
      const storedPost = await db.get('posts', post.id);
      if (storedPost) {
        storedPost.like_count = newCount;
        await db.put('posts', storedPost);
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
      const commObj = {
        id: 'comm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        post: post.id,
        user: user.id,
        content,
        created: new Date().toISOString(),
        author: {
          name: user.name || user.username || 'Gamer',
          username: user.username || 'player',
          avatar_url: user.avatar_url || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${user.username}`,
        },
      };

      const db = await getDatabase();
      await db.put('comments', commObj);

      // Record real notification for the post author
      const postAuthorId = post.user || author.id;
      if (postAuthorId && postAuthorId !== user.id) {
        await db.put('notifications', {
          id: `notif_comm_${Date.now()}_${user.id}`,
          recipient: postAuthorId,
          type: 'comment',
          actor_id: user.id,
          actor_name: user.name || user.username || 'A player',
          actor_avatar: user.avatar_url || '',
          created: new Date().toISOString(),
        });
      }

      setComments((prev) => [...prev, commObj]);
      const newCommentCount = commentCount + 1;
      setCommentCount(newCommentCount);

      const storedPost = await db.get('posts', post.id);
      if (storedPost) {
        storedPost.comment_count = newCommentCount;
        await db.put('posts', storedPost);
      }
    } catch (err) {
      console.error('Comment submission error:', err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    triggerHaptic();
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setCommentCount((prev) => Math.max(prev - 1, 0));

    try {
      const db = await getDatabase();
      await db.delete('comments', commentId);
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
                      if (onBlockUser) onBlockUser(author.id || post.user, author.name || author.username);
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
        <div className="post-media-container" onDoubleClick={handleLike}>
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
            className={`feed-action-btn ${isLiked ? 'liked' : ''} ${animateHeart ? 'animate-heart-pop' : ''}`}
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
                const commAuthor = comm.author || comm.expand?.user || {};
                return (
                  <div key={comm.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'var(--bg-input)', padding: '0.5rem 0.75rem', borderRadius: '10px' }} className="animate-fade">
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
