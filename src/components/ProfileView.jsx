import React, { useState, useEffect } from 'react';
import { Settings, Trophy, Gamepad2 } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { pb } from '../lib/pocketbase';
import { PostCard } from './PostCard';

export const ProfileView = ({ onOpenSettings, userPosts = [], onDeletePost }) => {
  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState('posts');
  const [achievements, setAchievements] = useState([]);

  // Fetch real achievements from PocketBase
  useEffect(() => {
    if (!user?.id) return;
    pb.collection('user_achievements')
      .getFullList({ filter: `user = "${user.id}"`, expand: 'achievement' })
      .then((records) => setAchievements(records.map((r) => r.expand?.achievement || {})))
      .catch(() => setAchievements([]));
  }, [user?.id]);

  const followerCount = profile?.follower_count || 0;
  const followingCount = profile?.following_count || 0;

  return (
    <div className="main-content animate-fade">
      {/* Banner & Header */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            height: '110px',
            background: profile?.banner_url
              ? `url(${profile.banner_url}) center/cover no-repeat`
              : 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
            position: 'relative',
          }}
        />

        <div style={{ padding: '0 1.25rem 1.25rem', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '-36px', marginBottom: '0.75rem' }}>
            <img
              src={profile?.avatar_url || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${profile?.id || 'player'}`}
              alt={profile?.name}
              className="avatar lg"
            />
            <button
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', gap: '0.4rem' }}
              onClick={onOpenSettings}
            >
              <Settings size={16} /> Edit & Safety
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>{profile?.name || profile?.username || 'Gamer'}</h2>
              {profile?.is_verified && <span className="verified-icon" title="Verified Creator">✓</span>}
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>@{profile?.username || 'player'}</span>
            {profile?.fortnite_username && (
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: '600' }}>
                🎮 In-Game Name: {profile.fortnite_username} (User-Provided)
              </span>
            )}
          </div>

          {profile?.bio && (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
              {profile.bio}
            </p>
          )}

          {/* Real Stats Bar */}
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', borderTop: 'var(--border-subtle)', paddingTop: '0.75rem' }}>
            <div>
              <span style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-primary)' }}>
                {followerCount >= 1000 ? (followerCount / 1000).toFixed(1) + 'K' : followerCount}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.35rem' }}>Followers</span>
            </div>
            <div>
              <span style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-primary)' }}>
                {followingCount}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.35rem' }}>Following</span>
            </div>
            <div>
              <span style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--accent-gold)' }}>
                {achievements.length}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.35rem' }}>Badges</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: 'var(--border-subtle)', gap: '1rem' }}>
        <button
          className={`tab-item ${activeTab === 'posts' ? 'active' : ''}`}
          style={{ flex: 1, paddingBottom: '0.75rem', borderBottom: activeTab === 'posts' ? '2px solid var(--accent-cyan)' : 'none' }}
          onClick={() => setActiveTab('posts')}
        >
          My Posts & Clips ({userPosts.length})
        </button>
        <button
          className={`tab-item ${activeTab === 'achievements' ? 'active' : ''}`}
          style={{ flex: 1, paddingBottom: '0.75rem', borderBottom: activeTab === 'achievements' ? '2px solid var(--accent-cyan)' : 'none' }}
          onClick={() => setActiveTab('achievements')}
        >
          Gaming Badges ({achievements.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'posts' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {userPosts.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
              <Gamepad2 size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
              <p>No posts published yet. Share your first clip with the community!</p>
            </div>
          ) : (
            userPosts.map((p) => (
              <PostCard key={p.id} post={p} onDelete={onDeletePost} />
            ))
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {achievements.length === 0 ? (
            <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <Trophy size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
              <p>Complete community challenges to earn gaming badges!</p>
            </div>
          ) : (
            achievements.map((ach) => (
              <div key={ach.id} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.5rem', padding: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>{ach.badge_icon || '🏆'}</span>
                <span style={{ fontWeight: '800', fontSize: '0.85rem' }}>{ach.title}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{ach.description}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
