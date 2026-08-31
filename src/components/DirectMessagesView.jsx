import React, { useState } from 'react';
import { Send, ArrowLeft, MoreHorizontal, Flag, UserX, Shield } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { ReportModal } from './ReportModal';

export const DirectMessagesView = ({ onBack, onBlockUser }) => {
  const { user } = useAuth();
  const [activeChat, setActiveChat] = useState(null); // Selected recipient
  const [messageText, setMessageText] = useState('');
  const [reportOpen, setReportOpen] = useState(false);

  // Initial Conversations / Direct Chats state
  const [conversations, setConversations] = useState([
    {
      id: 'conv_1',
      recipient: {
        id: 'usr_fn_streamer',
        display_name: 'VortexSniper',
        username: 'vortex_sniper',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
        is_verified: true,
        fortnite_username: 'VortexSnipes',
      },
      lastMessage: 'Let us run duos tournament this Saturday at 7 PM EST! 🎮',
      timestamp: '12m ago',
      unread: 1,
      messages: [
        { id: 'm1', sender_id: 'usr_fn_streamer', text: 'Hey bro, saw your clip with the mythic sniper!', time: '1:15 PM' },
        { id: 'm2', sender_id: user?.id, text: 'Thanks! Practiced that trickshot all day in Creative.', time: '1:18 PM' },
        { id: 'm3', sender_id: 'usr_fn_streamer', text: 'Let us run duos tournament this Saturday at 7 PM EST! 🎮', time: '1:22 PM' },
      ],
    },
    {
      id: 'conv_2',
      recipient: {
        id: 'usr_mythic_builder',
        display_name: 'MythicBuilder',
        username: 'mythic_builder',
        avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&h=150&fit=crop',
        is_verified: false,
        fortnite_username: 'MythicBuilds99',
      },
      lastMessage: 'Check out my custom 1v1 map code: 8291-3920-1928',
      timestamp: '2h ago',
      unread: 0,
      messages: [
        { id: 'm4', sender_id: 'usr_mythic_builder', text: 'Check out my custom 1v1 map code: 8291-3920-1928', time: '11:00 AM' },
      ],
    },
  ]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeChat) return;

    const newMsg = {
      id: `msg_${Date.now()}`,
      sender_id: user?.id,
      text: messageText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeChat.id
          ? {
              ...c,
              lastMessage: newMsg.text,
              timestamp: 'Just now',
              messages: [...c.messages, newMsg],
            }
          : c
      )
    );

    setActiveChat((prev) => ({
      ...prev,
      messages: [...prev.messages, newMsg],
    }));

    setMessageText('');
  };

  return (
    <div className="main-content animate-fade" style={{ paddingBottom: 'calc(var(--safe-area-bottom) + 2rem)' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 'var(--border-subtle)', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="icon-btn" onClick={activeChat ? () => setActiveChat(null) : onBack} style={{ width: '36px', height: '36px' }}>
            <ArrowLeft size={18} />
          </button>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800' }}>
            {activeChat ? activeChat.recipient.display_name : 'Direct Messages'}
          </h2>
        </div>

        {activeChat && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="icon-btn"
              style={{ width: '36px', height: '36px' }}
              title="Report User"
              onClick={() => setReportOpen(true)}
            >
              <Flag size={16} color="var(--accent-red)" />
            </button>
            <button
              className="icon-btn"
              style={{ width: '36px', height: '36px' }}
              title="Block User"
              onClick={() => {
                if (onBlockUser) onBlockUser(activeChat.recipient.id, activeChat.recipient.display_name);
                setActiveChat(null);
              }}
            >
              <UserX size={16} color="var(--text-muted)" />
            </button>
          </div>
        )}
      </div>

      {!activeChat ? (
        /* Conversation List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.9rem',
                cursor: 'pointer',
                padding: '0.85rem',
              }}
              onClick={() => setActiveChat(conv)}
            >
              <img src={conv.recipient.avatar_url} alt="" className="avatar" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>
                    {conv.recipient.display_name}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{conv.timestamp}</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {conv.lastMessage}
                </p>
              </div>
              {conv.unread > 0 && <span className="icon-badge" style={{ position: 'static' }}>{conv.unread}</span>}
            </div>
          ))}
        </div>
      ) : (
        /* Active Chat View */
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)' }}>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem 0' }}>
            {activeChat.messages.map((m) => {
              const isMe = m.sender_id === user?.id;
              return (
                <div
                  key={m.id}
                  style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '78%',
                    background: isMe ? 'var(--gradient-storm)' : 'var(--bg-card)',
                    border: isMe ? 'none' : 'var(--border-subtle)',
                    color: '#fff',
                    padding: '0.65rem 0.9rem',
                    borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    fontSize: '0.9rem',
                  }}
                >
                  <p>{m.text}</p>
                  <span style={{ display: 'block', fontSize: '0.65rem', opacity: 0.7, textAlign: 'right', marginTop: '0.2rem' }}>
                    {m.time}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
            <input
              type="text"
              className="input"
              placeholder="Send a private message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ width: '48px', height: '48px', padding: 0 }}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {/* Report Modal */}
      {activeChat && (
        <ReportModal
          isOpen={reportOpen}
          onClose={() => setReportOpen(false)}
          targetType="message"
          targetId={activeChat.id}
          targetName={activeChat.recipient.display_name}
        />
      )}
    </div>
  );
};
