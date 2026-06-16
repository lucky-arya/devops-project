import { z } from 'zod';

export const userIdSchema = z.object({
    id: z.coerce.number().int().positive({ message: 'User ID must be a positive integer' }),
});

export const updateUserSchema = z.object({
    name: z.string().min(2).max(255).optional(),
    email: z.string().email().toLowerCase().trim().optional(),
    role: z.enum(['user', 'admin']).optional(),
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
});
