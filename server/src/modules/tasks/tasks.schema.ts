import { z } from 'zod';

export const createTaskSchema = z.object({
  body: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
  }),
});

export const updateTaskSchema = z.object({
  body: z
    .object({
      title: z.string().min(1, 'Title is required').optional(),
      description: z.string().optional().nullable(),
    })
    .refine((data) => data.title !== undefined || data.description !== undefined, {
      message: 'At least one of title or description is required',
    }),
  params: z.object({
    id: z.string().uuid('Invalid task ID'),
  }),
});

export const taskIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid task ID'),
  }),
});
