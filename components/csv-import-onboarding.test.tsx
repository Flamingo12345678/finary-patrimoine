import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CsvImportOnboarding } from './csv-import-onboarding';

afterEach(() => {
  cleanup();
});

describe('CsvImportOnboarding', () => {
  it('switches entity and loads the matching template', async () => {
    const user = userEvent.setup();
    const onEntityChange = vi.fn();
    const onCsvTextChange = vi.fn();

    render(
      <CsvImportOnboarding
        entity="transactions"
        csvText=""
        preview={null}
        savingKey={null}
        onEntityChange={onEntityChange}
        onCsvTextChange={onCsvTextChange}
        onRun={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /comptes/i }));
    expect(onEntityChange).toHaveBeenCalledWith('accounts');

    await user.click(screen.getByRole('button', { name: /charger l’exemple/i }));
    expect(onCsvTextChange).toHaveBeenCalledWith(expect.stringContaining('label,amount,type'));
  });

  it('triggers preview and import actions', async () => {
    const user = userEvent.setup();
    const onRun = vi.fn();

    render(
      <CsvImportOnboarding
        entity="transactions"
        csvText="label,amount,type"
        preview={null}
        savingKey={null}
        onEntityChange={vi.fn()}
        onCsvTextChange={vi.fn()}
        onRun={onRun}
      />,
    );

    await user.click(screen.getAllByRole('button', { name: /^prévisualiser$/i })[0]);
    await user.click(screen.getAllByRole('button', { name: /importer en base/i })[0]);

    expect(onRun).toHaveBeenNthCalledWith(1, true);
    expect(onRun).toHaveBeenNthCalledWith(2, false);
  });
});
