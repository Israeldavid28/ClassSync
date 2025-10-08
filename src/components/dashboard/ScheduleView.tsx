'use client';

import { useState } from 'react';
import type { Class } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClassCard } from './ClassCard';
import { Button } from '../ui/button';
import { PlusCircle, CalendarDays, Share2, CheckCircle } from 'lucide-react';
import { format, parse } from 'date-fns';
import { useUser, getGoogleAccessToken } from '@/firebase/auth/use-user';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ScheduleViewProps {
  classes: Class[];
  onReset: () => void;
}

const weekDays: {day: Class['day'], label: string}[] = [
    { day: 'Monday', label: 'Lunes' },
    { day: 'Tuesday', label: 'Martes' },
    { day: 'Wednesday', label: 'Miércoles' },
    { day: 'Thursday', label: 'Jueves' },
    { day: 'Friday', label: 'Viernes' },
    { day: 'Saturday', label: 'Sábado' },
    { day: 'Sunday', label: 'Domingo' },
];

const dayToRRule: Record<string, string> = {
  Monday: 'MO',
  Tuesday: 'TU',
  Wednesday: 'WE',
  Thursday: 'TH',
  Friday: 'FR',
  Saturday: 'SA',
  Sunday: 'SU',
};

function getNextDayOfWeekISO(dayOfWeek: string, startTime: string): string {
    const dayIndexMap: { [key: string]: number } = {
        'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 
        'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };
    const targetDayIndex = dayIndexMap[dayOfWeek];

    const now = new Date();
    const [hours, minutes] = startTime.split(':').map(Number);
    
    const targetTimeToday = new Date();
    targetTimeToday.setHours(hours, minutes, 0, 0);

    const currentDayIndex = now.getDay();
    let dayDifference = targetDayIndex - currentDayIndex;

    if (dayDifference === 0 && now > targetTimeToday) {
      dayDifference += 7;
    } 
    else if (dayDifference < 0) {
      dayDifference += 7;
    }
    
    const nextDate = new Date();
    nextDate.setDate(now.getDate() + dayDifference);
    nextDate.setHours(hours, minutes, 0, 0);

    const year = nextDate.getFullYear();
    const month = String(nextDate.getMonth() + 1).padStart(2, '0');
    const day = String(nextDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}


async function addClassToCalendar(classInfo: Class, token: string) {
  const nextClassDate = getNextDayOfWeekISO(classInfo.day, classInfo.startTime);

  const event = {
    summary: classInfo.className,
    location: classInfo.location,
    description: `Profesor: ${classInfo.professor}`,
    start: {
      dateTime: `${nextClassDate}T${classInfo.startTime}:00`,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: `${nextClassDate}T${classInfo.endTime}:00`,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    recurrence: [`RRULE:FREQ=WEEKLY;BYDAY=${dayToRRule[classInfo.day]}`],
    reminders: {
      useDefault: false,
      overrides: [{ method: 'popup', minutes: classInfo.reminder }],
    },
  };

  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    return data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

export function ScheduleView({ classes, onReset }: ScheduleViewProps) {
  const [today] = useState(format(new Date(), 'EEEE'));
  const { user } = useUser();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncCompleted, setSyncCompleted] = useState(false);

  const sortedClasses = [...classes].sort((a, b) => {
    const timeA = parse(a.startTime, 'HH:mm', new Date());
    const timeB = parse(b.startTime, 'HH:mm', new Date());
    return timeA.getTime() - timeB.getTime();
  });

  const dailyClasses = sortedClasses.filter(c => c.day.toLowerCase() === today.toLowerCase());

  const classesByDay = (day: Class['day']) => {
    return sortedClasses.filter(c => c.day === day);
  };
  
  const handleSyncToCalendar = async () => {
    if (!user) {
      toast({ title: 'Autenticación requerida', description: 'Por favor, inicia sesión para sincronizar tu calendario.', variant: 'destructive' });
      return;
    }
    setIsSyncing(true);
    setSyncCompleted(false);

    try {
      const token = await getGoogleAccessToken({ toast });
      if (!token) {
        setIsSyncing(false);
        return;
      }
      
      toast({ title: 'Sincronizando horario...', description: 'Añadiendo tus clases a Google Calendar. Esto puede tardar un momento.' });
      
      const results = await Promise.allSettled(classes.map(c => addClassToCalendar(c, token)));
      
      const successfulSyncs = results.filter(r => r.status === 'fulfilled').length;
      
      if (successfulSyncs > 0) {
        setSyncCompleted(true);
      }

      results.forEach(result => {
        if (result.status === 'rejected') {
          console.error('Failed to sync a class:', result.reason);
          toast({ title: 'Error de Sincronización', description: `No se pudo sincronizar una clase. ${result.reason}`, variant: 'destructive' });
        }
      });

    } catch (error) {
      console.error('Error syncing to Google Calendar:', error);
      toast({ title: 'Fallo al Sincronizar Calendario', description: (error as Error).message || 'No se pudo sincronizar con Google Calendar.', variant: 'destructive' });
    } finally {
      setIsSyncing(false);
    }
  };


  return (
    <div className="animate-in fade-in-50 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
            <CalendarDays className="h-8 w-8 text-primary" />
            <div>
                <h2 className="text-3xl font-bold font-headline">Tu Horario Semanal</h2>
                <p className="text-muted-foreground">Aquí está tu semana académica de un vistazo.</p>
            </div>
        </div>
        <div className="flex gap-2">
            <Button onClick={onReset} variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" />
              Subir Nuevo Horario
            </Button>
             <Button onClick={handleSyncToCalendar} disabled={isSyncing}>
              <Share2 className="mr-2 h-4 w-4" />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar con el Calendario'}
            </Button>
        </div>
      </div>
      
      {syncCompleted && (
        <Alert className="mb-6 border-green-500 text-green-700">
            <CheckCircle className="h-4 w-4 !text-green-500" />
            <AlertTitle className="text-green-700 font-bold">¡Sincronización Completa!</AlertTitle>
            <AlertDescription className="text-green-600">
                Se ha sincronizado su horario.
            </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="weekly" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="weekly">Vista Semanal</TabsTrigger>
          <TabsTrigger value="daily">Clases de Hoy</TabsTrigger>
        </TabsList>
        <TabsContent value="weekly" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
            {weekDays.slice(0, 5).map(item => (
              <div key={item.day} className="space-y-4">
                <h3 className="text-lg font-semibold font-headline text-center">{item.label}</h3>
                <div className="space-y-4 rounded-lg bg-muted/50 p-4 min-h-[200px]">
                  {classesByDay(item.day).length > 0 ? (
                    classesByDay(item.day).map(cls => <ClassCard key={cls.id} classInfo={cls} />)
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground pt-10">No hay clases</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="daily" className="mt-6">
          <Card>
            <div className="p-6 space-y-4">
              <h3 className="text-xl font-semibold font-headline">Clases para hoy ({weekDays.find(d => d.day.toLowerCase() === today.toLowerCase())?.label})</h3>
              {dailyClasses.length > 0 ? (
                dailyClasses.map(cls => <ClassCard key={cls.id} classInfo={cls} />)
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-10">
                  <p className="text-lg font-medium">¡No hay clases hoy!</p>
                  <p className="text-muted-foreground">Disfruta tu día libre.</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
