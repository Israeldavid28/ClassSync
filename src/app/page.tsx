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
import { useUser } from '@/firebase/auth/use-user';
import { initiateGoogleSignIn } from '@/firebase/auth/use-user';
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
    <div className="flex flex-col items-center justify-center text-center p-8">
      <h2 className="text-2xl font-bold mb-4">Welcome to ClassSync</h2>
      <p className="text-muted-foreground mb-6">Sign in with your Google account to get started.</p>
      <Button onClick={initiateGoogleSignIn} size="lg">
        <FcGoogle className="mr-2 h-5 w-5" />
        Sign In with Google
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

    const result = await handleTimetableUpload(fileDataUri);

    setIsLoading(false);

    if (result.success && result.data) {
      if (result.data.length === 0) {
        toast({
          title: 'Timetable Scanned',
          description: "We couldn't find any classes automatically. Please add them manually.",
        });
        setInterpretedClasses([]);
      } else {
        const parsed = parseRawClasses(result.data);
        if (parsed.length === 0) {
            toast({
                title: 'Parsing Error',
                description: "We found some data, but couldn't structure it properly. Please add your classes manually.",
                variant: 'destructive',
            });
            setInterpretedClasses([]);
        } else {
            toast({
              title: 'Success!',
              description: `Found ${parsed.length} classes. Please review them.`,
            });
            setInterpretedClasses(parsed);
        }
      }
    } else {
      const errorMessage = result.error || 'Could not process the timetable image.';
      setError(errorMessage);
      toast({
        title: 'Upload Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleSaveSchedule = (newClasses: Class[]) => {
    setClasses(newClasses);
    setInterpretedClasses(null);
    toast({
      title: 'Schedule Saved',
      description: 'Your class schedule has been updated.',
    });
  };

  const handleReset = () => {
    setClasses([]);
    setInterpretedClasses(null);
    setError(null);
  };

  const MainContent = useMemo(() => {
    if (isUserLoading || isLoading) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-4 sm:p-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h2 className="text-xl font-semibold font-headline">{isLoading ? 'Analizando tu horario...' : 'Loading User...'}</h2>
          <p className="text-muted-foreground">{isLoading ? 'La IA de Gemini está leyendo la imagen. Esto puede tardar un momento.' : 'Please wait while we check your authentication status.'}</p>
        </div>
      );
    }
    
    if (!user) {
      return <LoginPage />;
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
