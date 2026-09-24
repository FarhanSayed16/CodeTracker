import { z } from 'zod';

export const createSessionSchema = z.object({
  body: z.object({
    classId: z.string().uuid('Invalid class ID format'),
    title: z.string().min(1, 'Title is required'),
  }),
});

export const joinSessionSchema = z.object({
  body: z.object({
    sessionCode: z
      .string()
      .length(6, 'Session code must be 6 characters')
      .transform((v) => v.toUpperCase()),
    studentId: z.string().uuid('Invalid student ID'),
    pin: z.string().optional(),
  }),
});

export const sessionIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid session ID format'),
  }),
});

export const classIdParamSchema = z.object({
  params: z.object({
    classId: z.string().uuid('Invalid class ID format'),
  }),
});
