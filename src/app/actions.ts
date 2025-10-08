
'use server';

import { interpretTimetableImage, type InterpretTimetableImageOutput } from '@/ai/flows/interpret-timetable-image';

export async function handleTimetableUpload(photoDataUri: string): Promise<{ success: boolean; data?: InterpretTimetableImageOutput; error?: string; }> {
  if (!photoDataUri) {
    return { success: false, error: 'No photo data provided.' };
  }
  try {
    const result = await interpretTimetableImage({ photoDataUri });

    return { success: true, data: result };
  } catch (error) {
    console.error('Error interpreting timetable:', error);
    return { success: false, error: 'An unexpected error occurred while interpreting the timetable.' };
  }
}
