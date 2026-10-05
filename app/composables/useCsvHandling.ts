import { ref } from 'vue';
import type { Factura } from '~/types';
import { parseInvoiceRows, tokenizeCsv, type RowError, type SharedOrderNumber, type SheetRow } from '~/utils/csvUtils';

const SPREADSHEET_EXTENSIONS = /\.(xlsx|xlsm|xls|ods)$/i;
const CSV_EXTENSIONS = /\.(csv|txt)$/i;

/** Valor del atributo `accept` del selector de archivo de facturas. */
export const acceptedInvoiceFileTypes = '.xlsx,.xls,.ods,.csv,text/csv';

/**
 * Excel en español suele exportar CSV como Windows-1252 (por ejemplo, el
 * símbolo €). Intenta primero UTF-8 y, si no es válido, usa la codificación
 * habitual de Windows.
 */
const decodeCsv = (buffer: ArrayBuffer): string => {
    try {
        return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch {
        return new TextDecoder('windows-1252').decode(buffer);
    }
};

/**
 * Carga y valida el archivo de facturas, en Excel o CSV.
 * @param onReset Se llama cada vez que se carga un archivo nuevo, para limpiar
 * los pasos que dependen de él (carpeta de facturas y documentos generados).
 */
export function useCsvHandling(
    startDateTimestamp: number,
    endDateTimestamp: number,
    configStartDateString: string,
    configEndDateString: string,
    onReset?: () => void
) {
    const csvFile = ref<File | null>(null);
    const csvData = ref<Factura[]>([]);
    const parsingError = ref<string | null>(null);
    const parsingRowErrors = ref<RowError[]>([]);
    const sharedNumbers = ref<SharedOrderNumber[]>([]);
    const isReadingFile = ref(false);

    const resetCsvState = () => {
        csvFile.value = null;
        csvData.value = [];
        parsingError.value = null;
        parsingRowErrors.value = [];
        sharedNumbers.value = [];
        onReset?.();
    };

    const readRows = async (file: File, buffer: ArrayBuffer): Promise<SheetRow[]> => {
        if (SPREADSHEET_EXTENSIONS.test(file.name)) {
            const { readSpreadsheetRows } = await import('~/utils/spreadsheetUtils');
            return readSpreadsheetRows(buffer);
        }
        if (CSV_EXTENSIONS.test(file.name) || file.type === 'text/csv') {
            return tokenizeCsv(decodeCsv(buffer));
        }
        throw new Error(`«${file.name}» no es un archivo de facturas compatible. Sube la plantilla en Excel (.xlsx) o en CSV.`);
    };

    /**
     * Lee y valida un archivo de facturas.
     */
    const loadFile = async (file: File) => {
        resetCsvState();
        csvFile.value = file;
        isReadingFile.value = true;

        try {
            const rows = await readRows(file, await file.arrayBuffer());
            const parseResult = parseInvoiceRows(
                rows,
                startDateTimestamp,
                endDateTimestamp,
                configStartDateString,
                configEndDateString
            );

            csvData.value = parseResult.data;
            parsingRowErrors.value = parseResult.errors;
            parsingError.value = parseResult.generalError;
            sharedNumbers.value = parseResult.sharedNumbers;
        } catch (err: unknown) {
            console.error('Error procesando el archivo de facturas:', err);
            csvData.value = [];
            parsingRowErrors.value = [];
            sharedNumbers.value = [];
            parsingError.value = err instanceof Error ? err.message : 'No se pudo leer el archivo.';
        } finally {
            isReadingFile.value = false;
        }
    };

    /**
     * Maneja el cambio del input de archivo. Vacía el input después de leerlo
     * para que volver a elegir el mismo archivo (ya corregido) lo lea de nuevo.
     */
    const handleFileChange = (event: Event) => {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        input.value = '';
        if (file) void loadFile(file);
    };

    return {
        csvFile,
        csvData,
        parsingError,
        parsingRowErrors,
        sharedNumbers,
        isReadingFile,
        handleFileChange,
        loadFile
    };
}
