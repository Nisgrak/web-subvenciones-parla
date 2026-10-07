import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { convertFloat, normalizeDate, parseCsvContent, parseInvoiceRows, selectInvoicesForGeneration, tokenizeCsv } from '../app/utils/csvUtils.ts';
import { readSpreadsheetRows } from '../app/utils/spreadsheetUtils.ts';
import { getAcceptedInvoiceFileNames, getExpectedInvoiceFileName, getInvoiceKey, normalizeInvoiceFileName } from '../app/utils/fileUtils.ts';

const START = new Date(2025, 9, 1).getTime();
const END = new Date(2026, 8, 30).getTime();
const parseCsv = (csv: string) => parseCsvContent(csv, START, END, '01/10/2025', '30/09/2026');

const HEADER = 'Nº orden;Nº factura;Fecha;Fecha de pago;Actividad;Concepto;Proveedor;Total Factura;Gasto Justificable';

test('convertFloat entiende formato español e inglés sin multiplicar por 100', () => {
    assert.equal(convertFloat('8,25 €'), 8.25);
    assert.equal(convertFloat('8.25'), 8.25);
    assert.equal(convertFloat('1.234,56'), 1234.56);
    assert.equal(convertFloat('1,234.56'), 1234.56);
    assert.equal(convertFloat('1.234'), 1234);
    assert.equal(convertFloat('1.234.567'), 1234567);
    assert.equal(convertFloat('89'), 89);
    assert.equal(convertFloat('1 234,50 €'), 1234.5);
    assert.equal(convertFloat(''), undefined);
    assert.equal(convertFloat(' € '), undefined);
    assert.throws(() => convertFloat('abc'));
    assert.throws(() => convertFloat('1.2.3'));
    assert.throws(() => convertFloat('12,3,4'));
});

test('normalizeDate acepta formatos habituales y rechaza fechas imposibles', () => {
    assert.equal(normalizeDate('4/1/26'), '04/01/2026');
    assert.equal(normalizeDate('04-01-2026'), '04/01/2026');
    assert.equal(normalizeDate('2026-01-04'), '04/01/2026');
    assert.throws(() => normalizeDate('31/02/2026'), /no existe/);
    assert.throws(() => normalizeDate('enero 2026'), /día\/mes\/año/);
});

test('la plantilla CSV se lee sin errores', async () => {
    const csv = await readFile(new URL('../public/Facturas Subvención - Plantilla.csv', import.meta.url), 'utf8');
    const result = parseCsv(csv);
    assert.equal(result.generalError, null);
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.warnings, []);
    assert.equal(result.data.length, 4);
    assert.deepEqual(result.data[0], {
        number: '1',
        invoiceNumber: '2506109',
        date: '04/01/2026',
        datePay: '05/01/2026',
        activity: 'Curso Premonitores',
        concept: 'Fotocopias',
        providerNumber: 'B83409177 / SUR 4 COLORES SL',
        expense: 8.25,
        grantExpense: 8.25
    });
    assert.equal(result.data[1]!.datePay, '18/09/2026', 'Sin fecha de pago se usa la fecha de la factura');
});

test('la plantilla Excel produce las mismas facturas que la CSV', async () => {
    const csv = await readFile(new URL('../public/Facturas Subvención - Plantilla.csv', import.meta.url), 'utf8');
    const xlsx = await readFile(new URL('../public/Facturas Subvención - Plantilla.xlsx', import.meta.url));
    const rows = await readSpreadsheetRows(xlsx.buffer.slice(xlsx.byteOffset, xlsx.byteOffset + xlsx.byteLength) as ArrayBuffer);
    const fromExcel = parseInvoiceRows(rows, START, END, '01/10/2025', '30/09/2026');

    assert.deepEqual(fromExcel.errors, []);
    assert.deepEqual(fromExcel.data, parseCsv(csv).data);
});

test('acepta los títulos antiguos de columna (# y Número)', () => {
    const result = parseCsv('#;Número;Fecha;Actividad;Concepto;Total Factura;Gasto Justificable\n1;A1;10/10/2025;Ocio;Pan;10;10');
    assert.equal(result.generalError, null);
    assert.equal(result.data[0]?.invoiceNumber, 'A1');
});

