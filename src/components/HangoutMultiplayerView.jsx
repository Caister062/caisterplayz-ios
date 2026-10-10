import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, MessageSquare, Flame, Send, Sparkles, Trophy, 
  Zap, Heart, Smile, Swords, Gamepad2, Volume2, ShieldCheck,
  Radio, Share2, Compass, AlertCircle
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { multiplayerManager } from '../lib/multiplayer';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import confetti from 'canvas-confetti';

const ROOM_LIST = [
  {
    id: 'lounge-all',
    title: '🌐 Universal Chill & Hangout Lounge',
    topic: 'Post about anything, chat, vibe, and be nice to everyone! 💜',
    category: 'Hangout',
    icon: '☕'
  },
  {
    id: 'arena-reflex',
    title: '⚡ 1v1 Reflex Showdown Arena',
    topic: 'Real-time multiplayer reflex battle! Fastest tap wins score!',
    category: 'Multiplayer Gaming',
    icon: '⚔️'
  },
  {
    id: 'clips-and-art',
    title: '🎬 Clips, Creative, & Discussion',
    topic: 'Drop clips, showcase builds, share music & anime tips',
    category: 'Creative',
    icon: '🎨'
  },
  {
    id: 'squad-finder',
    title: '🎮 Squad Finder & Team Up',
    topic: 'Looking for a squad? Drop your gamer tag and join up!',
    category: 'LFG',
    icon: '🚀'
  }
];

