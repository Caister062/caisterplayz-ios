import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

// Initial fallback mock user when testing locally before live Supabase credentials are plugged in
const LOCAL_MOCK_USER = {
  id: 'usr_caister_leader',
  email: 'player1@caisterplayz.gg',
  user_metadata: {
    username: 'CaisterLegend',
    display_name: 'Caister Legend ⚡',
    fortnite_username: 'CaisterVictory24',
    avatar_url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&h=150&fit=crop&crop=faces',
    banner_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=400&fit=crop',
    bio: 'Competitive Fortnite player & content creator. Chapter 5 Unreal Rank 🏆',
    is_verified: true,
  },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured] = useState(isSupabaseConfigured());

  // Fetch or create profile
  const fetchProfile = async (userId) => {
    if (!isConfigured) {
      setProfile({
        id: userId,
        username: user?.user_metadata?.username || 'CaisterLegend',
        display_name: user?.user_metadata?.display_name || 'Caister Legend ⚡',
        fortnite_username: user?.user_metadata?.fortnite_username || 'CaisterVictory24',
        avatar_url: user?.user_metadata?.avatar_url || LOCAL_MOCK_USER.user_metadata.avatar_url,
        banner_url: user?.user_metadata?.banner_url || LOCAL_MOCK_USER.user_metadata.banner_url,
        bio: user?.user_metadata?.bio || LOCAL_MOCK_USER.user_metadata.bio,
        is_verified: true,
        follower_count: 14200,
        following_count: 85,
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile not found, let trigger create it or create fallback
        console.warn('Profile not found, waiting for trigger or fallback creation');
      } else if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (isConfigured) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      } else {
        // Use local mock storage for instantaneous offline testing
        const storedUser = localStorage.getItem('caisterplayz_mock_user');
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            setProfile(parsed.profile);
          } catch (e) {
            setUser(LOCAL_MOCK_USER);
            setProfile({ ...LOCAL_MOCK_USER.user_metadata, id: LOCAL_MOCK_USER.id, follower_count: 14200, following_count: 85 });
          }
        } else {
          setUser(LOCAL_MOCK_USER);
          setProfile({ ...LOCAL_MOCK_USER.user_metadata, id: LOCAL_MOCK_USER.id, follower_count: 14200, following_count: 85 });
        }
      }
      setLoading(false);
    };

    initAuth();

    if (isConfigured) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      });

      return () => {
        authListener?.subscription?.unsubscribe();
      };
    }
  }, [isConfigured]);

  // Sign Up with EULA acceptance
  const signUp = async ({ email, password, username, displayName, fortniteUsername }) => {
    if (!isConfigured) {
      const newUser = {
        id: `usr_${Date.now()}`,
        email,
        user_metadata: {
          username: username.toLowerCase(),
          display_name: displayName || username,
          fortnite_username: fortniteUsername || '',
          avatar_url: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${username}`,
          banner_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=400&fit=crop',
          bio: 'Fortnite gaming enthusiast.',
          is_verified: false,
        },
      };
      const newProfile = {
        ...newUser.user_metadata,
        id: newUser.id,
        follower_count: 0,
        following_count: 0,
      };
      newUser.profile = newProfile;
      localStorage.setItem('caisterplayz_mock_user', JSON.stringify(newUser));
      setUser(newUser);
      setProfile(newProfile);
      return { user: newUser, error: null };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.toLowerCase(),
          display_name: displayName || username,
          fortnite_username: fortniteUsername || '',
        },
      },
    });

    if (data?.user) {
      setUser(data.user);
      await fetchProfile(data.user.id);
    }
    return { user: data?.user, error };
  };

  // Sign In
  const signIn = async (email, password) => {
    if (!isConfigured) {
      setUser(LOCAL_MOCK_USER);
      setProfile({ ...LOCAL_MOCK_USER.user_metadata, id: LOCAL_MOCK_USER.id, follower_count: 14200, following_count: 85 });
      return { user: LOCAL_MOCK_USER, error: null };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (data?.user) {
      setUser(data.user);
      await fetchProfile(data.user.id);
    }
    return { user: data?.user, error };
  };

  // Sign Out
  const signOut = async () => {
    if (isConfigured) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem('caisterplayz_mock_user');
    }
    setUser(null);
    setProfile(null);
  };

  // Edit Profile
  const updateProfile = async (updates) => {
    if (!profile) return;
    const newProfile = { ...profile, ...updates, updated_at: new Date().toISOString() };
    setProfile(newProfile);

    if (isConfigured) {
      await supabase.from('profiles').update(updates).eq('id', profile.id);
    } else {
      if (user) {
        user.user_metadata = { ...user.user_metadata, ...updates };
        user.profile = newProfile;
        localStorage.setItem('caisterplayz_mock_user', JSON.stringify(user));
      }
    }
  };

  // Permanent Account Deletion (App Store Safety Guideline 5.1.1(v))
  const deleteAccount = async () => {
    if (!user) return;
    if (isConfigured) {
      // Delete user profile and cascade all user data
      await supabase.from('profiles').delete().eq('id', user.id);
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem('caisterplayz_mock_user');
    }
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isConfigured,
        signUp,
        signIn,
        signOut,
        updateProfile,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
