
'use server';

import { interpretTimetableImage, type InterpretTimetableImageOutput } from '@/ai/flows/interpret-timetable-image';

export async function handleTimetableUpload(photoDataUri: string): Promise<{ success: boolean; data?: InterpretTimetableImageOutput; error?: string; }> {
  if (!photoDataUri) {
    return { success: false, error: 'No photo data provided.' };
  }
  try {
    // NOTE: The AI flow is currently mocked to return an empty array.
    // We are using mock data here to simulate a successful response for UI development.
    // In a real application, you would use the result from the AI flow.
    
    // const result = await interpretTimetableImage({ photoDataUri });

    const mockResult: InterpretTimetableImageOutput = [
      { name: 'Quantum Physics', time: 'MON 10:00-11:30', location: 'Hall C', professor: 'Dr. Evelyn Reed' },
      { name: 'Organic Chemistry', time: 'TUE 13:00-14:30', location: 'Lab 4B', professor: 'Dr. Alan Grant' },
      { name: 'Literary Analysis', time: 'WED 09:00-10:30', location: 'Room 201', professor: 'Dr. Jane Austen' },
      { name: 'Data Structures', time: 'THU 11:00-12:30', location: 'CS-101', professor: 'Dr. Ada Lovelace' },
      { name: 'Ethical Hacking', time: 'FRI 14:00-15:30', location: 'Cyber-Sec Hub', professor: 'Mr. Robot' }
    ];

    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // To test empty state, uncomment the following line
    // const mockResult: InterpretTimetableImageOutput = [];

    return { success: true, data: mockResult };
  } catch (error) {
    console.error('Error interpreting timetable:', error);
    return { success: false, error: 'An unexpected error occurred while interpreting the timetable.' };
  }
}
