import type { Factura } from '~/types';
import { parse, getTime, isValid } from 'date-fns';

/**
 * Limpia el texto de caracteres problemáticos incluyendo:
 * - Caracteres de control Unicode (U+0000 a U+001F, U+007F a U+009F)
 * - Zero-width characters (U+200B a U+200F)
 * - Direccionales Unicode (LTR, RTL marks, etc.) (U+202A a U+202E)
 * - Otros caracteres invisibles problemáticos
 * - BOM (Byte Order Mark)
 * @param text El texto a limpiar
 * @returns El texto limpiado
 */
export function cleanText(text: string): string {
    if (!text) return text;

    // eslint-disable-next-line no-control-regex
    const cleaned = text.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, '');

    return cleaned.trim();
}

/**
 * Limpia el valor de una celda. Los saltos de línea dentro de una celda se
 * convierten en espacios para no pegar palabras.
 */
const cleanCell = (value: string): string => cleanText(value.replace(/\s*[\r\n]+\s*/g, ' '));

type ColumnKind = 'order' | 'text' | 'date' | 'amount';

/**
 * Definición de cada columna de la plantilla (Excel o CSV).
 */
interface ColumnOptions {
    name: keyof Factura;
    headerName: string; // Título que aparece en la plantilla
    aliases?: string[]; // Otros títulos aceptados (por ejemplo, de plantillas antiguas)
    kind: ColumnKind;
    required?: boolean;
}

/**
 * Definición de las columnas esperadas en la plantilla.
 */
export const csvColumns: ColumnOptions[] = [
    { name: 'number', headerName: 'Nº orden', aliases: ['#', 'orden', 'n orden', 'no orden', 'numero de orden', 'numero orden'], kind: 'order', required: true },
    { name: 'invoiceNumber', headerName: 'Nº factura', aliases: ['numero', 'n factura', 'no factura', 'numero de factura', 'numero factura'], kind: 'text', required: true },
    { name: 'date', headerName: 'Fecha', aliases: ['fecha factura', 'fecha de factura'], kind: 'date', required: true },
    { name: 'datePay', headerName: 'Fecha de pago', aliases: ['fecha pago'], kind: 'date' },
    { name: 'activity', headerName: 'Actividad', kind: 'text', required: true },
    { name: 'concept', headerName: 'Concepto', kind: 'text', required: true },
    { name: 'providerNumber', headerName: 'Proveedor', kind: 'text' },
    { name: 'expense', headerName: 'Total Factura', kind: 'amount', required: true },
    { name: 'grantExpense', headerName: 'Gasto Justificable', kind: 'amount', required: true }
];

/**
 * Normaliza un título de columna para compararlo sin depender de mayúsculas,
 * tildes, espacios o el símbolo º ("Nº factura", "N° Factura" y "nº  factura" son iguales).
 */
