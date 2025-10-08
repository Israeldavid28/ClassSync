'use client';

import { useState, useMemo } from 'react';
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
import { useUser, initiateGoogleSignIn } from '@/firebase/auth/use-user';
import { FcGoogle } from 'react-icons/fc';

const dayMap: { [key: string]: Class['day'] } = {
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
  SUN: 'Sunday',
};

function parseRawClasses(rawClasses: InterpretTimetableImageOutput): Class[] {
  if (!rawClasses) return [];
  return rawClasses
    .map((raw, index) => {
      try {
        const timeParts = raw.time.split(' ');
        const dayAbbr = timeParts[0].toUpperCase();
        const timeRange = timeParts[1];
        const [startTime, endTime] = timeRange.split('-');

        if (!dayMap[dayAbbr] || !startTime || !endTime) {
          console.warn('Skipping invalid class data:', raw);
          return null;
        }

        return {
          id: `${raw.name}-${index}-${new Date().getTime()}`,
          name: raw.name,
          day: dayMap[dayAbbr],
          startTime: startTime,
          endTime: endTime,
          location: raw.location,
          professor: raw.professor,
          reminder: 15, // default reminder
        };
      } catch (error) {
        console.error('Failed to parse raw class:', raw, error);
        return null;
      }
    })
    .filter((c): c is Class => c !== null);
}

function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 h-[60vh]">
      <h2 className="text-2xl font-bold mb-4">Bienvenido a ClassSync</h2>
      <p className="text-muted-foreground mb-6">Inicia sesión con tu cuenta de Google para empezar.</p>
      <Button onClick={initiateGoogleSignIn} size="lg">
        <FcGoogle className="mr-2 h-5 w-5" />
        Iniciar Sesión con Google
      </Button>
    </div>
  );
}


export default function Home() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [interpretedClasses, setInterpretedClasses] = useState<Class[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();

  const onFileUpload = async (fileDataUri: string) => {
    setIsLoading(true);
    setError(null);
    setInterpretedClasses(null);

    try {
      const result = await handleTimetableUpload(fileDataUri);

      if (result.success && result.data) {
        if (result.data.length === 0) {
          toast({
            title: 'Horario Escaneado',
            description: "No pudimos encontrar ninguna clase automáticamente. Por favor, añádelas manualmente.",
          });
          setInterpretedClasses([]);
        } else {
          const parsed = parseRawClasses(result.data);
          if (parsed.length === 0) {
              toast({
                  title: 'Error de Análisis',
                  description: "Encontramos algunos datos, pero no pudimos estructurarlos correctamente. Por favor, añade tus clases manualmente.",
                  variant: 'destructive',
              });
              setInterpretedClasses([]);
          } else {
              toast({
                title: '¡Éxito!',
                description: `Se encontraron ${parsed.length} clases. Por favor, revísalas.`,
              });
              setInterpretedClasses(parsed);
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
        setIsLoading(false);
    }
  };

  const handleSaveSchedule = (newClasses: Class[]) => {
    setClasses(newClasses);
    setInterpretedClasses(null);
    toast({
      title: 'Horario Guardado',
      description: 'Tu horario de clases ha sido actualizado.',
    });
  };

  const handleReset = () => {
    setClasses([]);
    setInterpretedClasses(null);
    setError(null);
  };

  const MainContent = useMemo(() => {
    if (isUserLoading) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-4 sm:p-8 h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h2 className="text-xl font-semibold font-headline">Cargando...</h2>
          <p className="text-muted-foreground">Por favor, espera mientras verificamos tu estado de autenticación.</p>
        </div>
      );
    }
    
    if (!user) {
      return <LoginPage />;
    }

    if (isLoading) {
        return (
          <div className="flex flex-col items-center justify-center text-center p-4 sm:p-8 h-[60vh]">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h2 className="text-xl font-semibold font-headline">Analizando tu horario...</h2>
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
    if (classes.length > 0) {
      return <ScheduleView classes={classes} onReset={handleReset} />;
    }
    return <UploadTimetable onUpload={onFileUpload} />;
  }, [isLoading, error, interpretedClasses, classes, user, isUserLoading]);

  return (
    <>
      <Header />
      <main className="flex-grow container mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-7xl mx-auto">{MainContent}</div>
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground px-4">
        <p>Construido con ❤️ para estudiantes de todo el mundo. ClassSync &copy; {new Date().getFullYear()}</p>
      </footer>
    </>
  );
}
