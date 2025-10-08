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
  const { user, isUserLoading, userError } = useFirebase();
  return { user, isUserLoading, userError };
}

type ToastFunc = ReturnType<typeof useToast>['toast'];

export async function handleGoogleSignIn({ toast }: { toast: ToastFunc }): Promise<void> {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/calendar.events');
  provider.setCustomParameters({
    prompt: 'select_account'
  });

  try {
    // Calling this function will trigger the onAuthStateChanged listener in the provider
    // which will then update the user state for the whole application.
    await signInWithPopup(auth, provider);
  } catch (error: any) {
    console.error('Error durante el inicio de sesión con Google:', error);
    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
      // This is a common case, and we don't need to show a toast, as the user intentionally closed the popup.
    } else {
      toast({
        title: 'Fallo al Iniciar Sesión',
        description: error.message || 'Ocurrió un error inesperado al intentar autenticarse con Google.',
        variant: 'destructive',
      });
    }
  }
}

export async function getGoogleAccessToken({ toast }: { toast: ToastFunc }): Promise<string | null> {
  try {
    const auth = getAuth();
    if (!auth.currentUser) {
      toast({
        title: 'Inicio de Sesión Requerido',
        description: 'Debes iniciar sesión primero para sincronizar tu calendario.',
        variant: 'destructive'
      });
      return null;
    }

    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar.events');
    // Force account selection to ensure the user can re-grant permissions if needed.
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    const result = await signInWithPopup(auth, provider);
    
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      return credential.accessToken;
    } else {
      // This case should ideally not be reached if signInWithPopup is successful
      toast({
        title: 'Error de Autenticación',
        description: 'No se pudo obtener el token de acceso de Google. Por favor, intenta iniciar sesión de nuevo.',
        variant: 'destructive',
      });
      return null;
    }
  } catch (error: any) {
    console.error('Error al obtener el token de acceso de Google:', error);
    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
      toast({
        title: 'Sincronización Cancelada',
        description: 'Debes completar el proceso de inicio de sesión para sincronizar tu calendario.',
      });
    } else {
      toast({
        title: 'Fallo al Obtener Permisos',
        description: error.message || 'Ocurrió un error inesperado al intentar autenticarse con Google.',
        variant: 'destructive',
      });
    }
    return null;
  }
}

interface HandleSignOutParams {
  toast: ToastFunc;
}

export function handleSignOut({ toast }: HandleSignOutParams) {
   try {
    const auth = getAuth();
    signOut(auth).catch((error) => {
      console.error('Error al cerrar sesión:', error);
      toast({
        title: 'Fallo al Cerrar Sesión',
        description: 'No se pudo cerrar la sesión. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    });
   } catch(e) {
      console.error("Firebase no está inicializado. No se puede cerrar sesión.");
   }
}
