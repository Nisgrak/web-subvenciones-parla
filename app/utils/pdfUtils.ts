import { PDFDict, PDFDocument, PDFName, type PDFForm, type PDFTextField } from 'pdf-lib';
// Quitar la importación duplicada de PDFForm y usar las de la línea anterior
import type { Factura } from '~/types'; // Importar desde el nuevo archivo

/**
 * Tipo para representar la plantilla PDF cargada.
 */
export interface PdfTemplate {
    doc: PDFDocument;
    form: PDFForm;
}

/**
 * Elimina entradas nulas o referencias a anotaciones inexistentes, conservando
 * los enlaces y las demás anotaciones válidas. Devuelve el número de entradas eliminadas.
 */
export const removeInvalidPdfAnnotations = (pdfDoc: PDFDocument): number => {
    let removed = 0;

    for (const page of pdfDoc.getPages()) {
        const annotations = page.node.Annots();
        if (!annotations) continue;

        for (let index = annotations.size() - 1; index >= 0; index--) {
            const annotation = pdfDoc.context.lookup(annotations.get(index));
            if (!(annotation instanceof PDFDict)) {
                annotations.remove(index);
                removed++;
            }
        }

        if (annotations.size() === 0) {
            page.node.delete(PDFName.of('Annots'));
        }
    }

    return removed;
};

/**
 * Aplana los campos y limpia sus referencias antes de copiar las páginas.
 * pdf-lib 1.17.1 puede eliminar widgets sin retirar sus referencias de /Annots;
 * Adobe rechaza esas referencias al guardar una firma digital.
 */
export const flattenPdfForm = (form: PDFForm): void => {
    form.flatten();
    removeInvalidPdfAnnotations(form.doc);
};

/**
 * Carga la plantilla PDF desde la carpeta public.
 * @param url La URL relativa al archivo PDF en la carpeta /public (ej: '/Anexo III.pdf')
 * @returns Una promesa que resuelve con un objeto PdfTemplate.
 */
export const loadPdfTemplate = async (url: string): Promise<PdfTemplate> => {
    try {
        const existingPdfBytes = await fetch(url).then(res => {
            if (!res.ok) {
                throw new Error(`No se pudo encontrar la plantilla PDF en ${url}: ${res.statusText}`);
            }
            return res.arrayBuffer();
        });
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const form = pdfDoc.getForm();

        return { doc: pdfDoc, form };
    } catch (err) {
        console.error(`Error cargando la plantilla PDF desde ${url}:`, err);
        const message = err instanceof Error ? err.message : 'Error desconocido';
        throw new Error(`No se pudo cargar la plantilla PDF (${message}). Verifica que el archivo '${url}' existe en la carpeta 'public'.`, { cause: err });
    }
};

// Interfaz para los nombres de campos definidos en app.config.ts
// (Esto podría generarse automáticamente o definirse de forma más robusta)
interface PdfFieldConfig {
    maxRowsPerPage: number;
    fields: {
        internalNum: (index: number) => string;
        proyect: (index: number) => string;
        concept: (index: number) => string;
        num: (index: number) => string;
        nif: (index: number) => string;
        date: (index: number) => string;
        datePay: (index: number) => string;
        cost: (index: number) => string;
        justify: (index: number) => string;
        subtotalCheck: string;
        totalCheck: string;
        subtotalNum: string;
        totalNum: string;
        entityName: string;
        entityNif: string;
        deputyName: string;
        deputyNif: string;
        day: string;
        month: string;
        year: string;
    }
}

const ROW_FONT_SIZE = 9;
const MIN_ROW_FONT_SIZE = 5;

/**
 * Devuelve un tamaño de letra menor que el de la plantilla si el texto no cabe
 * en el ancho del campo (los textos largos se cortaban), o undefined si cabe.
 */
const fitFontSize = (form: PDFForm, field: PDFTextField, text: string): number | undefined => {
    const widget = field.acroField.getWidgets()[0];
    if (!widget || !text) return undefined;
    const available = widget.getRectangle().width - 4; // margen interno de pdf-lib
    const widthAtOne = form.getDefaultFont().widthOfTextAtSize(text, 1);
    if (widthAtOne * ROW_FONT_SIZE <= available) return undefined;
    return Math.max(MIN_ROW_FONT_SIZE, Math.floor((available / widthAtOne) * 2) / 2);
};

/**
 * Rellena una fila de la tabla de facturas en el formulario PDF.
 * @param form El objeto PDFForm.
 * @param fieldsConfig La configuración de los nombres de campos.
 * @param invoice La factura a escribir.
 * @param index El índice de la fila (0-based).
 * @param projectExpense El importe específico del proyecto a justificar.
 */
