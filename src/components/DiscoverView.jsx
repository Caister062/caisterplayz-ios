import React, { useState, useEffect } from 'react';
import { Search, UserPlus, UserCheck, Flame, Trophy, AlertCircle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export const DiscoverView = ({ onSelectPlayer }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [players, setPlayers] = useState([]);
  const [followingMap, setFollowingMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch real players and following relationships from Supabase
  useEffect(() => {
    const fetchPlayers = async () => {
      setLoading(true);
      if (isSupabaseConfigured()) {
        try {
          // Fetch profiles excluding current user
          let query = supabase.from('profiles').select('*').limit(20);
          if (user?.id) {
            query = query.neq('id', user.id);
          }
          const { data: profilesData } = await query;

          if (profilesData) {
            setPlayers(profilesData);
          }

          // Fetch current user's follows
          if (user?.id) {
            const { data: followsData } = await supabase
              .from('follows')
              .select('following_id')
              .eq('follower_id', user.id);

            if (followsData) {
              const followStatus = {};
              followsData.forEach((f) => {
                followStatus[f.following_id] = true;
              });
              setFollowingMap(followStatus);
            }
          }
        } catch (err) {
          console.error('Discover players fetch error:', err);
        }
      } else {
        // Fallback demo players for offline state
        setPlayers([
          {
            id: 'usr_fn_streamer',
            display_name: 'VortexSniper',
            username: 'vortex_sniper',
            fortnite_username: 'VortexSnipes',
            avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
            bio: 'Competitive shooter & trickshot creator.',
            follower_count: 28400,
            is_verified: true,
          },
          {
            id: 'usr_mythic_builder',
            display_name: 'MythicBuilder',
            username: 'mythic_builder',
            fortnite_username: 'MythicBuilds99',
            avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&h=150&fit=crop',
            bio: 'Custom map creator & tournament scrim organizer.',
            follower_count: 9800,
            is_verified: false,
          },
        ]);
      }
      setLoading(false);
    };

    fetchPlayers();
  }, [user?.id]);

  const triggerHaptic = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {}
  };

  const handleFollowToggle = async (playerId) => {
    triggerHaptic();
    const isCurrentlyFollowing = !!followingMap[playerId];
    const nextState = !isCurrentlyFollowing;

    setFollowingMap((prev) => ({
      ...prev,
      [playerId]: nextState,
    }));

    if (isSupabaseConfigured() && user?.id) {
      if (nextState) {
        await supabase.from('follows').insert({ follower_id: user.id, following_id: playerId });
      } else {
        await supabase.from('follows').delete().match({ follower_id: user.id, following_id: playerId });
      }
    }
  };

  const filteredPlayers = players.filter(
    (p) =>
      p.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.fortnite_username?.toLowerCase().includes(searchQuery.toLowerCase())
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
          placeholder="Search gamers by IGN, handle, or style..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Trending Community Tags */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {['#CompetitiveClips', '#Trickshots', '#CustomMaps', '#VictoryRoyale', '#ZeroBuild'].map((tag) => (
          <span
            key={tag}
            onClick={() => setSearchQuery(tag.replace('#', ''))}
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
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800' }}>Active Community Players</h3>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Finding players...
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No players found matching your search.
          </div>
        ) : (
          filteredPlayers.map((player) => {
            const isFollowing = followingMap[player.id];
            return (
              <div key={player.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img
                      src={player.avatar_url || 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=' + player.id}
                      alt=""
                      className="avatar"
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: '800', fontSize: '0.95rem' }}>
                        {player.display_name}
                        {player.is_verified && <span className="verified-icon">✓</span>}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        @{player.username}
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

                {player.bio && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{player.bio}</p>}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: 'var(--border-subtle)', paddingTop: '0.5rem' }}>
                  <span>{player.fortnite_username ? `IGN: ${player.fortnite_username}` : 'Gamer'}</span>
                  <span>{player.follower_count ? (player.follower_count >= 1000 ? `${(player.follower_count / 1000).toFixed(1)}K` : player.follower_count) : 0} Followers</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
