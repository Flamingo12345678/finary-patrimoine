import { z } from 'zod';

export const credentialsSchema = z.object({
  email: z.string().trim().email('Email invalide').toLowerCase(),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères').max(72, 'Le mot de passe est trop long'),
});

export const signupSchema = credentialsSchema.extend({
  name: z.string().trim().min(2, 'Le nom doit contenir au moins 2 caractères').max(80, 'Le nom est trop long'),
  confirmPassword: z.string(),
}).superRefine(({ password, confirmPassword }, ctx) => {
  if (password !== confirmPassword) {
    ctx.addIssue({
      code: 'custom',
      path: ['confirmPassword'],
      message: 'Les mots de passe ne correspondent pas.',
    });
  }
});

export type SignupInput = z.infer<typeof signupSchema>;
