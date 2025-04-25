import type { PDFDocument } from 'pdf-lib';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';

/**
 * Formatea un número de factura (string) a 3 dígitos con ceros a la izquierda.
 * Devuelve 'invalid' si la entrada no es un número válido.
 */
export const formatInvoiceNumber = (numStr: string | undefined | null): string => {
    if (!numStr) return 'invalid';
    const cleanNum = numStr.trim();
    if (!/^[0-9]+$/.test(cleanNum)) return 'invalid';
    return cleanNum.padStart(3, '0');
};

/**
 * Carga un archivo PDF (File object) y devuelve el objeto PDFDocument de pdf-lib.
 * Lanza un error si el archivo no se puede cargar o está corrupto/protegido.
 */
export const loadPdf = async (file: File): Promise<PDFDocument> => {
    const arrayBuffer = await file.arrayBuffer();
    try {
        // Intentar cargar ignorando la encriptación si es posible
        return await PDFLibDocument.load(arrayBuffer, { ignoreEncryption: true });
    } catch (loadError) {
        console.error(`Error al cargar ${file.name}:`, loadError);
        // Podríamos intentar cargar sin `ignoreEncryption` como fallback, pero puede fallar igual
        // try {
        //     return await PDFLibDocument.load(arrayBuffer);
        // } catch (fallbackError) {
        //     console.error(`Error al cargar ${file.name} (segundo intento):`, fallbackError);
        // }
        throw new Error(`No se pudo cargar ${file.name}. Puede estar corrupto, protegido con contraseña o tener un formato no soportado.`);
    }
}; 