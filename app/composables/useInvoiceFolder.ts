import { ref } from 'vue';
import type { Ref } from 'vue';
import type { Factura } from '~/types';
import { getAcceptedInvoiceFileNames, getExpectedInvoiceFileName, getInvoiceKey, normalizeInvoiceFileName } from '~/utils/fileUtils';

export function useInvoiceFolder(csvData: Ref<Factura[]>) {
    // --- Estado Selección Carpeta ---
    const invoiceFolderHandle = ref<FileSystemDirectoryHandle | null>(null);
    const foundInvoicePdfs = ref<Map<string, File>>(new Map()); // Clave: getInvoiceKey(factura), Valor: File
    const missingInvoiceNumbers = ref<string[]>([]); // Nombres de archivo esperados que no se encontraron
    const isProcessingFolder = ref(false); // Feedback visual mientras se buscan archivos
    const searchError = ref<string | null>(null); // Error específico de la búsqueda/acceso a carpeta
    const unreadableFiles = ref<string[]>([]); // Facturas encontradas que no se pudieron leer

    /**
     * Resetea el estado de la carpeta de facturas.
     */
    const resetFolderState = () => {
        invoiceFolderHandle.value = null;
        foundInvoicePdfs.value = new Map();
        missingInvoiceNumbers.value = [];
        isProcessingFolder.value = false;
        searchError.value = null;
        unreadableFiles.value = [];
    };

    /**
     * Abre el selector de directorio y busca los archivos PDF de las facturas
     * basándose en los números de factura presentes en `csvData`.
     */
    const selectAndFindInvoicePdfs = async () => {
        if (!('showDirectoryPicker' in window) || typeof window.showDirectoryPicker !== 'function') {
            searchError.value = 'Tu navegador no soporta la selección de carpetas. Prueba con Chrome, Edge o un navegador compatible.';
            return;
        }
        if (!csvData.value || csvData.value.length === 0) {
            searchError.value = 'Carga primero un archivo CSV válido.';
            return;
        }

        resetFolderState(); // Limpiar estado anterior antes de empezar
        isProcessingFolder.value = true;

        try {
            const handle = await window.showDirectoryPicker();
            invoiceFolderHandle.value = handle; // Guardar el handle

            // Nombres aceptados (facturaNNN.pdf, facturaAA-NNN.pdf...) -> clave de la factura,
            // y clave -> nombre recomendado para avisar de las que falten
            const expectedFiles = new Map<string, string>();
            const recommendedNames = new Map<string, string>();
            csvData.value.forEach(factura => {
                const key = getInvoiceKey(factura);
                const recommended = getExpectedInvoiceFileName(factura);
                if (recommended) recommendedNames.set(key, recommended);
                getAcceptedInvoiceFileNames(factura).forEach(name => expectedFiles.set(name, key));
            });

            if (expectedFiles.size === 0) {
                searchError.value = "No se encontraron números de factura válidos en el CSV para buscar.";
                isProcessingFolder.value = false;
                return;
            }

            const foundMap = new Map<string, File>();
            const tempUnreadable: string[] = [];
            const tempMissing: string[] = Array.from(recommendedNames.keys()); // Claves; todas empiezan como faltantes

            // Iterar sobre los archivos de la carpeta seleccionada
            for await (const entry of handle.values()) {
                if (entry.kind !== 'file') continue;
                const expectedName = normalizeInvoiceFileName(entry.name);
                const invoiceKey = expectedFiles.get(expectedName);
                if (!invoiceKey) continue;

                try {
                    const file = await entry.getFile();
                    foundMap.set(invoiceKey, file);
                    const missingIndex = tempMissing.indexOf(invoiceKey);
                    if (missingIndex > -1) tempMissing.splice(missingIndex, 1);
                    console.log(`Factura encontrada: ${entry.name} (${invoiceKey})`);
                } catch (fileError) {
                    console.warn(`No se pudo acceder al archivo ${entry.name}:`, fileError);
                    tempUnreadable.push(entry.name);
                }
            }

            foundInvoicePdfs.value = foundMap;
            missingInvoiceNumbers.value = tempMissing.map(key => recommendedNames.get(key)!);
            unreadableFiles.value = tempUnreadable;

            // Mensajes informativos (no bloqueantes)
            if (foundMap.size === 0) {
                searchError.value = 'No hemos encontrado ninguna factura en esa carpeta. Los PDF deben llamarse facturaNNN.pdf (por ejemplo factura001.pdf).';
            } else if (tempMissing.length > 0) {
                console.warn(`Facturas del CSV no encontradas en la carpeta: ${tempMissing.join(', ')}`);
                // Podríamos poner un mensaje informativo en lugar de searchError
                // searchError.value = `Se encontraron ${foundMap.size} facturas, pero faltan: ${tempMissing.join(', ')}`;
            }

        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'AbortError') {
                console.log('Selección de carpeta cancelada por el usuario.');
                // No establecer error si es cancelación voluntaria
                invoiceFolderHandle.value = null; // Asegurar que no quede handle si cancela
            } else if (err instanceof Error && err.name === 'NotAllowedError') {
                searchError.value = 'Permiso denegado para acceder a la carpeta seleccionada.';
                invoiceFolderHandle.value = null;
            } else {
                searchError.value = `Error al procesar la carpeta: ${(err instanceof Error) ? err.message : 'Desconocido'}`;
                invoiceFolderHandle.value = null;
                console.error("Error en selectAndFindInvoicePdfs:", err);
            }
        } finally {
            isProcessingFolder.value = false;
        }
    };

    return {
        invoiceFolderHandle,
        foundInvoicePdfs,
        missingInvoiceNumbers,
        isProcessingFolder,
        searchError,
        unreadableFiles,
        selectAndFindInvoicePdfs,
        resetFolderState // Exponer para resetear desde fuera si es necesario
    };
} 