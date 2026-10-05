import type { CellObject } from 'xlsx';
import type { SheetRow } from '~/utils/csvUtils';

type XlsxModule = typeof import('xlsx');

const pad2 = (value: number) => String(value).padStart(2, '0');

/**
 * Convierte una celda de Excel al mismo texto que tendría en un CSV español:
 * fechas como dd/MM/yyyy y números con coma decimal.
 */
const cellToText = (XLSX: XlsxModule, cell: CellObject): string => {
    if (cell.t === 'n' && typeof cell.v === 'number') {
        if (cell.z && XLSX.SSF.is_date(cell.z)) {
            // parse_date_code trabaja con el número de serie de Excel, sin zonas horarias
            const date = XLSX.SSF.parse_date_code(cell.v);
            return `${pad2(date.d)}/${pad2(date.m)}/${date.y}`;
        }
        // Evitar restos de coma flotante de fórmulas (0.30000000000000004)
        return String(Number(cell.v.toFixed(10))).replace('.', ',');
    }
    if (cell.t === 'd' && cell.v instanceof Date) {
        return `${pad2(cell.v.getDate())}/${pad2(cell.v.getMonth() + 1)}/${cell.v.getFullYear()}`;
    }
    if (cell.t === 'e' || cell.t === 'z') return '';
    return String(cell.v ?? '');
};

/**
 * Lee la primera hoja de un archivo Excel (.xlsx, .xls, .ods) y devuelve sus filas
 * con el número de fila que ve el usuario en Excel.
 * SheetJS se carga solo cuando hace falta para no penalizar la carga inicial.
 */
export async function readSpreadsheetRows(buffer: ArrayBuffer): Promise<SheetRow[]> {
    const XLSX = await import('xlsx');

    let workbook;
    try {
        workbook = XLSX.read(buffer, { type: 'array', cellNF: true });
    } catch (err) {
        console.error('Error leyendo el archivo Excel:', err);
        throw new Error('No hemos podido abrir el Excel. Comprueba que se abre bien en tu ordenador y que no tiene contraseña.', { cause: err });
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
    if (!sheet || !sheet['!ref']) return [];

    const range = XLSX.utils.decode_range(sheet['!ref']);
    const rows: SheetRow[] = [];

    for (let r = range.s.r; r <= range.e.r; r++) {
        const cells: string[] = [];
        for (let c = range.s.c; c <= range.e.c; c++) {
            const cell = sheet[XLSX.utils.encode_cell({ r, c })] as CellObject | undefined;
            cells.push(cell ? cellToText(XLSX, cell) : '');
        }
        if (cells.some(value => value.trim() !== '')) rows.push({ line: r + 1, cells });
    }

    return rows;
}
