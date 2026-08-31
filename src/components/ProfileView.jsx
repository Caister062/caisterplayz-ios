import React, { useState } from 'react';
import { Settings, Trophy, ShieldCheck, Gamepad2, Award } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { PostCard } from './PostCard';

export const ProfileView = ({ onOpenSettings, userPosts = [], onDeletePost }) => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('posts'); // 'posts', 'achievements'

  const achievements = [
    { id: 'ach_1', title: 'Victory Royale Elite', desc: 'Achieved 100+ Crown Victories', icon: '👑', unlocked: true },
    { id: 'ach_2', title: 'Mythic Trickshotter', desc: 'Shared 10+ sniper clips in CaisterPlayz', icon: '🎯', unlocked: true },
    { id: 'ach_3', title: 'Community Pioneer', desc: 'Joined CaisterPlayz Season 1', icon: '⚡', unlocked: true },
    { id: 'ach_4', title: 'Unreal Dominator', desc: 'Reached Unreal rank in competitive Battle Royale', icon: '🏆', unlocked: true },
  ];

  return (
    <div className="main-content animate-fade">
      {/* Banner & Header */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            height: '110px',
            background: `url(${profile?.banner_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=400&fit=crop'}) center/cover no-repeat`,
            position: 'relative',
          }}
        />

        <div style={{ padding: '0 1.25rem 1.25rem', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '-36px', marginBottom: '0.75rem' }}>
            <img
              src={profile?.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&h=150&fit=crop&crop=faces'}
              alt={profile?.display_name}
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
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>{profile?.display_name || 'Caister Legend'}</h2>
              {profile?.is_verified && <span className="verified-icon" title="Verified Creator">✓</span>}
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>@{profile?.username || 'caisterlegend'}</span>
            {profile?.fortnite_username && (
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: '600' }}>
                🎮 Fortnite IGN: {profile.fortnite_username} (User-Provided)
              </span>
            )}
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
            {profile?.bio || 'Competitive Fortnite gamer & creator.'}
          </p>

          {/* Stats Bar */}
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', borderTop: 'var(--border-subtle)', paddingTop: '0.75rem' }}>
            <div>
              <span style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-primary)' }}>
                {profile?.follower_count ? (profile.follower_count / 1000).toFixed(1) + 'K' : '14.2K'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.35rem' }}>Followers</span>
            </div>
            <div>
              <span style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-primary)' }}>
                {profile?.following_count || '85'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.35rem' }}>Following</span>
            </div>
            <div>
              <span style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--accent-gold)' }}>
                4
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
          Gaming Badges (4)
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
          {achievements.map((ach) => (
            <div key={ach.id} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.5rem', padding: '1rem' }}>
              <span style={{ fontSize: '2rem' }}>{ach.icon}</span>
              <span style={{ fontWeight: '800', fontSize: '0.85rem' }}>{ach.title}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{ach.desc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
