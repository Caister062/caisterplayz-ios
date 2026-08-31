import React, { useState, useRef } from 'react';
import { Sparkles, X, UploadCloud, AlertCircle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { pb } from '../lib/pocketbase';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [mediaType, setMediaType] = useState('none');
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const triggerHaptic = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {}
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg('File too large. Maximum size is 50MB.');
      return;
    }

    setErrorMsg('');
    setSelectedFile(file);
    const isVideo = file.type.startsWith('video');
    setMediaType(isVideo ? 'video' : 'image');
    setPreviewUrl(URL.createObjectURL(file));
    triggerHaptic();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setMediaType('none');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || uploading || !user?.id) return;

    setUploading(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('user', user.id);
      formData.append('content', content.trim());
      formData.append('media_type', selectedFile ? mediaType : 'none');
      formData.append('like_count', 0);
      formData.append('comment_count', 0);
      formData.append('share_count', 0);

      if (selectedFile) {
        formData.append('media', selectedFile);
      }

      const record = await pb.collection('posts').create(formData, {
        expand: 'user',
      });

      if (onPostCreated) {
        onPostCreated(record);
      }

      triggerHaptic();
      setContent('');
      handleRemoveFile();
      onClose();
    } catch (err) {
      console.error('Post creation error in PocketBase:', err);
      setErrorMsg(err.message || 'Failed to publish post to PocketBase.');
    } finally {
      setUploading(false);
    }
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

        {errorMsg && (
          <div
            style={{
              background: 'rgba(255, 59, 48, 0.15)',
              border: '1px solid var(--accent-red)',
              borderRadius: '10px',
              padding: '0.65rem 0.85rem',
              color: 'var(--accent-red)',
              fontSize: '0.85rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <textarea
            className="input"
            rows={4}
            placeholder="Share a victory clip, trickshot, clutch play, or loadout tip! ⚡"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={1000}
            required
            autoFocus
          />

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,video/mp4,video/quicktime,video/webm"
            style={{ display: 'none' }}
          />

          {previewUrl ? (
            <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', maxHeight: '240px', background: '#000' }}>
              {mediaType === 'video' ? (
                <video src={previewUrl} controls playsInline style={{ width: '100%', maxHeight: '240px' }} />
              ) : (
                <img src={previewUrl} alt="Preview" style={{ width: '100%', maxHeight: '240px', objectFit: 'cover' }} />
              )}
              <button
                type="button"
                className="icon-btn"
                style={{ position: 'absolute', top: '8px', right: '8px', width: '28px', height: '28px', background: 'rgba(0,0,0,0.8)' }}
                onClick={handleRemoveFile}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed rgba(0, 210, 255, 0.3)',
                borderRadius: '12px',
                padding: '1.25rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'var(--bg-input)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <UploadCloud size={28} color="var(--accent-cyan)" />
              <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>
                Tap to Pick Photo or Gameplay Clip
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Directly stored in PocketBase
              </span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {content.length}/1000 characters
            </span>
            <button type="submit" className="btn btn-primary" disabled={!content.trim() || uploading}>
              {uploading ? 'Uploading...' : 'Post to Feed ⚡'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
