'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Class } from '@/lib/types';
import type { InterpretTimetableImageOutput } from '@/ai/flows/interpret-timetable-image';
import { Header } from '@/components/layout/Header';
import { UploadTimetable } from '@/components/dashboard/UploadTimetable';
import { ReviewSchedule } from '@/components/dashboard/ReviewSchedule';
import { ScheduleView } from '@/components/dashboard/ScheduleView';
import { handleTimetableUpload } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser, handleGoogleSignIn } from '@/firebase/auth/use-user';
import { FcGoogle } from 'react-icons/fc';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';


function parseRawClasses(rawClasses: InterpretTimetableImageOutput): Omit<Class, 'id'>[] {
  if (!rawClasses) return [];
  return rawClasses
    .map((raw) => {
      try {
        if (!raw.className || !raw.day || !raw.startTime || !raw.endTime) {
          console.warn('Skipping invalid class data due to missing fields:', raw);
          return null;
        }

        return {
          className: raw.className,
          day: raw.day,
          startTime: raw.startTime,
          endTime: raw.endTime,
          location: raw.location,
          professor: raw.professor,
          reminder: 15, // default reminder
        };
      } catch (error) {
        console.error('Failed to parse raw class:', raw, error);
        return null;
      }
    })
    .filter((c): c is Omit<Class, 'id'> => c !== null);
}

function LoginPage({ onLogin, isLoggingIn }: { onLogin: () => Promise<void>; isLoggingIn: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 h-[60vh]">
      <h2 className="text-2xl font-bold mb-4">Bienvenido a ClassSync</h2>
      <p className="text-muted-foreground mb-6">Inicia sesión con tu cuenta de Google para empezar.</p>
      <Button onClick={onLogin} size="lg" disabled={isLoggingIn}>
        {isLoggingIn ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <FcGoogle className="mr-2 h-5 w-5" />
        )}
        {isLoggingIn ? 'Iniciando Sesión...' : 'Iniciar Sesión con Google'}
      </Button>
    </div>
  );
}


export default function Home() {
  const [interpretedClasses, setInterpretedClasses] = useState<Omit<Class, 'id'>[] | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // Fetch classes from Firestore
  const classesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'classEvents');
  }, [user, firestore]);
  const { data: classes, isLoading: areClassesLoading } = useCollection<Class>(classesQuery);
  
  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await handleGoogleSignIn({ toast });
      // The onAuthStateChanged listener in FirebaseProvider will handle the user state update.
      // We don't need to do anything else here.
    } catch (e) {
       // Error is already toasted inside handleGoogleSignIn
    } finally {
      // The loading state will be resolved by the isUserLoading flag from the useUser hook.
      // We can set this to false, but the UI transition is primarily handled by isUserLoading.
      setIsLoggingIn(false);
    }
  };
  
  const handleSaveSchedule = (newClasses: (Omit<Class, 'id'>)[]) => {
    if (!user || !firestore) {
      toast({ title: 'Error', description: 'Debes iniciar sesión para guardar tu horario.', variant: 'destructive' });
      return;
    }

    const userClassesRef = collection(firestore, 'users', user.uid, 'classEvents');

    // Use a loop with non-blocking calls to enable detailed error reporting
    newClasses.forEach((classData) => {
      const { ...rest } = classData;
      const docRef = doc(userClassesRef); // Create a new doc with a random ID
      // The setDocumentNonBlocking function will handle emitting a detailed error on failure
      setDocumentNonBlocking(docRef, { ...rest, userProfileId: user.uid }, {});
    });

    toast({
      title: 'Guardando Horario...',
      description: 'Tu horario de clases se está guardando en tu cuenta.',
    });
    setInterpretedClasses(null);
  };
  
  const onFileUpload = async (fileDataUri: string) => {
    setIsUploading(true);
    setError(null);
    
    try {
      const result = await handleTimetableUpload(fileDataUri);

      if (result.success && result.data) {
        if (result.data.length === 0) {
          toast({
            title: 'Horario Escaneado',
            description: "No pudimos encontrar ninguna clase automáticamente. Por favor, añádelas manualmente.",
          });
        } else {
          const parsed = parseRawClasses(result.data);
          if (parsed.length === 0) {
              toast({
                  title: 'Error de Análisis',
                  description: "Encontramos algunos datos, pero no pudimos estructurarlos correctamente. Por favor, revisa la imagen o añade tus clases manualmente.",
                  variant: 'destructive',
              });
          } else {
              toast({
                title: '¡Éxito!',
                description: `Se encontraron y guardaron ${parsed.length} clases automáticamente.`,
              });
              handleSaveSchedule(parsed);
          }
        }
      } else {
        const errorMessage = result.error || 'No se pudo procesar la imagen del horario.';
        setError(errorMessage);
        toast({
          title: 'Error al Subir',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } catch (e: any) {
       const errorMessage = e.message || 'Ocurrió un error inesperado.';
       setError(errorMessage);
       toast({
         title: 'Error de Red',
         description: errorMessage,
         variant: 'destructive',
       });
    } finally {
        setIsUploading(false);
    }
  };


  const handleReset = async () => {
    if (!user || !firestore || !classes) return;

    // Use individual non-blocking deletes for better error context
    classes.forEach(c => {
      const docRef = doc(firestore, 'users', user.uid, 'classEvents', c.id);
      // The deleteDocumentNonBlocking function will handle emitting a detailed error on failure
      deleteDocumentNonBlocking(docRef);
    });

    setInterpretedClasses(null);
    setError(null);
    toast({
      title: 'Borrando Horario',
      description: 'Tu horario anterior ha sido borrado. Ahora puedes subir uno nuevo.',
    });
  };

  const MainContent = useMemo(() => {
    if (isUserLoading || areClassesLoading) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-4 sm:p-8 h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h2 className="text-xl font-semibold font-headline">Cargando...</h2>
          <p className="text-muted-foreground">Por favor, espera un momento.</p>
        </div>
      );
    }
    
    if (!user) {
      return <LoginPage onLogin={handleLogin} isLoggingIn={isLoggingIn} />;
    }

    if (isUploading) {
        return (
          <div className="flex flex-col items-center justify-center text-center p-4 sm:p-8 h-[60vh]">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h2 className="text-xl font-semibold font-headline">Analizando y guardando tu horario...</h2>
            <p className="text-muted-foreground">La IA de Gemini está leyendo la imagen. Esto puede tardar un momento.</p>
          </div>
        );
    }

    if (error) {
      return (
        <div className="text-center p-4 sm:p-8">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => setError(null)}>Intentar de nuevo</Button>
        </div>
      );
    }

    if (interpretedClasses !== null) {
      return <ReviewSchedule initialClasses={interpretedClasses} onSave={handleSaveSchedule} />;
    }

    if (classes && classes.length > 0) {
      return <ScheduleView classes={classes} onReset={handleReset} />;
    }
    return <UploadTimetable onUpload={onFileUpload} />;
  }, [isUploading, error, classes, user, isUserLoading, areClassesLoading, interpretedClasses, isLoggingIn]);

  return (
    <>
      <Header />
      <main className="flex-grow container mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-7xl mx-auto">{MainContent}</div>
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground px-4">
        <p>Desarrollado por Israel Escalona, todos los derechos reservados. ClassSync &copy; {new Date().getFullYear()}</p>
      </footer>
    </>
  );
}
