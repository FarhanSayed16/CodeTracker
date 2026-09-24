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

export const classStudentParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid class ID format'),
    studentId: z.string().uuid('Invalid student ID format'),
  }),
});

export const addStudentSchema = z.object({
  body: z.object({
    rollNo: z.string().min(1, 'Roll number is required'),
    name: z.string().min(1, 'Name is required'),
    membershipId: z.string().optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid class ID format'),
  }),
});
