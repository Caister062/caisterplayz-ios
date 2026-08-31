import React, { useState, useEffect } from 'react';
import { Home, Compass, PlusSquare, Bell, User, MessageSquare, ShieldAlert, Sparkles, Shield, Lock } from 'lucide-react';
import { useAuth } from './lib/AuthContext';
import { pb } from './lib/pocketbase';
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
  const { user, loading } = useAuth();

  // Tab State
  const [activeTab, setActiveTab] = useState('feed'); // 'feed', 'discover', 'create', 'notifications', 'profile', 'dms'
  const [posts, setPosts] = useState([]);
  const [fetchingPosts, setFetchingPosts] = useState(true);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [eulaModalOpen, setEulaModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  // Fetch real posts from PocketBase
  const loadPosts = async () => {
    setFetchingPosts(true);
    try {
      const records = await pb.collection('posts').getList(1, 50, {
        sort: '-created',
        expand: 'user',
      });
      setPosts(records.items || []);
    } catch (err) {
      console.warn('PocketBase posts fetch note:', err.message);
      setPosts([]);
    } finally {
      setFetchingPosts(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadPosts();

      // Load blocked users
      pb.collection('blocks')
        .getList(1, 50, { filter: `blocker = "${user.id}"`, expand: 'blocked' })
        .then((res) => {
          setBlockedUsers(
            res.items.map((b) => ({
              id: b.blocked,
              name: b.expand?.blocked?.name || b.expand?.blocked?.username || 'User',
            }))
          );
        })
        .catch(() => {});

      // Load notifications
      pb.collection('notifications')
        .getList(1, 50, { filter: `recipient = "${user.id}"`, sort: '-created', expand: 'actor' })
        .then((res) => setNotifications(res.items))
        .catch(() => {});

      // Realtime subscription for posts
      pb.collection('posts').subscribe('*', (e) => {
        if (e.action === 'create') {
          setPosts((prev) => [e.record, ...prev]);
        } else if (e.action === 'delete') {
          setPosts((prev) => prev.filter((p) => p.id !== e.record.id));
        }
      });

      return () => {
        pb.collection('posts').unsubscribe('*').catch(() => {});
      };
    }
  }, [user?.id]);

  const triggerHaptic = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {}
  };

  // Filter posts from blocked accounts
  const visiblePosts = posts.filter(
    (p) => !blockedUsers.some((b) => b.id === (p.user || p.expand?.user?.id))
  );

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
    setActiveTab('feed');
  };

  const handleDeletePost = async (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    try {
      await pb.collection('posts').delete(postId);
    } catch (e) {}
  };

  const handleBlockUser = async (userId, userName) => {
    if (!blockedUsers.some((b) => b.id === userId) && user?.id) {
      setBlockedUsers((prev) => [...prev, { id: userId, name: userName }]);
      try {
        await pb.collection('blocks').create({ blocker: user.id, blocked: userId });
      } catch (e) {}
      alert(`Blocked @${userName}. Content hidden.`);
    }
  };

  const handleUnblockUser = async (userId) => {
    if (!user?.id) return;
    setBlockedUsers((prev) => prev.filter((b) => b.id !== userId));
    try {
      const record = await pb.collection('blocks').getFirstListItem(`blocker = "${user.id}" && blocked = "${userId}"`);
      if (record) await pb.collection('blocks').delete(record.id);
    } catch (e) {}
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
                <p><strong>2. Data Usage & Storage:</strong> Data is securely stored using PocketBase with strict security rules. We do not sell user data to third parties.</p>
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
          </button>
        </div>
      </header>

      {activeTab === 'feed' && (
        <main className="main-content animate-fade">
          <div className="disclaimer-banner">
            <ShieldAlert size={18} color="var(--accent-purple)" style={{ flexShrink: 0 }} />
            <span>Independent gaming platform. Powered by PocketBase.</span>
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
          userPosts={posts.filter((p) => (p.user || p.expand?.user?.id) === user.id)}
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
            {notifications.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                <Bell size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                <p>No new activity. Interacting with posts and players will trigger real alerts.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img
                    src={n.expand?.actor?.avatar_url || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${n.actor}`}
                    alt=""
                    className="avatar sm"
                  />
                  <div>
                    <p style={{ fontSize: '0.85rem' }}>
                      <strong>{n.expand?.actor?.name || 'A player'}</strong> {n.type === 'like' && 'liked your post.'}{n.type === 'comment' && 'commented on your post.'}{n.type === 'follow' && 'started following you.'}
                    </p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(n.created).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))
            )}
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
