import type { PDFDocument } from 'pdf-lib';
import type { Factura } from '~/types';

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
 * Clave única de una factura: su Nº orden, más el año si otra factura de otro
 * año comparte el mismo número (ej. "25-2026").
 */
export const getInvoiceKey = (factura: Pick<Factura, 'number' | 'date' | 'sharedNumber'>): string =>
    factura.sharedNumber ? `${factura.number}-${factura.date.slice(6)}` : factura.number;

/** Recupera todos los PDF encontrados de las facturas incluidas, en el orden de la plantilla. */
export const getInvoicePdfFiles = (invoices: Factura[], found: Map<string, File>): File[] =>
    invoices.flatMap(invoice => {
        const file = found.get(getInvoiceKey(invoice));
        return file ? [file] : [];
    });

/**
 * Nombre que recomendamos para el PDF de una factura: facturaNNN.pdf, o
 * facturaAA-NNN.pdf (año con dos cifras + Nº orden) si su Nº orden se repite en otro año.
 */
export const getExpectedInvoiceFileName = (factura: Pick<Factura, 'number' | 'date' | 'sharedNumber'>): string | null => {
    const formattedNum = formatInvoiceNumber(factura.number);
    if (formattedNum === 'invalid') return null;
    return factura.sharedNumber
        ? `factura${factura.date.slice(8)}-${formattedNum}.pdf`
        : `factura${formattedNum}.pdf`;
};

/**
 * Todos los nombres con los que se reconoce el PDF de una factura:
 * - facturaAA-NNN.pdf para cualquier factura (también sin "factura" delante o
 *   sin ceros en el número), de modo que todas puedan nombrarse siempre con año.
 * - facturaNNN.pdf, solo si el Nº orden no se repite (si no, sería ambiguo).
 */
export const getAcceptedInvoiceFileNames = (factura: Pick<Factura, 'number' | 'date' | 'sharedNumber'>): string[] => {
    const formattedNum = formatInvoiceNumber(factura.number);
    if (formattedNum === 'invalid') return [];
    const year = factura.date.slice(8);
    const names = new Set<string>();
    for (const num of [formattedNum, String(Number(factura.number))]) {
        names.add(`factura${year}-${num}.pdf`);
        names.add(`${year}-${num}.pdf`);
    }
    if (!factura.sharedNumber) names.add(`factura${formattedNum}.pdf`);
    return [...names];
};

/**
 * Normaliza un nombre de archivo para compararlo con el esperado: minúsculas y
 * "_" o espacios tras el año convertidos en "-" (Factura26_025.PDF -> factura26-025.pdf).
 */
export const normalizeInvoiceFileName = (name: string): string =>
    name.trim().toLowerCase().replace(/[\s_]+/g, '-');

/**
 * Carga un archivo PDF (File object) y devuelve el objeto PDFDocument de pdf-lib.
 * Lanza un error si el archivo no se puede cargar o está corrupto/protegido.
 */
export const loadPdf = async (file: File): Promise<PDFDocument> => {
    const arrayBuffer = await file.arrayBuffer();
    try {
        const { PDFDocument: PDFLibDocument } = await import('pdf-lib');
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
        throw new Error(`No se pudo cargar ${file.name}. Puede estar corrupto, protegido con contraseña o tener un formato no soportado.`, { cause: loadError });
    }
};

/** Une las facturas en su orden y añade después todos los PDF extra, sin perder los válidos si alguno falla. */
export const mergePdfFiles = async (
    invoiceFiles: File[],
    extraFiles: File[],
    onProgress?: (progress: number) => void
): Promise<{ doc: PDFDocument; invoices: number; extras: number; errors: string[] }> => {
    const { PDFDocument: PDFLibDocument } = await import('pdf-lib');
    const doc = await PDFLibDocument.create();
    const files = [
        ...invoiceFiles.map(file => ({ file, extra: false })),
        ...extraFiles.map(file => ({ file, extra: true }))
    ];
    let invoices = 0;
    let extras = 0;
    const errors: string[] = [];

    for (const [index, { file, extra }] of files.entries()) {
        try {
            const source = await loadPdf(file);
            if (source.getPageCount() === 0) throw new Error(`«${file.name}» no contiene páginas.`);
            const pages = await doc.copyPages(source, source.getPageIndices());
            pages.forEach(page => doc.addPage(page));
            if (extra) extras++;
            else invoices++;
        } catch (err) {
            errors.push(err instanceof Error ? err.message : `No se pudo añadir «${file.name}».`);
        }
        onProgress?.(Math.round(((index + 1) / files.length) * 95));
        if ((index + 1) % 10 === 0) await new Promise(resolve => setTimeout(resolve, 20));
    }

    return { doc, invoices, extras, errors };
};
