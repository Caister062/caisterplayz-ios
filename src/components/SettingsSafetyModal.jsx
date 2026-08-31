import React, { useState } from 'react';
import { Shield, UserX, Lock, Trash2, ArrowLeft, ExternalLink, HelpCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export const SettingsSafetyModal = ({ isOpen, onClose, onOpenEULA, onOpenPrivacy, blockedUsers = [], onUnblock }) => {
  const { user, profile, updateProfile, deleteAccount, signOut } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('menu'); // 'menu', 'edit_profile', 'blocked', 'delete_confirm'
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [fortniteIgn, setFortniteIgn] = useState(profile?.fortnite_username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateProfile({
      display_name: displayName,
      fortnite_username: fortniteIgn,
      bio,
      avatar_url: avatarUrl,
    });
    setActiveSubTab('menu');
  };

  const handleDeleteAccountFinal = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setIsDeleting(true);
    await deleteAccount();
    setIsDeleting(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet animate-fade" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {activeSubTab !== 'menu' && (
              <button
                className="icon-btn"
                style={{ width: '32px', height: '32px' }}
                onClick={() => setActiveSubTab('menu')}
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800' }}>
              {activeSubTab === 'menu' && 'Settings & Safety'}
              {activeSubTab === 'edit_profile' && 'Edit Profile'}
              {activeSubTab === 'blocked' && 'Blocked Accounts'}
              {activeSubTab === 'delete_confirm' && 'Delete Account'}
            </h3>
          </div>
          <button className="icon-btn" onClick={onClose} style={{ width: '32px', height: '32px' }}>
            ×
          </button>
        </div>

        {/* Menu View */}
        {activeSubTab === 'menu' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              className="btn btn-secondary"
              style={{ justifyContent: 'space-between', padding: '0.9rem 1rem' }}
              onClick={() => setActiveSubTab('edit_profile')}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} color="var(--accent-cyan)" /> Edit Profile Information
              </span>
              <span>›</span>
            </button>

            <button
              className="btn btn-secondary"
              style={{ justifyContent: 'space-between', padding: '0.9rem 1rem' }}
              onClick={() => setActiveSubTab('blocked')}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserX size={18} color="var(--accent-purple)" /> Blocked Users ({blockedUsers.length})
              </span>
              <span>›</span>
            </button>

            <button
              className="btn btn-secondary"
              style={{ justifyContent: 'space-between', padding: '0.9rem 1rem' }}
              onClick={onOpenEULA}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={18} color="var(--accent-blue)" /> Terms of Service & EULA
              </span>
              <ExternalLink size={16} />
            </button>

            <button
              className="btn btn-secondary"
              style={{ justifyContent: 'space-between', padding: '0.9rem 1rem' }}
              onClick={onOpenPrivacy}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={18} color="var(--accent-gold)" /> Privacy Policy
              </span>
              <ExternalLink size={16} />
            </button>

            <div style={{ borderTop: 'var(--border-subtle)', margin: '0.5rem 0' }} />

            <button
              className="btn btn-secondary"
              style={{ justifyContent: 'center' }}
              onClick={() => {
                signOut();
                onClose();
              }}
            >
              Log Out
            </button>

            <button
              className="btn btn-danger"
              style={{ justifyContent: 'center', marginTop: '0.25rem' }}
              onClick={() => setActiveSubTab('delete_confirm')}
            >
              <Trash2 size={16} /> Permanently Delete Account
            </button>
          </div>
        )}

        {/* Edit Profile */}
        {activeSubTab === 'edit_profile' && (
          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                Display Name
              </label>
              <input
                type="text"
                className="input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                Fortnite Username / IGN (User-provided)
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. NinjaPlayer_24"
                value={fortniteIgn}
                onChange={(e) => setFortniteIgn(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                Avatar URL
              </label>
              <input
                type="url"
                className="input"
                placeholder="https://..."
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                Bio
              </label>
              <textarea
                className="input"
                rows={3}
                placeholder="Share your Fortnite playstyle and achievements..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              Save Changes
            </button>
          </form>
        )}

        {/* Blocked Users */}
        {activeSubTab === 'blocked' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Blocked users cannot see your posts, comments, or send you direct messages.
            </p>
            {blockedUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                No blocked accounts.
              </div>
            ) : (
              blockedUsers.map((b) => (
                <div
                  key={b.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    background: 'var(--bg-input)',
                    borderRadius: '12px',
                  }}
                >
                  <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{b.name || b.username || 'User'}</span>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', minHeight: '36px' }}
                    onClick={() => onUnblock(b.id)}
                  >
                    Unblock
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Delete Account (App Store Guideline 5.1.1(v)) */}
        {activeSubTab === 'delete_confirm' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'rgba(255, 59, 48, 0.1)', border: '1px solid var(--accent-red)', padding: '1rem', borderRadius: '12px' }}>
              <h4 style={{ color: 'var(--accent-red)', fontWeight: '800', marginBottom: '0.4rem' }}>
                Irreversible Action
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Deleting your account will immediately and permanently erase your profile, gaming posts, clips, comments, direct messages, and followers in accordance with Apple Privacy guidelines.
              </p>
            </div>

            <p style={{ fontSize: '0.85rem' }}>
              Please type <strong>DELETE</strong> below to confirm:
            </p>

            <input
              type="text"
              className="input"
              placeholder="Type DELETE"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
            />

            <button
              className="btn btn-danger"
              disabled={deleteConfirmText !== 'DELETE' || isDeleting}
              onClick={handleDeleteAccountFinal}
            >
              {isDeleting ? 'Deleting Everything...' : 'Permanently Delete My Account'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
