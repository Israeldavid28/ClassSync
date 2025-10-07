'use client';

import { useState } from 'react';
import type { Class } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClassCard } from './ClassCard';
import { Button } from '../ui/button';
import { PlusCircle, CalendarDays } from 'lucide-react';
import { format, parse } from 'date-fns';

interface ScheduleViewProps {
  classes: Class[];
  onReset: () => void;
}

const weekDays: Class['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function ScheduleView({ classes, onReset }: ScheduleViewProps) {
  const [today] = useState(format(new Date(), 'EEEE'));

  const sortedClasses = [...classes].sort((a, b) => {
    const timeA = parse(a.startTime, 'HH:mm', new Date());
    const timeB = parse(b.startTime, 'HH:mm', new Date());
    return timeA.getTime() - timeB.getTime();
  });

  const dailyClasses = sortedClasses.filter(c => c.day === today);

  const classesByDay = (day: Class['day']) => {
    return sortedClasses.filter(c => c.day === day);
  };

  return (
    <div className="animate-in fade-in-50 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
            <CalendarDays className="h-8 w-8 text-primary" />
            <div>
                <h2 className="text-3xl font-bold font-headline">Your Weekly Schedule</h2>
                <p className="text-muted-foreground">Here's your academic week at a glance.</p>
            </div>
        </div>
        <Button onClick={onReset} variant="outline">
          <PlusCircle className="mr-2 h-4 w-4" />
          Upload New Schedule
        </Button>
      </div>

      <Tabs defaultValue="weekly" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="weekly">Weekly View</TabsTrigger>
          <TabsTrigger value="daily">Today's Classes</TabsTrigger>
        </TabsList>
        <TabsContent value="weekly" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
            {weekDays.slice(0, 5).map(day => (
              <div key={day} className="space-y-4">
                <h3 className="text-lg font-semibold font-headline text-center">{day}</h3>
                <div className="space-y-4 rounded-lg bg-muted/50 p-4 min-h-[200px]">
                  {classesByDay(day).length > 0 ? (
                    classesByDay(day).map(cls => <ClassCard key={cls.id} classInfo={cls} />)
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground pt-10">No classes</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="daily" className="mt-6">
          <Card>
            <div className="p-6 space-y-4">
              <h3 className="text-xl font-semibold font-headline">Classes for {today}</h3>
              {dailyClasses.length > 0 ? (
                dailyClasses.map(cls => <ClassCard key={cls.id} classInfo={cls} />)
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-10">
                  <p className="text-lg font-medium">No classes today!</p>
                  <p className="text-muted-foreground">Enjoy your day off.</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
