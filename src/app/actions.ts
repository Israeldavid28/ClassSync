
'use server';

import { interpretTimetableImage, type InterpretTimetableImageOutput } from '@/ai/flows/interpret-timetable-image';

export async function handleTimetableUpload(photoDataUri: string): Promise<{ success: boolean; data?: InterpretTimetableImageOutput; error?: string; }> {
  if (!photoDataUri) {
    return { success: false, error: 'No photo data provided.' };
  }
  try {
    const result = await interpretTimetableImage({ photoDataUri });

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error interpreting timetable:', error);
    let errorMessage = 'An unexpected error occurred while interpreting the timetable.';
    if (error instanceof Error) {
      errorMessage = `AI Error: ${error.message}`;
    }
    return { success: false, error: errorMessage };
  }
}
