'use client';
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import { useEffect, useState, useContext } from 'react';
import { FirebaseContext, useFirebase } from '@/firebase/provider'; 
import { useToast } from '@/hooks/use-toast';

export interface UserAuthResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export function useUser(): UserAuthResult {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    // This case should ideally not be hit if the app is wrapped in FirebaseClientProvider
    return { user: null, isUserLoading: true, userError: new Error("useUser must be used within a FirebaseProvider.") };
  }

  const { user, isUserLoading, userError } = context;

  return { user, isUserLoading, userError };
}

type ToastFunc = ReturnType<typeof useToast>['toast'];

interface InitiateGoogleSignInParams {
  toast: ToastFunc;
}

export function initiateGoogleSignIn({ toast }: InitiateGoogleSignInParams) {
  // It's better to get auth from the provider if possible, but getAuth() is a fallback
  try {
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
  } catch(e) {
      console.error("Firebase not initialized. Cannot sign in.");
       toast({
        title: 'Error',
        description: 'Firebase is not ready yet, please wait a moment and try again.',
        variant: 'destructive',
      });
  }
}

interface HandleSignOutParams {
  toast: ToastFunc;
}

export function handleSignOut({ toast }: HandleSignOutParams) {
   try {
    const auth = getAuth();
    signOut(auth).catch((error) => {
      console.error('Sign-Out Error:', error);
      toast({
        title: 'Sign-Out Failed',
        description: 'Could not sign out. Please try again.',
        variant: 'destructive',
      });
    });
   } catch(e) {
      console.error("Firebase not initialized. Cannot sign out.");
   }
}
