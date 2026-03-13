import { NextResponse } from 'next/server';
import { csvTemplates, parseCsv, parseOfx, parseQif, runCsvImport } from '@/lib/importers';
import { handleApiError, jsonError, requireUserId } from '@/lib/http';

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return jsonError('Unauthorized', 401);

  return NextResponse.json({
    pipeline: 'multi-import/manual-upload/v2',
    supportedEntities: ['accounts', 'assets', 'transactions'],
    supportedFormats: ['csv', 'ofx', 'qif'],
    templates: csvTemplates,
  });
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return jsonError('Unauthorized', 401);

    const body = await request.json();
    const format = body.format === 'ofx' || body.format === 'qif' ? body.format : 'csv';
    const rows = typeof body.csv === 'string'
      ? format === 'ofx'
        ? parseOfx(body.csv)
        : format === 'qif'
          ? parseQif(body.csv)
          : parseCsv(body.csv, body.delimiter === ';' ? ';' : ',')
      : body.rows;
    const result = await runCsvImport({ ...body, format, rows }, userId);
    return NextResponse.json(result, { status: body.dryRun === false ? 201 : 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
