import React, { useState } from 'react';
import { Search, UserPlus, UserCheck, Flame, Trophy, ShieldCheck } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export const DiscoverView = ({ onSelectPlayer }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [followingMap, setFollowingMap] = useState({
    usr_fn_streamer: true,
    usr_mythic_builder: false,
    usr_pro_scrim: false,
  });

  const featuredPlayers = [
    {
      id: 'usr_fn_streamer',
      display_name: 'VortexSniper',
      username: 'vortex_sniper',
      fortnite_username: 'VortexSnipes',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
      bio: 'Fortnite FNCS Semi-Finalist. Daily sniper trickshots & battle royale analysis.',
      follower_count: 28400,
      is_verified: true,
      rank: 'Unreal #142',
    },
    {
      id: 'usr_mythic_builder',
      display_name: 'MythicBuilder',
      username: 'mythic_builder',
      fortnite_username: 'MythicBuilds99',
      avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&h=150&fit=crop',
      bio: 'Creative 2.0 / UEFN map creator. Building the next generation of custom game modes.',
      follower_count: 9800,
      is_verified: false,
      rank: 'Elite',
    },
    {
      id: 'usr_pro_scrim',
      display_name: 'StormChaser_GG',
      username: 'stormchaser',
      fortnite_username: 'StormChaserGG',
      avatar_url: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&h=150&fit=crop',
      bio: 'Endgame rotational guides & loadout reviews for ranked tournaments.',
      follower_count: 15300,
      is_verified: true,
      rank: 'Champion',
    },
  ];

  const handleFollowToggle = (playerId) => {
    setFollowingMap((prev) => ({
      ...prev,
      [playerId]: !prev[playerId],
    }));
  };

  const filteredPlayers = featuredPlayers.filter(
    (p) =>
      p.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.fortnite_username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="main-content animate-fade">
      {/* Search Bar */}
      <div style={{ position: 'relative' }}>
        <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '14px' }} />
        <input
          type="text"
          className="input"
          style={{ paddingLeft: '2.5rem' }}
          placeholder="Search by IGN, gamer tag, or handle..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Trending Topics & Communities */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {['#FortniteRanked', '#TrickshotClips', '#UEFNMaps', '#VictoryRoyale', '#FNCS'].map((tag) => (
          <span
            key={tag}
            style={{
              fontSize: '0.8rem',
              fontWeight: '700',
              padding: '0.4rem 0.8rem',
              background: 'var(--bg-card)',
              border: 'var(--border-subtle)',
              borderRadius: '20px',
              whiteSpace: 'nowrap',
              color: 'var(--accent-cyan)',
              cursor: 'pointer',
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Recommended Players Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Flame size={20} color="var(--accent-gold)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800' }}>Featured Fortnite Players</h3>
        </div>

        {filteredPlayers.map((player) => {
          const isFollowing = followingMap[player.id];
          return (
            <div key={player.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img src={player.avatar_url} alt="" className="avatar" />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: '800', fontSize: '0.95rem' }}>
                      {player.display_name}
                      {player.is_verified && <span className="verified-icon">✓</span>}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      @{player.username} • <span style={{ color: 'var(--accent-cyan)' }}>{player.rank}</span>
                    </div>
                  </div>
                </div>

                <button
                  className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', minHeight: '36px' }}
                  onClick={() => handleFollowToggle(player.id)}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck size={15} /> Following
                    </>
                  ) : (
                    <>
                      <UserPlus size={15} /> Follow
                    </>
                  )}
                </button>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{player.bio}</p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: 'var(--border-subtle)', paddingTop: '0.5rem' }}>
                <span>IGN: {player.fortnite_username}</span>
                <span>{(player.follower_count / 1000).toFixed(1)}K Followers</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