export const fillInvoiceRow = (
    form: PDFForm,
    fieldsConfig: PdfFieldConfig['fields'],
    invoice: Factura,
    index: number,
    projectExpense: number
) => {
    try {
        // Helper para obtener y rellenar campo de texto
        const fillTextField = (fieldName: string, text: string | number | undefined, maxLength?: number) => {
            try {
                const field = form.getTextField(fieldName);
                const value = text?.toString() ?? '';

                field.setMaxLength(maxLength);
                console.log(fieldName, value);
                const fontSize = fitFontSize(form, field, value);
                if (fontSize) field.setFontSize(fontSize);
                field.setText(value);
            } catch (e) {
                console.warn(`Campo no encontrado o error al rellenar: ${fieldName}`, e);
            }
        };

        fillTextField(fieldsConfig.internalNum(index), invoice.number);
        // Asumiendo un nombre de proyecto fijo como en el ejemplo, o pasarlo como argumento
        fillTextField(fieldsConfig.proyect(index), invoice.activity);
        fillTextField(fieldsConfig.concept(index), invoice.concept);
        fillTextField(fieldsConfig.num(index), invoice.invoiceNumber);
        fillTextField(fieldsConfig.nif(index), invoice.providerNumber);
        fillTextField(fieldsConfig.date(index), invoice.date);
        fillTextField(fieldsConfig.datePay(index), invoice.datePay ?? invoice.date); // Usar datePay si existe, sino la fecha de factura
        fillTextField(fieldsConfig.cost(index), invoice.expense?.toFixed(2)); // Formatear a 2 decimales
        fillTextField(fieldsConfig.justify(index), projectExpense.toFixed(2)); // Formatear a 2 decimales

    } catch (error) {
        console.error(`Error rellenando la fila ${index} para factura ${invoice.number}:`, error);
        throw new Error(`Error procesando fila ${index}.`, { cause: error }); // Relanzar para detener la generación
    }
};

/**
 * Marca los checkboxes y rellena los campos de totales/subtotales.
 * @param form El objeto PDFForm.
 * @param fieldsConfig La configuración de los nombres de campos.
 * @param type 'subtotal' o 'total'.
 * @param amount El importe a escribir.
 */
export const finalizePage = (
    form: PDFForm,
    fieldsConfig: PdfFieldConfig['fields'],
    data: {
        subtotal?: number,
        total?: number,
        entityName: string,
        entityNif: string,
        deputyName: string,
        deputyNif: string,
    }
) => {
    try {
        const checkField = data.total ? fieldsConfig.totalCheck : fieldsConfig.subtotalCheck;
        const numField = fieldsConfig.totalNum;

        try {
            form.getCheckBox(checkField).check();
        } catch (e) {
            console.warn(`Checkbox no encontrado o error al marcar: ${checkField}`, e);
        }

        try {
            console.log(data);
            form.getTextField(fieldsConfig.subtotalNum).setText((data.subtotal || data.total)?.toFixed(2) ?? '');
            if (data.entityName)
                form.getTextField(fieldsConfig.entityName).setText(data.entityName);
            if (data.entityNif)
                form.getTextField(fieldsConfig.entityNif).setText(data.entityNif);
            if (data.deputyName)
                form.getTextField(fieldsConfig.deputyName).setText(data.deputyName);
            if (data.deputyNif)
                form.getTextField(fieldsConfig.deputyNif).setText(data.deputyNif);

            const today = new Date();
            const day = today.getDate();
            const month = today.getMonth() + 1;
            const year = today.getFullYear() % 100; // Obtener solo los últimos 2 dígitos

            const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
                'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

            form.getTextField(fieldsConfig.day).setText(day.toString());
            form.getTextField(fieldsConfig.month).setText(meses[month - 1]);
            form.getTextField(fieldsConfig.year).setText(year.toString());
        } catch (e) {
            console.warn(`Campo de importe no encontrado o error al rellenar: ${numField}`, e);
        }

        flattenPdfForm(form);

    } catch (error) {
        console.error(`Error finalizando página:`, error);
        throw new Error(`Error finalizando página.`, { cause: error });
    }
};

/**
 * Guarda un PDFDocument como Blob y genera una URL local.
 * @param pdfDoc El PDFDocument a guardar.
 * @param filename El nombre de archivo deseado para la descarga.
 * @returns La URL del Blob (ej: 'blob:http://localhost:3000/abc-123').
 */
export const savePdfToBlobUrl = async (pdfDoc: PDFDocument, filename: string): Promise<string> => {
    try {
        // Los campos del Anexo ya están aplanados y /Annots limpio antes de copiar sus páginas.
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes as unknown as ArrayBuffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        return url;
    } catch (error) {
        console.error(`Error al guardar el PDF ${filename}:`, error);
        throw new Error(`Error al generar el archivo PDF ${filename}.`, { cause: error });
    }
};

// --- Función de Fusión (Opcional, más compleja) --- 
/*
export const mergePdfs = async (pdfDocs: PDFDocument[]): Promise<PDFDocument> => {
    if (pdfDocs.length === 0) throw new Error("No hay documentos PDF para fusionar.");
    if (pdfDocs.length === 1) return pdfDocs[0];

    const mergedPdf = await PDFDocument.create(); // Empezar con uno vacío

    for (const doc of pdfDocs) {
        // ¡Importante! Aplanar ANTES de copiar si los campos tienen el mismo nombre entre páginas
        // O asegurarse que los campos se renombran/manejan correctamente durante la copia.
        // doc.getForm().flatten();
        const pages = await mergedPdf.copyPages(doc, doc.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
    }

    return mergedPdf;
};
*/

// --- Más funciones de utilidad PDF irán aquí --- 
