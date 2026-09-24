import { z } from 'zod';
import { TaskStatus } from '../../types/enums';
import { MAX_ISSUE_TEXT_LENGTH } from '../../config/constants';

export const updateStatusSchema = z.object({
  body: z
    .object({
      taskId: z.string().uuid('Invalid task ID'),
      status: z.nativeEnum(TaskStatus),
      issueText: z.string().max(MAX_ISSUE_TEXT_LENGTH).optional().nullable(),
    })
});

export const sessionParamSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
  }),
});
