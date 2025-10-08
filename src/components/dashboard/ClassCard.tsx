import type { Class } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, User, Bell } from 'lucide-react';

interface ClassCardProps {
  classInfo: Class;
}

export function ClassCard({ classInfo }: ClassCardProps) {
  return (
    <Card className="bg-card hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold font-headline">{classInfo.className}</CardTitle>
        <CardDescription className="flex items-center gap-2 pt-1">
            <Clock className="h-3.5 w-3.5" /> {classInfo.startTime} - {classInfo.endTime}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm space-y-2 text-muted-foreground">
        <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" />
            <span>{classInfo.location}</span>
        </div>
        <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5" />
            <span>{classInfo.professor}</span>
        </div>
        <div className="pt-1">
            <Badge variant="secondary" className="flex items-center gap-1.5 w-fit">
                <Bell className="h-3 w-3"/>
                Recordatorio {classInfo.reminder} min
            </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
