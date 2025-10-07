'use server';

/**
 * @fileOverview Interprets a timetable image and extracts class details.
 *
 * - interpretTimetableImage - A function that interprets a timetable image and extracts class details.
 * - InterpretTimetableImageInput - The input type for the interpretTimetableImage function.
 * - InterpretTimetableImageOutput - The return type for the interpretTimetableImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassDetailsSchema = z.object({
  name: z.string().describe('The name of the class.'),
  time: z.string().describe('The time of the class.'),
  location: z.string().describe('The location of the class.'),
  professor: z.string().describe('The name of the professor teaching the class.'),
});

const InterpretTimetableImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      'A photo of the timetable, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'  ),
});
export type InterpretTimetableImageInput = z.infer<typeof InterpretTimetableImageInputSchema>;

const InterpretTimetableImageOutputSchema = z.array(ClassDetailsSchema).describe('An array of class details extracted from the timetable image.');
export type InterpretTimetableImageOutput = z.infer<typeof InterpretTimetableImageOutputSchema>;

export async function interpretTimetableImage(input: InterpretTimetableImageInput): Promise<InterpretTimetableImageOutput> {
  return interpretTimetableImageFlow(input);
}

const extractClassDetails = ai.defineTool({
  name: 'extractClassDetails',
  description: 'Extracts class details (name, time, location, professor) from timetable image text.',
  inputSchema: z.object({
    timetableText: z.string().describe('The text extracted from the timetable image.'),
  }),
  outputSchema: z.array(ClassDetailsSchema),
},
async (input) => {
  //TODO: Implement real tool to extract structured data, currently just returns an empty array.
  return [];
});

const prompt = ai.definePrompt({
  name: 'interpretTimetableImagePrompt',
  input: {schema: InterpretTimetableImageInputSchema},
  output: {schema: InterpretTimetableImageOutputSchema},
  tools: [extractClassDetails],
  prompt: `You are an AI assistant specialized in interpreting class timetables.
  The user will provide an image of their timetable, and your task is to extract the class details, and use the extractClassDetails tool to structure the data.
  Make sure to call the extractClassDetails with the text you extract from the timetable image.

  Here is the timetable image: {{media url=photoDataUri}}
  `,
});

const interpretTimetableImageFlow = ai.defineFlow(
  {
    name: 'interpretTimetableImageFlow',
    inputSchema: InterpretTimetableImageInputSchema,
    outputSchema: InterpretTimetableImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