export function normalizeHeader(header: string): string {
    return cleanCell(header)
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[º°ª.:]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Devuelve la columna de la plantilla que corresponde a un título, si existe.
 */
export function findColumn(header: string): ColumnOptions | undefined {
    const normalized = normalizeHeader(header);
    return csvColumns.find(col =>
        normalizeHeader(col.headerName) === normalized ||
        col.aliases?.some(alias => normalizeHeader(alias) === normalized)
    );
}

/**
 * Fila leída de un archivo (CSV o Excel) junto con su número de fila original,
 * para poder decir al usuario exactamente dónde está cada error.
 */
export interface SheetRow {
    line: number;
    cells: string[];
}

export interface RowError {
    line: number;
    message: string;
    context?: string; // Resumen de la fila para reconocerla (Nº orden, concepto, importe)
}

/**
 * Resultados del parseo, incluyendo datos válidos y errores.
 */
/**
 * Nº orden que se repite en facturas de años distintos. Se acepta, pero se
 * avisa al usuario por si es un error.
 */
export interface SharedOrderNumber {
    number: string;
    rows: { line: number; date: string }[];
}

export interface CsvParseResult {
    data: Factura[];
    errors: RowError[];
    warnings: RowError[];
    generalError: string | null;
    sharedNumbers: SharedOrderNumber[];
}

/**
 * Detecta el separador más probable del CSV contando las apariciones de cada
 * separador común en la primera línea (fuera de comillas).
 */
export function detectCsvSeparator(csvString: string): string {
    const possibleSeparators = [';', ',', '\t', '|'];
    const counts = new Map(possibleSeparators.map(sep => [sep, 0]));
    let inQuotes = false;

    for (const char of csvString) {
        if (char === '"') inQuotes = !inQuotes;
        else if (char === '\n' && !inQuotes) break;
        else if (!inQuotes && counts.has(char)) counts.set(char, counts.get(char)! + 1);
    }

    let best = ';';
    for (const sep of possibleSeparators) {
        if (counts.get(sep)! > counts.get(best)!) best = sep;
    }
    return best;
}

/**
 * Divide el contenido CSV en filas y celdas. Admite comillas, comillas escapadas
 * ("") y saltos de línea dentro de una celda entrecomillada.
 */
export function tokenizeCsv(content: string): SheetRow[] {
    const text = content.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    const separator = detectCsvSeparator(text);
    const rows: SheetRow[] = [];
    let cells: string[] = [];
    let field = '';
    let inQuotes = false;
    let line = 1;
    let rowStart = 1;

    for (let i = 0; i < text.length; i++) {
        const char = text[i]!;

        if (inQuotes) {
            if (char === '"') {
                if (text[i + 1] === '"') { field += '"'; i++; }
                else inQuotes = false;
            } else {
                if (char === '\n') line++;
                field += char;
            }
            continue;
        }

        if (char === '"' && field.trim() === '') {
            field = '';
            inQuotes = true;
        } else if (char === separator) {
            cells.push(field);
            field = '';
        } else if (char === '\n') {
            cells.push(field);
            rows.push({ line: rowStart, cells });
            cells = [];
            field = '';
            line++;
            rowStart = line;
        } else {
            field += char;
        }
    }

    if (field !== '' || cells.length > 0) {
        cells.push(field);
        rows.push({ line: rowStart, cells });
    }

    return rows.filter(row => row.cells.some(cell => cleanCell(cell) !== ''));
}

/**
 * Convierte un importe escrito a mano a número. Acepta formato español
 * ("1.234,56 €", "8,25") y también el inglés ("1,234.56", "8.25"), que es
 * habitual cuando el ordenador tiene Excel configurado en inglés.
 *
 * Un único punto seguido de exactamente tres cifras ("1.234") se interpreta
 * como separador de miles, que es lo habitual en España.
 *
 * @returns El número, o undefined si el texto está vacío.
 * @throws Error si el texto no es un importe reconocible.
 */
export function convertFloat(input: string): number | undefined {
    let text = input.replace(/€|eur(os)?/gi, '').replace(/[\s\u00A0]/g, '');
    if (text === '') return undefined;

    let sign = 1;
    if (text.startsWith('-')) {
        sign = -1;
        text = text.slice(1);
    }

    const invalid = () => new Error(`«${input.trim()}» no es un importe válido`);
    if (!/^[\d.,]+$/.test(text) || !/\d/.test(text)) throw invalid();

    const dots = text.split('.').length - 1;
    const commas = text.split(',').length - 1;

    let decimalSep: '.' | ',' | null = null;
    if (dots > 0 && commas > 0) decimalSep = text.lastIndexOf('.') > text.lastIndexOf(',') ? '.' : ',';
    else if (commas === 1) decimalSep = ',';
    else if (dots === 1 && !/\.\d{3}$/.test(text)) decimalSep = '.';

    const thousandsSep = decimalSep ? (decimalSep === '.' ? ',' : '.') : (commas > 0 ? ',' : '.');

    let integerPart = text;
    let decimalPart = '';
    if (decimalSep) {
        const index = text.lastIndexOf(decimalSep);
        integerPart = text.slice(0, index);
        decimalPart = text.slice(index + 1);
    }

    if (!/^\d*$/.test(decimalPart)) throw invalid();
    if (integerPart.includes(thousandsSep)) {
        const groupsPattern = new RegExp(`^\\d{1,3}(?:\\${thousandsSep}\\d{3})+$`);
        if (!groupsPattern.test(integerPart)) throw invalid();
        integerPart = integerPart.split(thousandsSep).join('');
    } else if (!/^\d*$/.test(integerPart)) {
        throw invalid();
    }

    if (integerPart === '' && decimalPart === '') throw invalid();
    return sign * Number(`${integerPart || '0'}.${decimalPart || '0'}`);
}

const pad2 = (value: string | number) => String(value).padStart(2, '0');

/**
 * Convierte una fecha escrita como día/mes/año (también con - o .) o como
 * año-mes-día a texto dd/MM/yyyy.
 * @throws Error con un mensaje comprensible si no es una fecha válida.
 */
export function normalizeDate(input: string): string {
    const text = input.trim();
    let day: string | undefined;
    let month: string | undefined;
    let year: string | undefined;

    const spanish = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/.exec(text);
    const iso = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/.exec(text);
    if (spanish) [, day, month, year] = spanish;
    else if (iso) [, year, month, day] = iso;
    else throw new Error(`«${text}» no es una fecha válida. Escríbela como día/mes/año, por ejemplo 15/01/2026`);

    const formatted = `${pad2(day!)}/${pad2(month!)}/${year!.length === 2 ? `20${year}` : year}`;
    if (!isValid(parse(formatted, 'dd/MM/yyyy', new Date()))) {
        throw new Error(`La fecha «${text}» no existe en el calendario`);
    }
    return formatted;
}

const toTimestamp = (date: string) => getTime(parse(date, 'dd/MM/yyyy', new Date()));

const euroFormatter = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

/**
 * Valida y convierte las filas leídas (cabecera + datos) en facturas.
 * Comprueba columnas, formatos, rango de fechas, importes y números de orden repetidos.
 */
export const parseInvoiceRows = (
    rows: SheetRow[],
    startDateTimestamp: number,
    endDateTimestamp: number,
    configStartDateString: string,
    configEndDateString: string
): CsvParseResult => {
    const data: Factura[] = [];
    const errors: RowError[] = [];
    const warnings: RowError[] = [];

    const [headerRow, ...bodyRows] = rows;
    if (!headerRow) {
        return { data, errors, warnings, generalError: 'El archivo está vacío.', sharedNumbers: [] };
    }

    // Mapear cada columna de la plantilla a su posición real en el archivo
    const columnIndexMap = new Map<keyof Factura, number>();
    headerRow.cells.forEach((header, index) => {
        const column = findColumn(header);
        if (column && !columnIndexMap.has(column.name)) columnIndexMap.set(column.name, index);
    });

    const missingHeaders = csvColumns
        .filter(col => col.required && !columnIndexMap.has(col.name))
        .map(col => `«${col.headerName}»`);

    if (missingHeaders.length > 0) {
        const plural = missingHeaders.length > 1;
        return {
            data,
            errors,
            warnings,
            sharedNumbers: [],
            generalError: `${plural ? 'Faltan las columnas' : 'Falta la columna'} ${missingHeaders.join(', ')} en la primera fila. Usa la plantilla sin cambiar los títulos de las columnas.`
        };
    }

    if (bodyRows.length === 0) {
        return { data, errors, warnings, generalError: 'El archivo solo tiene la fila de títulos. Añade una fila por cada factura.', sharedNumbers: [] };
    }

    // Nº orden -> filas donde aparece, con el año de la factura (puede repetirse solo en años distintos)
    const seenOrders = new Map<string, { line: number; year?: string }[]>();
    const validRowsByOrder = new Map<string, { line: number; date: string; factura: Factura }[]>();

    for (const row of bodyRows) {
        const getValue = (name: keyof Factura) => {
            const index = columnIndexMap.get(name);
            return index === undefined ? '' : cleanCell(row.cells[index] ?? '');
        };

        const rawTotal = getValue('grantExpense') || getValue('expense');
        const context = [
            getValue('number') && `Nº ${getValue('number')}`,
            getValue('concept'),
            rawTotal
        ].filter(Boolean).join(' · ');

        const factura: Partial<Factura> = {};
        const rowErrors: string[] = [];

        for (const column of csvColumns) {
            const rawValue = getValue(column.name);
            const label = `«${column.headerName}»`;

            if (!rawValue) {
                if (column.name === 'grantExpense') factura.grantExpense = 0;
                else if (column.required) rowErrors.push(`Falta ${label}.`);
                continue;
            }

            switch (column.kind) {
                case 'order':
                    if (!/^\d+$/.test(rawValue) || Number(rawValue) === 0) {
                        rowErrors.push(`${label} debe ser un número entero (1, 2, 3...) y aquí pone «${rawValue}».`);
                    } else {
                        factura.number = String(Number(rawValue));
                    }
                    break;
                case 'text':
                    if (column.name === 'invoiceNumber' || column.name === 'activity' || column.name === 'concept' || column.name === 'providerNumber') {
                        factura[column.name] = rawValue;
                    }
                    break;
                case 'date':
                    try {
                        const date = normalizeDate(rawValue);
                        const timestamp = toTimestamp(date);
                        if (timestamp < startDateTimestamp) {
                            rowErrors.push(`${label}: ${date} es anterior al ${configStartDateString}, el primer día válido de la convocatoria.`);
                        } else if (timestamp > endDateTimestamp) {
                            rowErrors.push(`${label}: ${date} es posterior al ${configEndDateString}, el último día válido de la convocatoria.`);
                        } else if (column.name === 'date' || column.name === 'datePay') {
                            factura[column.name] = date;
                        }
                    } catch (err) {
                        rowErrors.push(`${label}: ${err instanceof Error ? err.message : 'fecha no válida'}.`);
                    }
                    break;
                case 'amount':
                    try {
                        const amount = column.name === 'grantExpense' ? (convertFloat(rawValue) ?? 0) : convertFloat(rawValue);
                        if (amount === undefined || amount < 0 || (amount === 0 && column.name !== 'grantExpense')) {
                            rowErrors.push(`${label} debe ser ${column.name === 'grantExpense' ? 'igual o mayor' : 'mayor'} que 0 y aquí pone «${rawValue}».`);
                        } else if (column.name === 'expense' || column.name === 'grantExpense') {
                            factura[column.name] = amount;
                        }
                    } catch (err) {
                        rowErrors.push(`${label}: ${err instanceof Error ? err.message : 'importe no válido'}. Escríbelo como 123,45.`);
                    }
                    break;
            }
        }

        // Comprobaciones entre columnas
        if (factura.expense !== undefined && factura.grantExpense !== undefined && factura.grantExpense > factura.expense + 0.005) {
            rowErrors.push(`El «Gasto Justificable» (${euroFormatter.format(factura.grantExpense)}) no puede ser mayor que el «Total Factura» (${euroFormatter.format(factura.expense)}).`);
        }
        if (factura.date && factura.datePay && toTimestamp(factura.datePay) < toTimestamp(factura.date)) {
            rowErrors.push(`La «Fecha de pago» (${factura.datePay}) es anterior a la «Fecha» de la factura (${factura.date}).`);
        }
        if (factura.number) {
            const year = factura.date?.slice(6);
            const previous = seenOrders.get(factura.number) ?? [];
            // Sin fecha válida no se puede saber el año: se trata como repetido
            const clash = previous.find(p => !year || !p.year || p.year === year);
            if (clash) {
                rowErrors.push(year && clash.year
                    ? `El «Nº orden» ${factura.number} ya se usa en la fila ${clash.line} para otra factura de ${year}. Solo se puede repetir si las facturas son de años distintos.`
                    : `El «Nº orden» ${factura.number} ya se usa en la fila ${clash.line}. Cada factura necesita un número distinto.`);
            } else {
                previous.push({ line: row.line, year });
                seenOrders.set(factura.number, previous);
            }
        }

        if (rowErrors.length > 0) {
            rowErrors.forEach(message => errors.push({ line: row.line, message, context }));
            continue;
        }

        if (factura.grantExpense === 0) {
            warnings.push({
                line: row.line,
                message: 'El «Gasto Justificable» es 0 o está vacío. Esta factura no justifica la subvención y su inclusión es totalmente opcional.',
                context
            });
        }

        // Si no hay fecha de pago, se usa la fecha de la factura
        if (!factura.datePay) factura.datePay = factura.date;
        data.push(factura as Factura);
        const sameNumber = validRowsByOrder.get(factura.number!) ?? [];
        sameNumber.push({ line: row.line, date: factura.date!, factura: factura as Factura });
        validRowsByOrder.set(factura.number!, sameNumber);
    }

    const sharedNumbers: SharedOrderNumber[] = [];
    for (const [number, entries] of validRowsByOrder) {
        if (entries.length < 2) continue;
        entries.forEach(entry => { entry.factura.sharedNumber = true; });
        sharedNumbers.push({ number, rows: entries.map(({ line, date }) => ({ line, date })) });
    }

    return { data, errors, warnings, generalError: null, sharedNumbers };
};

/** Solo se incluyen facturas no justificables si el usuario lo elige expresamente. */
export const selectInvoicesForGeneration = (invoices: Factura[], includeNonJustifiable = false): Factura[] =>
    invoices.filter(invoice => includeNonJustifiable || (invoice.grantExpense ?? 0) > 0);

/**
 * Parsea un string CSV a un array de objetos Factura.
 * Valida columnas, tipos y el rango de fechas.
 */
export const parseCsvContent = (
    csvString: string,
    startDateTimestamp: number,
    endDateTimestamp: number,
    configStartDateString: string,
    configEndDateString: string
): CsvParseResult => parseInvoiceRows(
    tokenizeCsv(csvString),
    startDateTimestamp,
    endDateTimestamp,
    configStartDateString,
    configEndDateString
);
