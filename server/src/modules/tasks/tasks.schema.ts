import { z } from 'zod';

export const createTaskSchema = z.object({
  body: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
  }),
});

export const taskIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid task ID'),
  }),
});
