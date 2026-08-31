import React, { createContext, useContext, useState, useEffect } from 'react';
import { pb } from './pocketbase';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(pb.authStore.model);
  const [profile, setProfile] = useState(pb.authStore.model);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to PocketBase auth state changes
    const unsubscribe = pb.authStore.onChange((token, model) => {
      setUser(model);
      setProfile(model);
    });

    if (pb.authStore.isValid && pb.authStore.model) {
      setUser(pb.authStore.model);
      setProfile(pb.authStore.model);
    }
    setLoading(false);

    return () => {
      unsubscribe();
    };
  }, []);

  // PocketBase Sign Up
  const signUp = async ({ email, password, username, displayName, fortniteUsername }) => {
    try {
      const data = {
        username: username.toLowerCase().trim(),
        email: email.trim(),
        emailVisibility: true,
        password: password,
        passwordConfirm: password,
        name: displayName?.trim() || username.trim(),
        fortnite_username: fortniteUsername?.trim() || '',
        avatar_url: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${username.trim()}`,
        follower_count: 0,
        following_count: 0,
      };

      const record = await pb.collection('users').create(data);

      // Log in immediately following registration
      const authData = await pb.collection('users').authWithPassword(email.trim(), password);
      setUser(authData.record);
      setProfile(authData.record);

      return { user: authData.record, error: null };
    } catch (error) {
      console.error('PocketBase sign up error:', error);
      return { user: null, error };
    }
  };

  // PocketBase Sign In
  const signIn = async (email, password) => {
    try {
      const authData = await pb.collection('users').authWithPassword(email.trim(), password);
      setUser(authData.record);
      setProfile(authData.record);
      return { user: authData.record, error: null };
    } catch (error) {
      console.error('PocketBase sign in error:', error);
      return { user: null, error };
    }
  };

  // PocketBase Sign Out
  const signOut = () => {
    pb.authStore.clear();
    setUser(null);
    setProfile(null);
  };

  // Profile Update
  const updateProfile = async (updates) => {
    if (!user?.id) return;
    try {
      const updatedRecord = await pb.collection('users').update(user.id, updates);
      setUser(updatedRecord);
      setProfile(updatedRecord);
    } catch (e) {
      console.error('Failed to update profile:', e);
    }
  };

  // Permanent Account Deletion (Apple Guideline 5.1.1(v))
  const deleteAccount = async () => {
    if (!user?.id) return;
    try {
      await pb.collection('users').delete(user.id);
      signOut();
    } catch (e) {
      console.error('Failed to delete account:', e);
    }
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
