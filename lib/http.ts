import { ZodError } from 'zod';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function requireUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return jsonError('Validation invalide', 400, error.flatten());
  }

  if (error instanceof Error) {
    return jsonError(error.message, 400);
  }

  return jsonError('Erreur inattendue', 500);
}