test('explica qué columnas faltan', () => {
    const result = parseCsv('Nº orden;Fecha\n1;10/10/2025');
    assert.match(result.generalError ?? '', /«Nº factura»/);
    assert.match(result.generalError ?? '', /«Gasto Justificable»/);
});

test('detecta errores de negocio con la fila y un resumen para reconocerla', () => {
    const csv = [
        HEADER,
        '1;A1;10/10/2025;;Ocio;Pan;;10,00;12,00',
        '2;A2;10/10/2025;01/10/2025;Ocio;Leche;;10,00;10,00',
        '3;A3;10/10/2024;;Ocio;Café;;10,00;10,00',
        '1;A4;10/10/2025;;Ocio;Agua;;10,00;10,00',
        '5;A5;10/10/2025;;Ocio;Sal;;10,00;',
        '6;A6;10/10/2025;;Ocio;Té;;0;0',
        '7;A7;10/10/2025;;Ocio;"Fruta\nfresca";;8.25;8.25'
    ].join('\n');
    const result = parseCsv(csv);

    assert.equal(result.generalError, null);
    assert.deepEqual(result.data.map(f => f.number), ['5', '7']);
    assert.equal(result.data[1]?.concept, 'Fruta fresca');
    assert.equal(result.data[1]?.grantExpense, 8.25);

    const byLine = (line: number) => result.errors.filter(e => e.line === line).map(e => e.message).join(' | ');
    assert.match(byLine(2), /no puede ser mayor que el «Total Factura»/);
    assert.equal(result.errors.find(e => e.line === 2)?.context, 'Nº 1 · Pan · 12,00');
    assert.match(byLine(3), /«Fecha de pago».*anterior/);
    assert.match(byLine(4), /anterior al 01\/10\/2025/);
    assert.match(byLine(5), /ya se usa en la fila 2 para otra factura de 2025/);
    assert.equal(byLine(6), '');
    assert.equal(result.warnings[0]?.line, 6);
    assert.match(byLine(7), /mayor que 0/);
});

test('gasto justificable cero o vacío genera avisos sin descartar las facturas válidas', () => {
    const result = parseCsv([
        HEADER,
        '1;A1;10/10/2025;;Ocio;Pan;;10;0',
        '2;A2;10/10/2025;;Ocio;Leche;;20;',
        '3;A3;10/10/2025;;Ocio;Agua;;30;   ',
        '4;A4;10/10/2025;;Ocio;Fruta;;40;0,00 €',
        '5;A5;10/10/2025;;Ocio;Té;;50;25'
    ].join('\n'));

    assert.equal(result.generalError, null);
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.data.map(f => f.grantExpense), [0, 0, 0, 0, 25]);
    assert.deepEqual(result.warnings.map(w => w.line), [2, 3, 4, 5]);
    assert.equal(result.warnings[1]?.context, 'Nº 2 · Leche · 20');
    assert.match(result.warnings[0]!.message, /totalmente opcional/);

    const defaultInvoices = selectInvoicesForGeneration(result.data);
    const optionalInvoices = selectInvoicesForGeneration(result.data, true);
    assert.deepEqual(defaultInvoices.map(f => f.number), ['5']);
    assert.deepEqual(optionalInvoices.map(f => f.number), ['1', '2', '3', '4', '5']);
    assert.equal(defaultInvoices.reduce((sum, f) => sum + f.grantExpense!, 0), 25);
    assert.equal(optionalInvoices.reduce((sum, f) => sum + f.grantExpense!, 0), 25);
    assert.equal(result.data.length, 5, 'La selección no modifica las facturas leídas');
});

test('solo con facturas no justificables la inclusión sigue siendo opt-in', () => {
    const result = parseCsv(`${HEADER}\n1;A1;10/10/2025;;Ocio;Pan;;10;`);
    assert.deepEqual(selectInvoicesForGeneration(result.data), []);
    assert.equal(selectInvoicesForGeneration(result.data, true).length, 1);
    assert.deepEqual(selectInvoicesForGeneration(result.data, false), []);
});

