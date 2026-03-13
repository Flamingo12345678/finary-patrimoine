import { NextResponse } from 'next/server';
import { csvTemplates, parseCsv, runCsvImport } from '@/lib/importers';
import { handleApiError, jsonError, requireUserId } from '@/lib/http';

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return jsonError('Unauthorized', 401);

  return NextResponse.json({
    pipeline: 'csv/manual-upload/v1',
    supportedEntities: ['accounts', 'assets', 'transactions'],
    templates: csvTemplates,
  });
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return jsonError('Unauthorized', 401);

    const body = await request.json();
    const rows = typeof body.csv === 'string' ? parseCsv(body.csv, body.delimiter === ';' ? ';' : ',') : body.rows;
    const result = await runCsvImport({ ...body, rows }, userId);
    return NextResponse.json(result, { status: body.dryRun === false ? 201 : 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
