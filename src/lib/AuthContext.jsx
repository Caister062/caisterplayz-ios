import React, { createContext, useContext, useState, useEffect } from 'react';
import { pb, getDatabase } from './pocketbase';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // 1. Check PocketBase session if live server is configured
      if (pb?.authStore?.isValid && pb.authStore.model) {
        setUser(pb.authStore.model);
        setProfile(pb.authStore.model);
        setLoading(false);
        return;
      }

      // 2. Check local database persistent session
      const storedSession = localStorage.getItem('caisterplayz_active_user');
      if (storedSession) {
        try {
          const parsed = JSON.parse(storedSession);
          const db = await getDatabase();
          const freshUser = await db.get('users', parsed.id);
          if (freshUser) {
            setUser(freshUser);
            setProfile(freshUser);
          } else {
            setUser(parsed);
            setProfile(parsed);
          }
        } catch (e) {
          console.error('Session load error:', e);
        }
      }
      setLoading(false);
    };

    initAuth();

    // Listen to PocketBase if active
    if (pb?.authStore) {
      const unsub = pb.authStore.onChange((token, model) => {
        if (model) {
          setUser(model);
          setProfile(model);
        }
      });
      return () => unsub();
    }
  }, []);

  // Sign Up: Works on PocketBase if connected, otherwise writes to persistent IndexedDB
  const signUp = async ({ email, password, username, displayName, fortniteUsername }) => {
    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.toLowerCase().trim();

    // 1. Attempt PocketBase remote sign-up if configured
    if (pb) {
      try {
        const data = {
          username: cleanUsername,
          email: cleanEmail,
          emailVisibility: true,
          password: password,
          passwordConfirm: password,
          name: displayName?.trim() || username.trim(),
          fortnite_username: fortniteUsername?.trim() || '',
          avatar_url: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${cleanUsername}`,
          follower_count: 0,
          following_count: 0,
        };
        await pb.collection('users').create(data);
        const authData = await pb.collection('users').authWithPassword(cleanEmail, password);
        setUser(authData.record);
        setProfile(authData.record);
        return { user: authData.record, error: null };
      } catch (err) {
        console.warn('PocketBase server error, checking local DB:', err.message);
      }
    }

    // 2. Local Database Sign-up
    try {
      const db = await getDatabase();
      
      // Check for existing user with same email or username
      const existingEmail = await db.getFromIndex('users', 'email', cleanEmail);
      if (existingEmail) {
        return { user: null, error: new Error('An account with this email already exists.') };
      }

      const existingUsername = await db.getFromIndex('users', 'username', cleanUsername);
      if (existingUsername) {
        return { user: null, error: new Error('This username is already taken.') };
      }

      const newUser = {
        id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        email: cleanEmail,
        password: password, // locally stored for session verification
        username: cleanUsername,
        name: displayName?.trim() || username.trim(),
        fortnite_username: fortniteUsername?.trim() || '',
        avatar_url: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${cleanUsername}`,
        banner_url: '',
        bio: '',
        is_verified: false,
        follower_count: 0,
        following_count: 0,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      };

      await db.put('users', newUser);
      localStorage.setItem('caisterplayz_active_user', JSON.stringify(newUser));
      setUser(newUser);
      setProfile(newUser);

      return { user: newUser, error: null };
    } catch (e) {
      console.error('Sign up error:', e);
      return { user: null, error: new Error(e.message || 'Failed to create account.') };
    }
  };

  // Sign In
  const signIn = async (email, password) => {
    const cleanEmail = email.toLowerCase().trim();

    // 1. Attempt PocketBase remote sign-in if configured
    if (pb) {
      try {
        const authData = await pb.collection('users').authWithPassword(cleanEmail, password);
        setUser(authData.record);
        setProfile(authData.record);
        return { user: authData.record, error: null };
      } catch (err) {
        console.warn('PocketBase auth failed, checking local DB:', err.message);
      }
    }

    // 2. Local Database Sign-in
    try {
      const db = await getDatabase();
      const userRecord = await db.getFromIndex('users', 'email', cleanEmail);

      if (!userRecord) {
        return { user: null, error: new Error('Invalid email or password.') };
      }

      if (userRecord.password !== password) {
        return { user: null, error: new Error('Invalid email or password.') };
      }

      localStorage.setItem('caisterplayz_active_user', JSON.stringify(userRecord));
      setUser(userRecord);
      setProfile(userRecord);
      return { user: userRecord, error: null };
    } catch (e) {
      return { user: null, error: new Error(e.message || 'Sign in error.') };
    }
  };

  // Sign Out
  const signOut = () => {
    if (pb) pb.authStore.clear();
    localStorage.removeItem('caisterplayz_active_user');
    setUser(null);
    setProfile(null);
  };

  // Profile Update
  const updateProfile = async (updates) => {
    if (!user?.id) return;
    const updated = { ...profile, ...updates, updated: new Date().toISOString() };
    setUser(updated);
    setProfile(updated);
    localStorage.setItem('caisterplayz_active_user', JSON.stringify(updated));

    if (pb) {
      try {
        await pb.collection('users').update(user.id, updates);
      } catch (e) {}
    }

    try {
      const db = await getDatabase();
      await db.put('users', updated);
    } catch (e) {}
  };

  // Permanent Account Deletion (Apple Guideline 5.1.1(v))
  const deleteAccount = async () => {
    if (!user?.id) return;
    const userId = user.id;

    if (pb) {
      try {
        await pb.collection('users').delete(userId);
      } catch (e) {}
    }

    try {
      const db = await getDatabase();
      await db.delete('users', userId);
    } catch (e) {}

    signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
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
