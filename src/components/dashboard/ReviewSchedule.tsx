'use client';

import { useState } from 'react';
import type { Class } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, PlusCircle, Save } from 'lucide-react';

// Use a temporary ID for new classes before they are saved to firestore
type EditableClass = Omit<Class, 'id'> & { tempId: string };

interface ReviewScheduleProps {
  initialClasses: Omit<Class, 'id'>[];
  onSave: (classes: Omit<Class, 'id'>[]) => void;
}

const dayOptions: {value: Class['day'], label: string}[] = [
    { value: 'Monday', label: 'Lunes' },
    { value: 'Tuesday', label: 'Martes' },
    { value: 'Wednesday', label: 'Miércoles' },
    { value: 'Thursday', label: 'Jueves' },
    { value: 'Friday', label: 'Viernes' },
    { value: 'Saturday', label: 'Sábado' },
    { value: 'Sunday', label: 'Domingo' },
];

export function ReviewSchedule({ initialClasses, onSave }: ReviewScheduleProps) {
  const [classes, setClasses] = useState<EditableClass[]>(
      initialClasses.map((c, i) => ({ ...c, tempId: `initial-${i}`}))
  );

  const handleClassChange = (tempId: string, field: keyof EditableClass, value: string | number) => {
    setClasses(classes.map(c => c.tempId === tempId ? { ...c, [field]: value } : c));
  };

  const addNewClass = () => {
    const newClass: EditableClass = {
      tempId: `new-${Date.now()}`,
      className: '',
      day: 'Monday',
      startTime: '09:00',
      endTime: '10:00',
      location: '',
      professor: '',
      reminder: 15,
    };
    setClasses([...classes, newClass]);
  };

  const deleteClass = (tempId: string) => {
    setClasses(classes.filter(c => c.tempId !== tempId));
  };

  return (
    <div className="animate-in fade-in-50 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold font-headline">Revisa tu Horario</h2>
        <p className="text-muted-foreground">
          Nuestra IA ha extraído tus clases. Revisa, edita y añade recordatorios antes de guardar.
        </p>
      </div>

      <div className="space-y-6">
        {classes.map((cls, index) => (
          <Card key={cls.tempId} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between bg-muted/50">
              <CardTitle className="text-xl font-headline">Clase #{index + 1}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => deleteClass(cls.tempId)}>
                <Trash2 className="h-5 w-5 text-destructive" />
                <span className="sr-only">Eliminar clase</span>
              </Button>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor={`name-${cls.tempId}`}>Nombre de la Clase</Label>
                <Input id={`name-${cls.tempId}`} value={cls.className} onChange={(e) => handleClassChange(cls.tempId, 'className', e.target.value)} placeholder="Ej: Introducción a la Psicología" />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`day-${cls.tempId}`}>Día de la Semana</Label>
                <Select value={cls.day} onValueChange={(value: Class['day']) => handleClassChange(cls.tempId, 'day', value)}>
                  <SelectTrigger id={`day-${cls.tempId}`}>
                    <SelectValue placeholder="Selecciona un día" />
                  </SelectTrigger>
                  <SelectContent>
                    {dayOptions.map(day => <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`start-${cls.tempId}`}>Hora de Inicio</Label>
                  <Input id={`start-${cls.tempId}`} type="time" value={cls.startTime} onChange={(e) => handleClassChange(cls.tempId, 'startTime', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`end-${cls.tempId}`}>Hora de Fin</Label>
                  <Input id={`end-${cls.tempId}`} type="time" value={cls.endTime} onChange={(e) => handleClassChange(cls.tempId, 'endTime', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`location-${cls.tempId}`}>Ubicación</Label>
                <Input id={`location-${cls.tempId}`} value={cls.location} onChange={(e) => handleClassChange(cls.tempId, 'location', e.target.value)} placeholder="Ej: Edificio 4, Salón 101" />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`prof-${cls.tempId}`}>Profesor</Label>
                <Input id={`prof-${cls.tempId}`} value={cls.professor} onChange={(e) => handleClassChange(cls.tempId, 'professor', e.target.value)} placeholder="Ej: Dr. Pérez" />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`reminder-${cls.tempId}`}>Recordatorio</Label>
                <Select value={String(cls.reminder)} onValueChange={(value) => handleClassChange(cls.tempId, 'reminder', parseInt(value))}>
                  <SelectTrigger id={`reminder-${cls.tempId}`}>
                    <SelectValue placeholder="Establecer recordatorio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutos antes</SelectItem>
                    <SelectItem value="10">10 minutos antes</SelectItem>
                    <SelectItem value="15">15 minutos antes</SelectItem>
                    <SelectItem value="30">30 minutos antes</SelectItem>
                    <SelectItem value="60">1 hora antes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ))}
        
        <div className="flex justify-between items-center mt-6 gap-4">
          <Button variant="outline" onClick={addNewClass}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Otra Clase
          </Button>
          <Button size="lg" onClick={() => onSave(classes)}>
            <Save className="mr-2 h-4 w-4" />
            Guardar Horario
          </Button>
        </div>
      </div>
    </div>
  );
}
