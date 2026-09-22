import { z } from 'zod';

export const createClassSchema = z.object({
  body: z.object({
    className: z.string().min(1, 'Class name is required'),
  }),
});

export const classIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid class ID format'),
  }),
});
