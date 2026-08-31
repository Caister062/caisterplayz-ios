import React, { useState, useEffect } from 'react';
import { Send, ArrowLeft, Flag, UserX, MessageCircle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { pb, getDatabase } from '../lib/pocketbase';
import { ReportModal } from './ReportModal';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export const DirectMessagesView = ({ onBack, onBlockUser }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const triggerHaptic = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {}
  };

  // Load real conversations
  useEffect(() => {
    const fetchConversations = async () => {
      if (!user?.id) return;
      setLoading(true);

      try {
        const db = await getDatabase();
        const allConvs = await db.getAll('conversations');
        const userConvs = (allConvs || []).filter(
          (c) => c.user1 === user.id || c.user2 === user.id
        );

        const enriched = await Promise.all(
          userConvs.map(async (c) => {
            const partnerId = c.user1 === user.id ? c.user2 : c.user1;
            const partnerUser = await db.get('users', partnerId);
            return {
              id: c.id,
              recipient: partnerUser || {
                id: partnerId,
                name: 'Gamer',
                username: 'player',
                avatar_url: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${partnerId}`,
              },
              lastMessage: c.last_message || 'Started conversation',
              timestamp: c.updated ? new Date(c.updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            };
          })
        );

        setConversations(enriched);
      } catch (err) {
        console.error('Conversations load error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user?.id]);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeChat) return;

    const fetchMessages = async () => {
      try {
        const db = await getDatabase();
        const allMsgs = await db.getAllFromIndex('messages', 'conversation_id', activeChat.id);
        setMessages(allMsgs || []);
      } catch (err) {
        console.error('Messages load error:', err);
      }
    };

    fetchMessages();
  }, [activeChat?.id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeChat || !user?.id) return;

    triggerHaptic();
    const content = messageText.trim();
    setMessageText('');

    try {
      const msgObj = {
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        conversation_id: activeChat.id,
        sender_id: user.id,
        content,
        created: new Date().toISOString(),
      };

      const db = await getDatabase();
      await db.put('messages', msgObj);

      // Update conversation last message
      const conv = await db.get('conversations', activeChat.id);
      if (conv) {
        conv.last_message = content;
        conv.updated = new Date().toISOString();
        await db.put('conversations', conv);
      }

      setMessages((prev) => [...prev, msgObj]);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
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
            {activeChat ? (activeChat.recipient.name || activeChat.recipient.username) : 'Direct Messages'}
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
                if (onBlockUser) onBlockUser(activeChat.recipient.id, activeChat.recipient.name || activeChat.recipient.username);
                setActiveChat(null);
              }}
            >
              <UserX size={16} color="var(--text-muted)" />
            </button>
          </div>
        )}
      </div>

      {!activeChat ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Loading messages...
            </div>
          ) : conversations.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
              <MessageCircle size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
              <h3>No conversations yet</h3>
              <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                Discover gamers on the Discover tab to connect and start private direct messages!
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
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
                onClick={() => {
                  triggerHaptic();
                  setActiveChat(conv);
                }}
              >
                <img src={conv.recipient.avatar_url} alt="" className="avatar" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>
                      {conv.recipient.name || conv.recipient.username}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{conv.timestamp}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {conv.lastMessage}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)' }}>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem 0' }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Start the conversation with @{activeChat.recipient.username}!
              </div>
            ) : (
              messages.map((m) => {
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
                    <p>{m.content}</p>
                    <span style={{ display: 'block', fontSize: '0.65rem', opacity: 0.7, textAlign: 'right', marginTop: '0.2rem' }}>
                      {new Date(m.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
          </div>

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

      {activeChat && (
        <ReportModal
          isOpen={reportOpen}
          onClose={() => setReportOpen(false)}
          targetType="message"
          targetId={activeChat.id}
          targetName={activeChat.recipient.name || activeChat.recipient.username}
        />
      )}
    </div>
  );
};
