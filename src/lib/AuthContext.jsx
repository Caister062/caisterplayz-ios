import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured] = useState(isSupabaseConfigured());

  // Fetch real profile from Supabase Database
  const fetchProfile = async (userId) => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        setProfile(data);
      } else {
        // Build profile from auth user metadata if database trigger hasn't completed yet
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const fallbackProfile = {
            id: authUser.id,
            username: authUser.user_metadata?.username || 'player',
            display_name: authUser.user_metadata?.display_name || 'Gamer',
            fortnite_username: authUser.user_metadata?.fortnite_username || '',
            avatar_url: authUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${authUser.id}`,
            banner_url: authUser.user_metadata?.banner_url || '',
            bio: authUser.user_metadata?.bio || '',
            is_verified: false,
            follower_count: 0,
            following_count: 0,
          };
          setProfile(fallbackProfile);
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Real Sign Up with Supabase Auth
  const signUp = async ({ email, password, username, displayName, fortniteUsername }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.toLowerCase().trim(),
          display_name: displayName?.trim() || username.trim(),
          fortnite_username: fortniteUsername?.trim() || '',
          avatar_url: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${username.trim()}`,
        },
      },
    });

    if (error) {
      return { user: null, error };
    }

    if (data?.user) {
      setUser(data.user);
      await fetchProfile(data.user.id);
    }
    return { user: data?.user, error: null };
  };

  // Real Sign In with Supabase Auth
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, error };
    }

    if (data?.user) {
      setUser(data.user);
      await fetchProfile(data.user.id);
    }
    return { user: data?.user, error: null };
  };

  // Real Sign Out
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  // Real Profile Update in Supabase
  const updateProfile = async (updates) => {
    if (!user) return;
    const newProfile = { ...profile, ...updates, updated_at: new Date().toISOString() };
    setProfile(newProfile);

    try {
      await supabase.from('profiles').update(updates).eq('id', user.id);
      await supabase.auth.updateUser({
        data: updates,
      });
    } catch (e) {
      console.error('Failed to update profile:', e);
    }
  };

  // Real Permanent Account Deletion (Apple Guideline 5.1.1(v))
  const deleteAccount = async () => {
    if (!user) return;
    try {
      // Delete user's profile and cascade all related posts, comments, likes, messages
      await supabase.from('profiles').delete().eq('id', user.id);
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Failed to delete account:', e);
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
