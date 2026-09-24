import { ref } from 'vue';
import type { Factura } from '~/types';
import { parseCsvContent } from '~/utils/csvUtils';

// Añadir tipo Ref para claridad
import type { Ref } from 'vue';

export function useCsvHandling(
    startDateTimestamp: number,
    endDateTimestamp: number,
    configStartDateString: string,
    configEndDateString: string
) {
    // --- Estado Carga CSV ---
    const csvFile = ref<File | null>(null);
    const csvData = ref<Factura[]>([]);
    const parsingError = ref<string | null>(null);
    const parsingRowErrors = ref<{ line: number; message: string }[]>([]);

    // --- Refs dependientes (para resetear) ---
    // Estos se pasarán como argumentos desde donde se use el composable
    const invoiceFolderHandle = ref<FileSystemDirectoryHandle | null>(null);
    const foundInvoicePdfs = ref<Map<string, File>>(new Map());
    const missingInvoiceNumbers = ref<string[]>([]);
    const csvMergedPdfUrl = ref<string | null>(null);
    const csvMergeError = ref<string | null>(null);
    const generationResults = ref<{ name: string; url: string }[]>([]);
    const generationError = ref<string | null>(null);

    /**
     * Resetea todos los estados relacionados con una carga previa.
     */
    const resetCsvState = () => {
        csvFile.value = null;
        csvData.value = [];
        parsingError.value = null;
        parsingRowErrors.value = [];
        // Resetear estados dependientes (manejados externamente pero reseteados aquí)
        invoiceFolderHandle.value = null;
        foundInvoicePdfs.value.clear();
        missingInvoiceNumbers.value = [];
        csvMergedPdfUrl.value = null;
        csvMergeError.value = null;
        generationResults.value = [];
        generationError.value = null;
        if (csvMergedPdfUrl.value) {
            URL.revokeObjectURL(csvMergedPdfUrl.value);
            csvMergedPdfUrl.value = null;
        }
        generationResults.value.forEach(r => URL.revokeObjectURL(r.url));
        generationResults.value = [];

    };

    /**
     * Maneja la selección y parseo del archivo CSV.
     */
    const handleFileChange = (event: Event) => {
        const target = event.target as HTMLInputElement;
        resetCsvState(); // Limpiar estado anterior

        if (target.files && target.files[0]) {
            const file = target.files[0];
            csvFile.value = file;
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const buffer = e.target?.result as ArrayBuffer | null;
                    if (!buffer) throw new Error("No se pudo leer el contenido.");

                    // Excel en español suele exportar CSV como Windows-1252 (por
                    // ejemplo, el símbolo €). Intenta primero UTF-8 y, si no es
                    // válido, usa la codificación habitual de Windows.
                    let content: string;
                    try {
                        content = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
                    } catch {
                        content = new TextDecoder('windows-1252').decode(buffer);
                    }

                    const parseResult = parseCsvContent(
                        content,
                        startDateTimestamp,
                        endDateTimestamp,
                        configStartDateString,
                        configEndDateString
                    );

                    csvData.value = parseResult.data;
                    parsingRowErrors.value = parseResult.errors;
                    parsingError.value = parseResult.generalError;

                    if (csvData.value.length === 0 && !parsingError.value) {
                        parsingError.value = "CSV vacío o sin datos válidos después del filtrado.";
                    }

                } catch (err: unknown) {
                    console.error("Error procesando CSV:", err);
                    parsingError.value = `Error al procesar CSV: ${(err instanceof Error) ? err.message : "Desconocido"}`;
                    resetCsvState(); // Asegurar limpieza completa en caso de error
                }
            };

            reader.onerror = () => {
                parsingError.value = "No se pudo leer el archivo CSV.";
                resetCsvState();
            };

            reader.readAsArrayBuffer(file);
        } else {
            resetCsvState(); // Si no se selecciona archivo, limpiar
        }
    };

    return {
        csvFile,
        csvData,
        parsingError,
        parsingRowErrors,
        handleFileChange,
        // Funciones/refs para resetear dependencias
        setInvoiceFolderHandleRef: (ref: Ref<FileSystemDirectoryHandle | null>) => { invoiceFolderHandle.value = ref.value; },
        setFoundInvoicePdfsRef: (ref: Ref<Map<string, File>>) => { foundInvoicePdfs.value = ref.value; },
        setMissingInvoiceNumbersRef: (ref: Ref<string[]>) => { missingInvoiceNumbers.value = ref.value; },
        setCsvMergedPdfUrlRef: (ref: Ref<string | null>) => { csvMergedPdfUrl.value = ref.value; },
        setCsvMergeErrorRef: (ref: Ref<string | null>) => { csvMergeError.value = ref.value; },
        setGenerationResultsRef: (ref: Ref<{ name: string; url: string }[]>) => { generationResults.value = ref.value; },
        setGenerationErrorRef: (ref: Ref<string | null>) => { generationError.value = ref.value; }
    };
} 
