import { ref } from 'vue';
import type { Ref } from 'vue';
import type { Factura } from '~/types';
import { formatInvoiceNumber } from '~/utils/fileUtils';

export function useInvoiceFolder(csvData: Ref<Factura[]>) {
    // --- Estado Selección Carpeta ---
    const invoiceFolderHandle = ref<FileSystemDirectoryHandle | null>(null);
    const foundInvoicePdfs = ref<Map<string, File>>(new Map()); // Clave: factura.number (original), Valor: File
    const missingInvoiceNumbers = ref<string[]>([]);
    const isProcessingFolder = ref(false); // Feedback visual mientras se buscan archivos
    const searchError = ref<string | null>(null); // Error específico de la búsqueda/acceso a carpeta

    /**
     * Resetea el estado de la carpeta de facturas.
     */
    const resetFolderState = () => {
        invoiceFolderHandle.value = null;
        foundInvoicePdfs.value.clear();
        missingInvoiceNumbers.value = [];
        isProcessingFolder.value = false;
        searchError.value = null;
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

            // Crear mapa de nombres esperados (formato facturaNNN.pdf) a número original
            const expectedFiles = new Map<string, string>();
            csvData.value.forEach(factura => {
                const formattedNum = formatInvoiceNumber(factura.number);
                if (formattedNum !== 'invalid' && factura.number) {
                    expectedFiles.set(`factura${formattedNum}.pdf`, factura.number);
                }
            });

            if (expectedFiles.size === 0) {
                searchError.value = "No se encontraron números de factura válidos en el CSV para buscar.";
                isProcessingFolder.value = false;
                return;
            }

            const foundMap = new Map<string, File>();
            const tempMissing: string[] = Array.from(expectedFiles.values()); // Todos empiezan como faltantes

            // Iterar sobre los archivos de la carpeta seleccionada
            for await (const entry of handle.values()) {
                if (entry.kind === 'file') {
                    const entryNameLower = entry.name.toLowerCase();
                    if (expectedFiles.has(entryNameLower)) {
                        const originalNumber = expectedFiles.get(entryNameLower)!;
                        try {
                            const file = await entry.getFile();
                            foundMap.set(originalNumber, file); // Usar número original como clave
                            // Quitar de faltantes
                            const missingIndex = tempMissing.indexOf(originalNumber);
                            if (missingIndex > -1) {
                                tempMissing.splice(missingIndex, 1);
                            }
                            console.log(`Factura encontrada: ${entry.name} (Num: ${originalNumber})`);
                        } catch (fileError) {
                            console.warn(`No se pudo acceder al archivo ${entry.name}:`, fileError);
                            searchError.value = `Error al leer ${entry.name}. Verifica los permisos.`;
                            // Si falla la lectura, asegurarnos que siga en la lista de faltantes
                            if (!tempMissing.includes(originalNumber)) {
                                tempMissing.push(originalNumber);
                            }
                        }
                    }
                }
            }

            foundInvoicePdfs.value = foundMap;
            missingInvoiceNumbers.value = tempMissing;

            // Mensajes informativos (no bloqueantes)
            if (foundMap.size === 0) {
                searchError.value = 'No se encontró ninguna factura PDF con el formato esperado (facturaNNN.pdf) en la carpeta.';
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
        selectAndFindInvoicePdfs,
        resetFolderState // Exponer para resetear desde fuera si es necesario
    };
} 