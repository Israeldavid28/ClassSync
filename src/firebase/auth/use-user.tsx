'use client';
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import { useEffect, useState } from 'react';
import { useFirebase } from '@/firebase/provider'; // Adjusted path as per standard structure
import { useToast } from '@/hooks/use-toast';

export interface UserAuthResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export function useUser(): UserAuthResult {
  const { auth } = useFirebase();
  const [userState, setUserState] = useState<UserAuthResult>({
    user: auth.currentUser,
    isUserLoading: !auth.currentUser,
    userError: null,
  });

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => setUserState({ user, isUserLoading: false, userError: null }),
      (error) => setUserState({ user: null, isUserLoading: false, userError: error })
    );

    return () => unsubscribe();
  }, [auth]);

  return userState;
}

export function initiateGoogleSignIn() {
  const { toast } = useToast();
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/calendar.events');

  signInWithPopup(auth, provider).catch((error) => {
    console.error('Google Sign-In Error:', error);
    toast({
      title: 'Sign-In Failed',
      description: error.message || 'An unexpected error occurred during sign-in.',
      variant: 'destructive',
    });
  });
}

export function handleSignOut() {
  const { toast } = useToast();
  const auth = getAuth();
  signOut(auth).catch((error) => {
    console.error('Sign-Out Error:', error);
    toast({
      title: 'Sign-Out Failed',
      description: 'Could not sign out. Please try again.',
      variant: 'destructive',
    });
  });
}
