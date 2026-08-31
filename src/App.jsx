import React, { useState, useEffect } from 'react';
import { Home, Compass, PlusSquare, Bell, User, MessageSquare, ShieldAlert, Sparkles, Shield, Lock } from 'lucide-react';
import { useAuth } from './lib/AuthContext';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { PostCard } from './components/PostCard';
import { CreatePostModal } from './components/CreatePostModal';
import { DiscoverView } from './components/DiscoverView';
import { ProfileView } from './components/ProfileView';
import { DirectMessagesView } from './components/DirectMessagesView';
import { SettingsSafetyModal } from './components/SettingsSafetyModal';
import { AuthScreen } from './components/AuthScreen';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import './index.css';

function App() {
  const { user, profile, loading } = useAuth();

  // Tab State
  const [activeTab, setActiveTab] = useState('feed'); // 'feed', 'discover', 'create', 'notifications', 'profile', 'dms'
  const [posts, setPosts] = useState([]);
  const [fetchingPosts, setFetchingPosts] = useState(true);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [eulaModalOpen, setEulaModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  // Fetch real posts from Supabase database
  const loadPosts = async () => {
    setFetchingPosts(true);
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*, author:profiles(*)')
          .order('created_at', { ascending: false });

        if (!error && data) {
          setPosts(data);
        }
      } catch (err) {
        console.error('Failed to load posts from Supabase:', err);
      }
    } else {
      // Offline fallback
      setPosts([
        {
          id: 'post_1',
          user_id: 'usr_fn_streamer',
          content: 'Hit this crazy 250m sniper trickshot in ranked! Unreal lobby wipe! 🎯💥 #CompetitiveClips #VictoryRoyale',
          media_type: 'image',
          media_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=450&fit=crop',
          like_count: 342,
          comment_count: 18,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          author: {
            id: 'usr_fn_streamer',
            display_name: 'VortexSniper',
            username: 'vortex_sniper',
            fortnite_username: 'VortexSnipes',
            avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
            is_verified: true,
          },
        },
      ]);
    }
    setFetchingPosts(false);
  };

  useEffect(() => {
    if (user) {
      loadPosts();

      // Load blocked users from Supabase
      if (isSupabaseConfigured()) {
        supabase
          .from('blocks')
          .select('blocked_id, blocked:profiles!blocked_id(*)')
          .eq('blocker_id', user.id)
          .then(({ data }) => {
            if (data) {
              setBlockedUsers(
                data.map((b) => ({
                  id: b.blocked_id,
                  name: b.blocked?.display_name || b.blocked?.username || 'User',
                }))
              );
            }
          });
      }
    }
  }, [user]);

  const triggerHaptic = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {}
  };

  // Filter posts from blocked accounts
  const visiblePosts = posts.filter(
    (p) => !blockedUsers.some((b) => b.id === p.author?.id || b.id === p.user_id)
  );

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
    setActiveTab('feed');
  };

  const handleDeletePost = async (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    if (isSupabaseConfigured()) {
      await supabase.from('posts').delete().eq('id', postId);
    }
  };

  const handleBlockUser = async (userId, userName) => {
    if (!blockedUsers.some((b) => b.id === userId)) {
      setBlockedUsers((prev) => [...prev, { id: userId, name: userName }]);
      if (isSupabaseConfigured() && user?.id) {
        await supabase.from('blocks').insert({ blocker_id: user.id, blocked_id: userId });
      }
      alert(`Blocked @${userName}. Their posts and messages have been hidden.`);
    }
  };

  const handleUnblockUser = async (userId) => {
    setBlockedUsers((prev) => prev.filter((b) => b.id !== userId));
    if (isSupabaseConfigured() && user?.id) {
      await supabase.from('blocks').delete().match({ blocker_id: user.id, blocked_id: userId });
    }
  };

  const switchTab = (tab) => {
    triggerHaptic();
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
        <div style={{ textAlign: 'center' }}>
          <Sparkles size={36} color="var(--accent-cyan)" style={{ animation: 'spin 2s linear infinite' }} />
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Loading CaisterPlayz...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthScreen
          onOpenEULA={() => setEulaModalOpen(true)}
          onOpenPrivacy={() => setPrivacyModalOpen(true)}
        />
        {renderLegalModals()}
      </>
    );
  }

  function renderLegalModals() {
    return (
      <>
        {eulaModalOpen && (
          <div className="modal-overlay" onClick={() => setEulaModalOpen(false)}>
            <div className="modal-sheet animate-fade" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Shield size={22} color="var(--accent-cyan)" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>Terms of Service & EULA</h3>
                </div>
                <button className="icon-btn" onClick={() => setEulaModalOpen(false)} style={{ width: '32px', height: '32px' }}>
                  ×
                </button>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <p><strong>1. Community Standards & UGC Policy:</strong> CaisterPlayz enforces a strict zero-tolerance policy against objectionable content or abusive users. Any harassment, hate speech, explicit sexual content, or scamming will result in immediate content removal and permanent account termination.</p>
                <p><strong>2. Moderation & Reporting:</strong> Users have the ability to report any post, comment, direct message, or user profile via the flag icon. Reported items are reviewed within 24 hours.</p>
                <p><strong>3. User Blocking:</strong> Users can block any account at any time, instantly preventing them from viewing or interacting with your profile and content.</p>
                <p><strong>4. Trademark Disclaimer:</strong> CaisterPlayz is an independent social application and is NOT affiliated with, sponsored, or endorsed by Epic Games Inc. Fortnite is a registered trademark of Epic Games.</p>
              </div>
              <button className="btn btn-primary w-full" style={{ marginTop: '1.25rem' }} onClick={() => setEulaModalOpen(false)}>
                I Understand & Agree
              </button>
            </div>
          </div>
        )}

        {privacyModalOpen && (
          <div className="modal-overlay" onClick={() => setPrivacyModalOpen(false)}>
            <div className="modal-sheet animate-fade" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Lock size={22} color="var(--accent-gold)" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>Privacy Policy</h3>
                </div>
                <button className="icon-btn" onClick={() => setPrivacyModalOpen(false)} style={{ width: '32px', height: '32px' }}>
                  ×
                </button>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <p><strong>1. Information We Collect:</strong> We collect only account credentials (email), profile details (username, display name, optional Fortnite IGN, bio), and gaming posts/clips you choose to share.</p>
                <p><strong>2. Data Usage & Storage:</strong> Data is securely stored using Supabase PostgreSQL with strict Row Level Security. We do not sell user data to third parties.</p>
                <p><strong>3. Account Deletion:</strong> In compliance with Apple App Store Guideline 5.1.1(v), users can permanently delete their account and all associated data directly within Settings at any time.</p>
              </div>
              <button className="btn btn-primary w-full" style={{ marginTop: '1.25rem' }} onClick={() => setPrivacyModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <header className="app-header">
        <div className="brand-title">
          <span>CaisterPlayz</span>
          <span className="tag">13+ GAMING</span>
        </div>

        <div className="header-actions">
          <button
            className="icon-btn"
            onClick={() => switchTab(activeTab === 'dms' ? 'feed' : 'dms')}
            aria-label="Direct Messages"
          >
            <MessageSquare size={19} color={activeTab === 'dms' ? 'var(--accent-cyan)' : 'currentColor'} />
            <span className="icon-badge">1</span>
          </button>
        </div>
      </header>

      {activeTab === 'feed' && (
        <main className="main-content animate-fade">
          <div className="disclaimer-banner">
            <ShieldAlert size={18} color="var(--accent-purple)" style={{ flexShrink: 0 }} />
            <span>Independent gaming platform. Not affiliated with or endorsed by Epic Games.</span>
          </div>

          {fetchingPosts ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Loading gaming feed...
            </div>
          ) : visiblePosts.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
              <h3>No posts yet!</h3>
              <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>Be the first to share your gameplay moment with the community.</p>
              <button
                className="btn btn-primary"
                style={{ marginTop: '1.25rem' }}
                onClick={() => setCreateModalOpen(true)}
              >
                Create First Post ⚡
              </button>
            </div>
          ) : (
            visiblePosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onDelete={handleDeletePost}
                onBlockUser={handleBlockUser}
              />
            ))
          )}
        </main>
      )}

      {activeTab === 'discover' && <DiscoverView />}

      {activeTab === 'profile' && (
        <ProfileView
          onOpenSettings={() => setSettingsModalOpen(true)}
          userPosts={posts.filter((p) => p.user_id === user.id)}
          onDeletePost={handleDeletePost}
        />
      )}

      {activeTab === 'dms' && (
        <DirectMessagesView
          onBack={() => switchTab('feed')}
          onBlockUser={handleBlockUser}
        />
      )}

      {activeTab === 'notifications' && (
        <main className="main-content animate-fade">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '0.25rem' }}>Activity</h2>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>👑</span>
              <div>
                <p style={{ fontSize: '0.85rem' }}><strong>VortexSniper</strong> liked your trickshot clip.</p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>2 hours ago</span>
              </div>
            </div>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>⚡</span>
              <div>
                <p style={{ fontSize: '0.85rem' }}><strong>MythicBuilder</strong> started following you.</p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Yesterday</span>
              </div>
            </div>
          </div>
        </main>
      )}

      <nav className="bottom-tab-bar" aria-label="Main Navigation">
        <button
          className={`tab-item ${activeTab === 'feed' ? 'active' : ''}`}
          onClick={() => switchTab('feed')}
        >
          <Home size={22} />
          <span>Feed</span>
        </button>

        <button
          className={`tab-item ${activeTab === 'discover' ? 'active' : ''}`}
          onClick={() => switchTab('discover')}
        >
          <Compass size={22} />
          <span>Discover</span>
        </button>

        <button
          className="tab-item create-btn"
          onClick={() => {
            triggerHaptic();
            setCreateModalOpen(true);
          }}
          aria-label="Create Post"
        >
          <PlusSquare size={24} />
        </button>

        <button
          className={`tab-item ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => switchTab('notifications')}
        >
          <Bell size={22} />
          <span>Alerts</span>
        </button>

        <button
          className={`tab-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => switchTab('profile')}
        >
          <User size={22} />
          <span>Profile</span>
        </button>
      </nav>

      <CreatePostModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onPostCreated={handlePostCreated}
      />

      <SettingsSafetyModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        onOpenEULA={() => setEulaModalOpen(true)}
        onOpenPrivacy={() => setPrivacyModalOpen(true)}
        blockedUsers={blockedUsers}
        onUnblock={handleUnblockUser}
      />

      {renderLegalModals()}
    </>
  );
}

export default App;