test('gasto justificable negativo o inválido y total cero siguen siendo errores', () => {
    const result = parseCsv([
        HEADER,
        '1;A1;10/10/2025;;Ocio;Pan;;10;-1',
        '2;A2;10/10/2025;;Ocio;Leche;;20;abc',
        '3;A3;10/10/2025;;Ocio;Agua;;0;0',
        '4;A4;10/10/2025;;Ocio;Té;;10;1.2.3'
    ].join('\n'));
    assert.deepEqual(result.data, []);
    assert.deepEqual(result.warnings, [], 'No se ofrecen como opcionales filas con errores reales');
    assert.deepEqual(result.errors.map(e => e.line), [2, 3, 4, 5]);
    assert.match(result.errors[0]!.message, /igual o mayor que 0/);
    assert.match(result.errors[1]!.message, /importe válido/);
    assert.match(result.errors[2]!.message, /«Total Factura» debe ser mayor que 0/);
});

test('los avisos no impiden detectar números repetidos entre facturas justificables y opcionales', () => {
    const result = parseCsv([
        HEADER,
        '1;A1;10/10/2025;;Ocio;Pan;;10;0',
        '1;A2;10/10/2025;;Ocio;Leche;;20;10',
        '1;A3;10/10/2026;;Ocio;Agua;;30;10'
    ].join('\n'));
    assert.equal(result.data.length, 1);
    assert.equal(result.warnings.length, 1);
    assert.match(result.errors[0]!.message, /ya se usa en la fila 2/);
    assert.match(result.errors[1]!.message, /posterior/);
});

test('los avisos se devuelven vacíos ante errores generales del archivo', () => {
    for (const csv of ['', HEADER, 'Nº orden;Fecha\n1;10/10/2025']) {
        const result = parseCsv(csv);
        assert.ok(result.generalError);
        assert.deepEqual(result.warnings, []);
    }
});

test('tokenizeCsv detecta el separador y conserva la fila original', () => {
    const rows = tokenizeCsv('a,b,c\r\n"x, y","multi\nlínea",z\r\n\r\n1,2,3');
    assert.deepEqual(rows, [
        { line: 1, cells: ['a', 'b', 'c'] },
        { line: 2, cells: ['x, y', 'multi\nlínea', 'z'] },
        { line: 5, cells: ['1', '2', '3'] }
    ]);
});

test('permite repetir el Nº orden en años distintos y lo avisa', () => {
    const csv = [
        HEADER,
        '25;A1;31/10/25;;Gestión;Mantenimiento;;12,00;12,00',
        '26;A2;18/11/25;;Ocio;Material;;60,81;60,81',
        '25;B1;9/5/26;;Ocio;Hammas;;8,97;8,97',
        '25;B2;10/5/26;;Ocio;Otra;;1;1'
    ].join('\n');
    const result = parseCsv(csv);

    assert.deepEqual(result.data.map(f => [f.number, f.sharedNumber ?? false]), [['25', true], ['26', false], ['25', true]]);
    assert.deepEqual(result.sharedNumbers, [{ number: '25', rows: [{ line: 2, date: '31/10/2025' }, { line: 4, date: '09/05/2026' }] }]);
    assert.equal(result.errors.length, 1, 'Mismo número y mismo año sigue siendo un error');
    assert.match(result.errors[0]!.message, /ya se usa en la fila 4 para otra factura de 2026/);

    const [first, second, third] = result.data;
    assert.equal(getInvoiceKey(first!), '25-2025');
    assert.equal(getInvoiceKey(second!), '26');
    assert.equal(getExpectedInvoiceFileName(first!), 'factura25-025.pdf');
    assert.equal(getExpectedInvoiceFileName(second!), 'factura026.pdf');
    assert.equal(getExpectedInvoiceFileName(third!), 'factura26-025.pdf');

    // Nº repetido: solo con año, para no confundir 2025 y 2026
    assert.deepEqual(getAcceptedInvoiceFileNames(first!), ['factura25-025.pdf', '25-025.pdf', 'factura25-25.pdf', '25-25.pdf']);
    // Nº único: con o sin año
    assert.deepEqual(getAcceptedInvoiceFileNames(second!), ['factura25-026.pdf', '25-026.pdf', 'factura25-26.pdf', '25-26.pdf', 'factura026.pdf']);
    assert.equal(normalizeInvoiceFileName('Factura26_025.PDF'), 'factura26-025.pdf');
    assert.equal(normalizeInvoiceFileName('factura26 025.pdf'), 'factura26-025.pdf');
});
