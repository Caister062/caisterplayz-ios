import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, Trophy, Gamepad2, Camera, Image, Sparkles, 
  CheckCircle, Shield, Heart, MessageSquare, Flame, 
  Share2, Award, Zap, Edit3, X, Check
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { pb, getDatabase } from '../lib/pocketbase';
import { uploadMediaToPocketBase } from '../lib/storage';
import { formatCount } from '../lib/formatters';
import { PostCard } from './PostCard';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import confetti from 'canvas-confetti';

const BADGE_DEFINITIONS = [
  { id: 'first_post', icon: '⚡', title: 'First Drop', description: 'Published your first post or clip' },
  { id: 'friendly_gamer', icon: '🤝', title: 'Kind Vibe', description: 'Joined the Hangout Lounge' },
  { id: 'room_chatter', icon: '💬', title: 'Vibe Master', description: 'Active chatter in live rooms' },
  { id: 'active_creator', icon: '🔥', title: 'Content Machine', description: 'Created 3 or more gaming posts' },
  { id: 'verified_gamer', icon: '🛡️', title: 'Verified OG', description: 'Profile verified & safety aligned' },
  { id: 'community_star', icon: '⭐', title: 'Community Star', description: 'Connected with other players' },
];

export const ProfileView = ({ onOpenSettings, userPosts = [], onDeletePost }) => {
  const { profile, user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('posts');
  const [stats, setStats] = useState({
    followers: 0,
    following: 0,
    likesReceived: 0,
  });
  const [isQuickEditing, setIsQuickEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editIGN, setEditIGN] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const triggerHaptic = async (style = ImpactStyle.Light) => {
    try {
      await Haptics.impact({ style });
    } catch (e) {}
  };

  // Sync edit form fields when profile updates
  useEffect(() => {
    if (profile || user) {
      setEditName(profile?.name || user?.username || '');
      setEditBio(profile?.bio || '');
      setEditIGN(profile?.fortnite_username || '');
    }
  }, [profile, user]);

  // Load real followers, following count, and likes received from database
  useEffect(() => {
    const loadProfileStats = async () => {
      if (!user?.id) return;
      try {
        const db = await getDatabase();
        
        // Count followers
        const follows = await db.getAll('follows');
        const myFollowers = (follows || []).filter((f) => f.following === user.id).length;
        const myFollowing = (follows || []).filter((f) => f.follower === user.id).length;

        // Count total likes across user's posts
        let totalLikes = 0;
        const allLikes = await db.getAll('likes');
        const userPostIds = new Set(userPosts.map((p) => p.id));
        (allLikes || []).forEach((l) => {
          if (userPostIds.has(l.post)) totalLikes++;
        });

        setStats({
          followers: myFollowers || profile?.follower_count || 0,
          following: myFollowing || profile?.following_count || 0,
          likesReceived: totalLikes,
        });
      } catch (e) {
        console.warn('Error calculating profile stats:', e);
      }
    };

    loadProfileStats();
  }, [user?.id, userPosts.length, profile?.follower_count, profile?.following_count]);

  // Handle direct Avatar file upload
  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setUploadingAvatar(true);
    triggerHaptic();

    try {
      const res = await uploadMediaToPocketBase(file, 'users', user.id);
      if (res.url) {
        await updateProfile({ avatar_url: res.url });
        confetti({ particleCount: 20, spread: 50, origin: { y: 0.4 } });
      }
    } catch (err) {
      console.error('Avatar upload failed:', err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Handle direct Banner file upload
  const handleBannerFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setUploadingBanner(true);
    triggerHaptic();

    try {
      const res = await uploadMediaToPocketBase(file, 'users', user.id);
      if (res.url) {
        await updateProfile({ banner_url: res.url });
        confetti({ particleCount: 20, spread: 50, origin: { y: 0.2 } });
      }
    } catch (err) {
      console.error('Banner upload failed:', err);
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSaveQuickEdit = async (e) => {
    e.preventDefault();
    triggerHaptic(ImpactStyle.Medium);
    await updateProfile({
      name: editName.trim(),
      bio: editBio.trim(),
      fortnite_username: editIGN.trim(),
    });
    setIsQuickEditing(false);
  };

  // Compute earned badges dynamically from actual real activity
  const earnedBadges = BADGE_DEFINITIONS.filter((badge) => {
    if (badge.id === 'first_post') return userPosts.length > 0;
    if (badge.id === 'active_creator') return userPosts.length >= 3;
    if (badge.id === 'friendly_gamer' || badge.id === 'room_chatter') return true; // Earned by default for joining the community
    if (badge.id === 'verified_gamer') return profile?.is_verified;
    if (badge.id === 'community_star') return stats.followers > 0 || stats.following > 0;
    return false;
  });

  const avatarUrl = profile?.avatar_url || user?.avatar_url || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${user?.id || 'player'}`;
  const bannerUrl = profile?.banner_url || user?.banner_url;

  return (
    <div className="main-content animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '5rem' }}>
      {/* Banner & Header Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(0, 210, 255, 0.2)' }}>
        {/* Banner with direct upload trigger */}
        <div
          style={{
            height: '130px',
            background: bannerUrl
              ? `url(${bannerUrl}) center/cover no-repeat`
              : 'linear-gradient(135deg, #180d3d 0%, #0d1e3d 50%, #090912 100%)',
            position: 'relative',
          }}
        >
          <input
            type="file"
            ref={bannerInputRef}
            onChange={handleBannerFile}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <button
            onClick={() => bannerInputRef.current?.click()}
            aria-label="Change banner image"
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '20px',
              padding: '0.35rem 0.75rem',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
            }}
          >
            <Camera size={13} />
            <span>{uploadingBanner ? 'Saving...' : 'Edit Cover'}</span>
          </button>
        </div>

        {/* Profile Info Content */}
        <div style={{ padding: '0 1.25rem 1.25rem', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '-44px', marginBottom: '0.75rem' }}>
            {/* Avatar with click-to-upload badge */}
            <div style={{ position: 'relative' }}>
              <input
                type="file"
                ref={avatarInputRef}
                onChange={handleAvatarFile}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <img
                src={avatarUrl}
                alt={profile?.name || 'Avatar'}
                className="avatar lg"
                style={{
                  width: '82px',
                  height: '82px',
                  borderRadius: '50%',
                  border: '3px solid var(--bg-main)',
                  boxShadow: '0 0 15px rgba(0, 210, 255, 0.4)',
                  cursor: 'pointer',
                  objectFit: 'cover',
                  background: '#151528',
                }}
                onClick={() => avatarInputRef.current?.click()}
                title="Tap to change avatar"
              />
              <button
                onClick={() => avatarInputRef.current?.click()}
                aria-label="Change avatar photo"
                style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '2px',
                  background: 'var(--accent-cyan)',
                  border: '2px solid var(--bg-main)',
                  borderRadius: '50%',
                  width: '26px',
                  height: '26px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000',
                  cursor: 'pointer',
                }}
              >
                <Camera size={13} />
              </button>
            </div>

            {/* Quick Edit & Settings Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', gap: '0.4rem' }}
                onClick={() => {
                  triggerHaptic();
                  setIsQuickEditing(!isQuickEditing);
                }}
              >
                <Edit3 size={15} />
                <span>{isQuickEditing ? 'Cancel' : 'Edit Bio'}</span>
              </button>
              <button
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', gap: '0.4rem' }}
                onClick={() => {
                  triggerHaptic();
                  onOpenSettings();
                }}
              >
                <Settings size={15} />
                <span>Settings</span>
              </button>
            </div>
          </div>

          {/* Inline Quick Edit Form */}
          {isQuickEditing ? (
            <form onSubmit={handleSaveQuickEdit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Display Name
                </label>
                <input
                  type="text"
                  className="input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your display name"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  In-Game Tag / IGN (e.g. Fortnite, Valorant)
                </label>
                <input
                  type="text"
                  className="input"
                  value={editIGN}
                  onChange={(e) => setEditIGN(e.target.value)}
                  placeholder="e.g. CaisterLegend_99"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Bio / Playstyle
                </label>
                <textarea
                  className="input"
                  rows={2}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell the community what you play and love..."
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                  onClick={() => setIsQuickEditing(false)}
                >
                  <X size={15} /> Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
                >
                  <Check size={15} /> Save Changes
                </button>
              </div>
            </form>
          ) : (
            /* Profile Details Display */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '900', letterSpacing: '-0.02em' }}>
                  {profile?.name || user?.username || 'Gamer'}
                </h2>
                {profile?.is_verified && (
                  <span className="verified-icon" title="Verified Player" style={{ background: 'var(--accent-cyan)', color: '#000', borderRadius: '50%', width: '18px', height: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '900' }}>
                    ✓
                  </span>
                )}
              </div>

              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                @{user?.username || profile?.username || 'player'}
              </span>

              {profile?.fortnite_username && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                  <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', background: 'rgba(0, 210, 255, 0.12)', border: '1px solid rgba(0, 210, 255, 0.3)', borderRadius: '12px', color: 'var(--accent-cyan)', fontWeight: '700' }}>
                    🎮 IGN: {profile.fortnite_username}
                  </span>
                </div>
              )}

              {profile?.bio ? (
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: '1.4' }}>
                  {profile.bio}
                </p>
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem', fontStyle: 'italic' }}>
                  No bio yet. Tap 'Edit Bio' to tell players what you play!
                </p>
              )}
            </div>
          )}

          {/* Real Stats Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.5rem',
              marginTop: '1rem',
              borderTop: 'var(--border-subtle)',
              paddingTop: '0.85rem',
              textAlign: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: '900', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                {formatCount(userPosts.length)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Posts
              </div>
            </div>

            <div>
              <div style={{ fontWeight: '900', fontSize: '1.05rem', color: 'var(--accent-cyan)' }}>
                {formatCount(stats.followers)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Followers
              </div>
            </div>

            <div>
              <div style={{ fontWeight: '900', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                {formatCount(stats.following)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Following
              </div>
            </div>

            <div>
              <div style={{ fontWeight: '900', fontSize: '1.05rem', color: 'var(--accent-gold)' }}>
                {formatCount(earnedBadges.length)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Badges
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Navigation Tabs */}
      <div style={{ display: 'flex', borderBottom: 'var(--border-subtle)', gap: '0.5rem' }}>
        <button
          className={`tab-item ${activeTab === 'posts' ? 'active' : ''}`}
          style={{
            flex: 1,
            paddingBottom: '0.75rem',
            borderBottom: activeTab === 'posts' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
            fontWeight: '800',
            fontSize: '0.85rem',
          }}
          onClick={() => {
            triggerHaptic();
            setActiveTab('posts');
          }}
        >
          My Posts ({userPosts.length})
        </button>

        <button
          className={`tab-item ${activeTab === 'badges' ? 'active' : ''}`}
          style={{
            flex: 1,
            paddingBottom: '0.75rem',
            borderBottom: activeTab === 'badges' ? '2px solid var(--accent-gold)' : '2px solid transparent',
            fontWeight: '800',
            fontSize: '0.85rem',
          }}
          onClick={() => {
            triggerHaptic();
            setActiveTab('badges');
          }}
        >
          Badges & Honors ({earnedBadges.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'posts' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {userPosts.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
              <Gamepad2 size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.5, color: 'var(--accent-cyan)' }} />
              <h3 style={{ fontSize: '1rem', color: '#fff', fontWeight: '800', marginBottom: '0.25rem' }}>No Posts Yet</h3>
              <p style={{ fontSize: '0.85rem' }}>Share your first clip, build, or thoughts with the community!</p>
            </div>
          ) : (
            userPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onDelete={onDeletePost}
              />
            ))
          )}
        </div>
      ) : (
        /* Badges & Achievements Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
          {BADGE_DEFINITIONS.map((badge) => {
            const isUnlocked = earnedBadges.some((b) => b.id === badge.id);
            return (
              <div
                key={badge.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '0.4rem',
                  padding: '1.1rem 0.75rem',
                  border: isUnlocked ? '1px solid rgba(255, 214, 10, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
                  background: isUnlocked
                    ? 'linear-gradient(145deg, rgba(30, 26, 12, 0.6) 0%, rgba(18, 18, 32, 0.9) 100%)'
                    : 'rgba(15, 15, 25, 0.6)',
                  opacity: isUnlocked ? 1 : 0.5,
                  transition: 'all 0.2s ease',
                }}
              >
                <span
                  style={{
                    fontSize: '2.2rem',
                    filter: isUnlocked ? 'drop-shadow(0 0 10px rgba(255, 214, 10, 0.5))' : 'grayscale(1)',
                  }}
                >
                  {badge.icon}
                </span>
                <span style={{ fontWeight: '800', fontSize: '0.85rem', color: isUnlocked ? '#fff' : 'var(--text-secondary)' }}>
                  {badge.title}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                  {badge.description}
                </span>
                <span
                  style={{
                    marginTop: '0.25rem',
                    fontSize: '0.68rem',
                    fontWeight: '800',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '12px',
                    background: isUnlocked ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                    color: isUnlocked ? 'var(--accent-green)' : 'var(--text-muted)',
                  }}
                >
                  {isUnlocked ? 'UNLOCKED' : 'LOCKED'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
