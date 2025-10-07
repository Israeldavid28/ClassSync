'use server';

/**
 * @fileOverview A flow that suggests optimal reminder times for each class based on the class schedule and location.
 *
 * - suggestReminderTimes - A function that suggests reminder times for classes.
 * - SuggestReminderTimesInput - The input type for the suggestReminderTimes function.
 * - SuggestReminderTimesOutput - The return type for the suggestReminderTimes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestReminderTimesInputSchema = z.object({
  classSchedule: z.array(
    z.object({
      className: z.string().describe('The name of the class.'),
      classTime: z.string().describe('The time the class starts (e.g., 9:00 AM).'),
      classLocation: z.string().describe('The location of the class.'),
    })
  ).describe('The schedule of classes, including name, time and location.'),
  currentLocation: z.string().describe('The current location of the student.'),
});
export type SuggestReminderTimesInput = z.infer<typeof SuggestReminderTimesInputSchema>;

const SuggestReminderTimesOutputSchema = z.array(
  z.object({
    className: z.string().describe('The name of the class.'),
    reminderTime: z.string().describe('The suggested reminder time (e.g., 8:45 AM).'),
    reason: z.string().describe('Explanation of why this time was chosen'),
  })
);
export type SuggestReminderTimesOutput = z.infer<typeof SuggestReminderTimesOutputSchema>;

export async function suggestReminderTimes(input: SuggestReminderTimesInput): Promise<SuggestReminderTimesOutput> {
  return suggestReminderTimesFlow(input);
}

const estimateTravelTime = ai.defineTool(
  {
    name: 'estimateTravelTime',
    description: 'Estimates travel time in minutes between two locations.',
    inputSchema: z.object({
      origin: z.string().describe('Starting location.'),
      destination: z.string().describe('Destination location.'),
    }),
    outputSchema: z.number().describe('Travel time in minutes.'),
  },
  async (input) => {
    // Placeholder implementation: Replace with actual travel time estimation logic.
    // This is where you would integrate with a maps API or a travel time service.
    console.log(`Estimating travel time from ${input.origin} to ${input.destination}`);
    // Assuming a fixed travel time for demonstration purposes
    return 15; // 15 minutes
  }
);

const prompt = ai.definePrompt({
  name: 'suggestReminderTimesPrompt',
  input: {schema: SuggestReminderTimesInputSchema},
  output: {schema: SuggestReminderTimesOutputSchema},
  tools: [estimateTravelTime],
  prompt: `You are an AI assistant that helps students manage their class schedule by suggesting optimal reminder times.

  Given the student's current location and class schedule, suggest a reminder time for each class that ensures the student arrives on time.
  Take into account the travel time between the student's current location and the class location.

  Class Schedule:
  {{#each classSchedule}}
  - Class Name: {{className}}, Class Time: {{classTime}}, Class Location: {{classLocation}}
  {{/each}}

  Current Location: {{currentLocation}}

  Output the reminder time for each class, along with a brief explanation of why that time was chosen. Use estimateTravelTime tool.

  Format your response as a JSON array of objects with className, reminderTime and reason fields.
  `,
});

const suggestReminderTimesFlow = ai.defineFlow(
  {
    name: 'suggestReminderTimesFlow',
    inputSchema: SuggestReminderTimesInputSchema,
    outputSchema: SuggestReminderTimesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
