/**
 * Genera la plantilla Excel a partir de la plantilla CSV, para que ambas
 * tengan siempre las mismas columnas y filas de ejemplo.
 *
 * Uso: pnpm template:xlsx
 */
import { readFile, writeFile } from 'node:fs/promises';
import * as XLSX from 'xlsx';
import { convertFloat, findColumn, normalizeDate, tokenizeCsv } from '../app/utils/csvUtils.ts';

const csvUrl = new URL('../public/Facturas Subvención - Plantilla.csv', import.meta.url);
const xlsxUrl = new URL('../public/Facturas Subvención - Plantilla.xlsx', import.meta.url);

const DATE_FORMAT = 'dd/mm/yyyy';
const AMOUNT_FORMAT = '#,##0.00 "€"';
const COLUMN_WIDTHS: Record<string, number> = {
    'Nº orden': 10,
    'Nº factura': 14,
    'Fecha': 12,
    'Fecha de pago': 14,
    'Actividad': 22,
    'Concepto': 24,
    'Proveedor': 42,
    'Total Factura': 14,
    'Gasto Justificable': 18
};

// Número de serie de Excel (días desde 30/12/1899) para una fecha dd/MM/yyyy
const toExcelSerial = (date: string): number => {
    const [day, month, year] = date.split('/').map(Number);
    return (Date.UTC(year!, month! - 1, day!) - Date.UTC(1899, 11, 30)) / 86_400_000;
};

const [header, ...rows] = tokenizeCsv(await readFile(csvUrl, 'utf8'));
if (!header) throw new Error('La plantilla CSV está vacía.');

const columns = header.cells.map(title => findColumn(title));
const missing = header.cells.filter((_, index) => !columns[index]);
if (missing.length > 0) throw new Error(`Columnas desconocidas en la plantilla CSV: ${missing.join(', ')}`);

const sheet: XLSX.WorkSheet = {};
header.cells.forEach((title, c) => {
    sheet[XLSX.utils.encode_cell({ r: 0, c })] = { t: 's', v: title.trim() };
});

rows.forEach((row, index) => {
    const r = index + 1;
    row.cells.forEach((raw, c) => {
        const value = raw.trim();
        if (!value) return;
        const address = XLSX.utils.encode_cell({ r, c });
        const kind = columns[c]!.kind;

        if (kind === 'date') sheet[address] = { t: 'n', v: toExcelSerial(normalizeDate(value)), z: DATE_FORMAT };
        else if (kind === 'amount') sheet[address] = { t: 'n', v: convertFloat(value)!, z: AMOUNT_FORMAT };
        else if (kind === 'order') sheet[address] = { t: 'n', v: Number(value) };
        else sheet[address] = { t: 's', v: value };
    });
});

sheet['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: header.cells.length - 1 } });
sheet['!cols'] = header.cells.map(title => ({ wch: COLUMN_WIDTHS[title.trim()] ?? 16 }));

const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, sheet, 'Facturas');
await writeFile(xlsxUrl, XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));

console.log(`Plantilla Excel generada con ${rows.length} filas de ejemplo: ${xlsxUrl.pathname}`);
