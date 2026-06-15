import {z} from 'zod';

export const signUpSchema = z.object({
    username: z.string().min(3).max(255),
    email: z.string().min(3).max(255).toLowerCase().trim().email(),
    password: z.string().min(6).max(128),
    role : z.enum(['user','admin']).default('user') // Default role is 'user'
});

export const signInSchema = z.object({
    email: z.string().min(3).max(255).toLowerCase().trim().email(),
    password: z.string().min(6).max(128),
});

export const signOutSchema = z.object({
    // No body expected for sign-out, but you can add fields if needed
})