export const HangoutMultiplayerView = () => {
  const { user, profile } = useAuth();
  const [selectedRoom, setSelectedRoom] = useState(ROOM_LIST[0]);
  const [roomData, setRoomData] = useState({
    players: [],
    messages: [],
    gameState: null,
    reactions: []
  });
  const [chatInput, setChatInput] = useState('');
  const [gameActive, setGameActive] = useState(false);
  const [tapScore, setTapScore] = useState(0);
  const [targetPos, setTargetPos] = useState({ x: 50, y: 50 });
  const [timeLeft, setTimeLeft] = useState(15);
  const chatScrollRef = useRef(null);

  // Join multiplayer room
  useEffect(() => {
    if (!user?.id || !selectedRoom) return;

    const currentUser = {
      id: user.id,
      name: profile?.name || user.username || 'Gamer',
      username: user.username || 'player',
      avatar_url: profile?.avatar_url || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${user.id}`,
    };

    multiplayerManager.joinRoom(selectedRoom.id, currentUser, {
      title: selectedRoom.title,
      description: selectedRoom.topic,
    });

    const unsubscribe = multiplayerManager.subscribe((state) => {
      setRoomData(state);
    });

    return () => {
      unsubscribe();
      multiplayerManager.leaveRoom();
    };
  }, [selectedRoom?.id, user?.id]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [roomData.messages]);

  const triggerHaptic = async (style = ImpactStyle.Light) => {
    try {
      await Haptics.impact({ style });
    } catch (e) {}
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    multiplayerManager.sendChatMessage(chatInput.trim());
    setChatInput('');
    triggerHaptic();
  };

  const handleSendReaction = (emoji) => {
    triggerHaptic(ImpactStyle.Medium);
    multiplayerManager.sendReaction(emoji);
    
    // Confetti effect for reactions
    confetti({
      particleCount: 15,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#00d2ff', '#9d4edd', '#ffd60a'],
      scalar: 0.8
    });
  };

  // Real-time Reflex Game Loop
  const startReflexGame = () => {
    triggerHaptic(ImpactStyle.Heavy);
    setGameActive(true);
    setTapScore(0);
    setTimeLeft(15);
    setTargetPos({ x: 20 + Math.random() * 60, y: 20 + Math.random() * 60 });

    multiplayerManager.updateGameState({
      status: 'playing',
      leaderboard: [{ id: user.id, name: user.username, score: 0 }],
      startTime: Date.now()
    });
  };

  useEffect(() => {
    let timer = null;
    if (gameActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setGameActive(false);
            triggerHaptic(ImpactStyle.Heavy);
            confetti({
              particleCount: 60,
              spread: 80,
              origin: { y: 0.5 }
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameActive, timeLeft]);

  const handleTargetTap = () => {
    if (!gameActive) return;
    triggerHaptic(ImpactStyle.Light);
    const newScore = tapScore + 1;
    setTapScore(newScore);
    setTargetPos({ x: 15 + Math.random() * 70, y: 15 + Math.random() * 70 });

    multiplayerManager.updateGameState({
      status: 'playing',
      leaderboard: [{ id: user.id, name: user.username, score: newScore }]
    });
  };

  return (
    <div className="main-content animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '5rem' }}>
      {/* Insane Neon Header */}
      <div 
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.25) 0%, rgba(0, 210, 255, 0.2) 100%)',
          border: '1px solid rgba(0, 210, 255, 0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.5rem' }}>{selectedRoom.icon}</span>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '900', letterSpacing: '-0.02em' }}>
                {selectedRoom.title}
              </h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              {selectedRoom.topic}
            </p>
          </div>
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid var(--accent-green)',
              borderRadius: '20px',
              padding: '0.25rem 0.6rem',
              fontSize: '0.75rem',
              fontWeight: '800',
              color: 'var(--accent-green)',
              flexShrink: 0
            }}
          >
            <Radio size={14} style={{ animation: 'pulse 1.5s infinite' }} />
            <span>LIVE REAL-TIME</span>
          </div>
        </div>

        {/* Real-time Kindness & Community Manifesto Banner */}
        <div 
          style={{ 
            marginTop: '0.75rem', 
            padding: '0.5rem 0.75rem', 
            background: 'rgba(255, 255, 255, 0.05)', 
            borderRadius: '10px', 
            border: '1px solid rgba(255, 214, 10, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.75rem',
            color: '#f8fafc'
          }}
        >
          <ShieldCheck size={18} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
          <span><strong>Golden Rule:</strong> Treat everyone with kindness, hype each other up, and keep the vibes friendly!</span>
        </div>
      </div>

      {/* Room Selector Pills */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {ROOM_LIST.map((room) => {
          const isActive = selectedRoom.id === room.id;
          return (
            <button
              key={room.id}
              onClick={() => {
                triggerHaptic();
                setSelectedRoom(room);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.9rem',
                borderRadius: '24px',
                fontSize: '0.8rem',
                fontWeight: '700',
                background: isActive ? 'var(--gradient-storm)' : 'var(--bg-card)',
                color: '#fff',
                border: isActive ? 'none' : 'var(--border-subtle)',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                boxShadow: isActive ? 'var(--shadow-glow)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{room.icon}</span>
              <span>{room.title.split(' ')[1] || room.title}</span>
            </button>
          );
        })}
      </div>

      {/* Online Players Presence Bar */}
      <div className="card" style={{ padding: '0.75rem 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: '800' }}>
            <Users size={16} color="var(--accent-cyan)" />
            <span>Players In Room ({roomData.players.length || 1})</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-green)', fontWeight: '700' }}>● Connected</span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.25rem 0' }}>
          {(roomData.players.length > 0 ? roomData.players : [user]).map((p, idx) => (
            <div key={p.id || idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '55px' }}>
              <div style={{ position: 'relative' }}>
                <img 
                  src={p.avatar_url || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${p.id}`} 
                  alt="" 
                  style={{ width: '38px', height: '38px', borderRadius: '50%', border: '2px solid var(--accent-cyan)' }}
                />
                <span 
                  style={{ 
                    position: 'absolute', bottom: '0', right: '0', width: '10px', height: '10px', 
                    borderRadius: '50%', background: '#10b981', border: '2px solid #000' 
                  }} 
                />
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: '700', marginTop: '0.2rem', maxWidth: '55px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.username || p.name || 'Gamer'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Real-Time Multiplayer Game Arena Section */}
      <div 
        className="card"
        style={{
          border: '1px solid rgba(157, 78, 221, 0.4)',
          background: 'linear-gradient(180deg, rgba(22, 22, 44, 0.8) 0%, rgba(13, 13, 26, 0.95) 100%)',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Swords size={20} color="var(--accent-purple)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: '800' }}>Live 1v1 Reflex Arena</h3>
          </div>
          {!gameActive ? (
            <button 
              className="btn btn-primary" 
              style={{ padding: '0.35rem 0.85rem', fontSize: '0.75rem' }}
              onClick={startReflexGame}
            >
              Start Duel ⚡
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-gold)', fontWeight: '800', fontSize: '0.85rem' }}>
              <Zap size={16} /> {timeLeft}s Left | Score: {tapScore}
            </div>
          )}
        </div>

        {gameActive ? (
          <div 
            style={{
              height: '180px',
              background: 'rgba(0, 0, 0, 0.6)',
              borderRadius: '12px',
              border: '2px dashed rgba(0, 210, 255, 0.4)',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer'
            }}
          >
            <button
              onClick={handleTargetTap}
              style={{
                position: 'absolute',
                top: `${targetPos.y}%`,
                left: `${targetPos.x}%`,
                transform: 'translate(-50%, -50%)',
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'var(--gradient-badge)',
                border: 'none',
                boxShadow: '0 0 15px #ffd60a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
                fontWeight: '900',
                fontSize: '1.2rem',
                transition: 'all 0.08s ease'
              }}
            >
              ⚡
            </button>
            <div style={{ position: 'absolute', bottom: '8px', left: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Tap the glowing orb as fast as you can!
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Challenge online lobby players to instant real-time reflex speed tests!
            </span>
            <Trophy size={20} color="var(--accent-gold)" />
          </div>
        )}
      </div>

      {/* Real-Time Live Room Chat & Reactions */}
      <div 
        className="card" 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: '340px',
          padding: '0.75rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'var(--border-subtle)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: '800' }}>
            <MessageSquare size={16} color="var(--accent-cyan)" />
            <span>Room Live Chat</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Real peer stream</span>
        </div>

        {/* Floating live reaction barrages */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 10 }}>
          {roomData.reactions.slice(-10).map((rx) => (
            <span
              key={rx.id}
              style={{
                position: 'absolute',
                bottom: '50px',
                left: `${rx.x}%`,
                fontSize: '1.75rem',
                animation: 'floatUp 2.5s ease-out forwards'
              }}
            >
              {rx.emoji}
            </span>
          ))}
        </div>

        {/* Chat message stream */}
        <div 
          ref={chatScrollRef}
          style={{ 
            flex: 1, 
            overflowY: 'auto', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.6rem',
            paddingRight: '0.25rem'
          }}
        >
          {roomData.messages.length === 0 ? (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              No messages yet in this lounge.<br />Say hi and drop some good vibes! ✌️
            </div>
          ) : (
            roomData.messages.map((m) => {
              const isMe = m.sender_id === user?.id;
              return (
                <div 
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '85%'
                  }}
                >
                  {!isMe && (
                    <img 
                      src={m.sender_avatar} 
                      alt="" 
                      style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0 }} 
                    />
                  )}
                  <div>
                    {!isMe && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontWeight: '700', display: 'block', marginBottom: '2px' }}>
                        {m.sender_name}
                      </span>
                    )}
                    <div
                      style={{
                        padding: '0.5rem 0.8rem',
                        borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                        background: isMe ? 'var(--gradient-storm)' : 'rgba(255, 255, 255, 0.08)',
                        fontSize: '0.85rem',
                        color: '#fff',
                        wordBreak: 'break-word',
                        lineHeight: '1.3'
                      }}
                    >
                      {m.text}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Reaction Bar */}
        <div style={{ display: 'flex', gap: '0.4rem', padding: '0.4rem 0', borderTop: 'var(--border-subtle)' }}>
          {['❤️', '🔥', '👏', '⚡', '🎉', '🎮', '💯'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleSendReaction(emoji)}
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.1rem',
                padding: '0.25rem 0',
                cursor: 'pointer',
                transition: 'transform 0.1s'
              }}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Chat input box */}
        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
          <input
            type="text"
            className="input"
            style={{ padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
            placeholder="Type friendly message..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0 0.9rem' }}>
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
