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

export default function Home() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [interpretedClasses, setInterpretedClasses] = useState<Class[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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
      setError(result.error || 'An unknown error occurred.');
      toast({
        title: 'Upload Failed',
        description: result.error || 'Could not process the timetable image.',
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
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h2 className="text-xl font-semibold font-headline">Syncing with the cosmos...</h2>
          <p className="text-muted-foreground">Our AI is deciphering your schedule. Hang tight!</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="text-center p-8">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => setError(null)}>Try Again</Button>
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
  }, [isLoading, error, interpretedClasses, classes]);

  return (
    <>
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="w-full max-w-7xl mx-auto">{MainContent}</div>
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground">
        <p>Built with ❤️ for students everywhere. ClassSync &copy; {new Date().getFullYear()}</p>
      </footer>
    </>
  );
}
