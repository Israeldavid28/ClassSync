export interface Class {
  id: string; // This will be the Firestore document ID
  name: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string; // "10:00"
  endTime: string; // "11:30"
  location: string;
  professor: string;
  reminder: number; // minutes
}
