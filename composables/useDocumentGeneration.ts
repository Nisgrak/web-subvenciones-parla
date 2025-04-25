import { ref } from 'vue';
import type { Ref, UnwrapNestedRefs } from 'vue';
import { useAppConfig } from '#app';
import { PDFDocument as PDFLibDocument, type PDFDocument, type PDFForm } from 'pdf-lib';
import type { Factura } from '~/types';
import { loadPdf } from '~/utils/fileUtils';
import { loadPdfTemplate, fillInvoiceRow, finalizePage, savePdfToBlobUrl, type PdfTemplate } from '~/utils/pdfUtils';

// Tipo para los datos del formulario de la asociación
interface AssociationFormData {
    associationName: string;
    associationCif: string;
    representativeName: string;
    representativeId: string;
}

export function useDocumentGeneration(
    csvData: Ref<Factura[]>,
    formData: AssociationFormData | UnwrapNestedRefs<AssociationFormData>,
    invoiceFolderHandle: Ref<FileSystemDirectoryHandle | null>,
    foundInvoicePdfs: Ref<Map<string, File>> // Mapa con número original -> File
) {
    const appConfig = useAppConfig();
    const pdfConfig = appConfig.pdfTemplate;

    // --- Estado Generación --- //
    // Anexo III
    const isGeneratingAnexo = ref(false);
    const anexoGenerationProgress = ref(0);
    const anexoResults = ref<{ name: string; url: string }[]>([]); // Solo Anexo III
    const anexoError = ref<string | null>(null); // Error específico Anexo III

    // Fusión Facturas PDF
    const isMergingPdfs = ref(false);
    const pdfMergeProgress = ref(0);
    const mergedPdfUrl = ref<string | null>(null); // URL del PDF fusionado
    const pdfMergeError = ref<string | null>(null); // Error específico fusión

    // Estado general combinado
    const isGenerating = computed(() => isGeneratingAnexo.value || isMergingPdfs.value);

    /**
     * Resetea el estado relacionado con la generación de documentos.
     */
    const resetGenerationState = () => {
        isGeneratingAnexo.value = false;
        anexoGenerationProgress.value = 0;
        if (anexoResults.value.length > 0) {
            anexoResults.value.forEach(r => URL.revokeObjectURL(r.url));
        }
        anexoResults.value = [];
        anexoError.value = null;

        isMergingPdfs.value = false;
        pdfMergeProgress.value = 0;
        if (mergedPdfUrl.value) {
            URL.revokeObjectURL(mergedPdfUrl.value);
        }
        mergedPdfUrl.value = null;
        pdfMergeError.value = null;
    };

    /**
     * Genera el documento Anexo III basado en `csvData` y `formData`.
     */
    const generateAnexoIII = async (): Promise<void> => {
        console.log('Iniciando generación de Anexo III...');
        isGeneratingAnexo.value = true;
        anexoGenerationProgress.value = 0;
        anexoError.value = null;
        if (anexoResults.value.length > 0) {
            anexoResults.value.forEach(r => URL.revokeObjectURL(r.url));
            anexoResults.value = [];
        }

        const MAX_ROWS = pdfConfig.maxRowsPerPage;
        const fields = pdfConfig.fields;
        const anexoDocsList: PDFDocument[] = [];
        let anexoTotalAcc = 0;

        try {
            let actualAnexoDoc: PDFDocument | null = null;
            let actualAnexoForm: PDFForm | null = null;
            let invoiceInTemplateIndex = 0;
            let subtotalAcc = 0;

            const getNewAnexoPage = async (): Promise<PdfTemplate> => await loadPdfTemplate('/Anexo III.pdf');

            // Primera página
            const firstPageTemplate = await getNewAnexoPage();
            actualAnexoDoc = firstPageTemplate.doc;
            actualAnexoForm = firstPageTemplate.form;
            anexoDocsList.push(actualAnexoDoc);
            anexoGenerationProgress.value = 5;

            for (let i = 0; i < csvData.value.length; i++) {
                const factura = csvData.value[i];
                const proyectExpense = factura.grantExpense ?? 0;

                // Validar datos esenciales para esta fila del Anexo
                if (factura.expense === undefined || !factura.number || proyectExpense === undefined) {
                    console.warn(`Factura ${factura.number || 'desconocida'} saltada en Anexo III por datos faltantes (expense o grantExpense).`);
                    continue; // Saltar esta fila si faltan datos clave
                }

                // Si la página actual está llena, finalizarla y crear una nueva
                if (invoiceInTemplateIndex >= MAX_ROWS) {
                    finalizePage(actualAnexoForm!, fields, {
                        subtotal: subtotalAcc,
                        entityName: formData.associationName,
                        entityNif: formData.associationCif,
                        deputyName: formData.representativeName,
                        deputyNif: formData.representativeId
                    });
                    const nextPageTemplate = await getNewAnexoPage();
                    actualAnexoDoc = nextPageTemplate.doc;
                    actualAnexoForm = nextPageTemplate.form;
                    anexoDocsList.push(actualAnexoDoc);
                    invoiceInTemplateIndex = 0;
                    subtotalAcc = 0;
                }

                // Rellenar la fila actual
                fillInvoiceRow(actualAnexoForm!, fields, factura, invoiceInTemplateIndex, proyectExpense);
                subtotalAcc += proyectExpense;
                anexoTotalAcc += proyectExpense;
                invoiceInTemplateIndex++;

                // Actualizar progreso (Anexo III es aprox. 50% del total si hay fusión)
                const progressPercentage = 5 + Math.round(((i + 1) / csvData.value.length) * 45);
                anexoGenerationProgress.value = progressPercentage;
            }

            // Finalizar la última página
            if (actualAnexoForm) {
                finalizePage(actualAnexoForm, fields, {
                    total: anexoTotalAcc,
                    entityName: formData.associationName,
                    entityNif: formData.associationCif,
                    deputyName: formData.representativeName,
                    deputyNif: formData.representativeId
                });
            }

            // Crear el documento final combinando todas las páginas generadas
            const finalAnexoDoc = await PDFLibDocument.create();
            for (const docToCopyFrom of anexoDocsList) {
                // Aplanar aquí cada página *antes* de copiarla al documento final
                // Esto evita problemas si los campos tienen nombres idénticos entre páginas
                docToCopyFrom.getForm()?.flatten();
                const [copiedPage] = await finalAnexoDoc.copyPages(docToCopyFrom, [0]); // Asumiendo una página por doc
                finalAnexoDoc.addPage(copiedPage);
            }

            // Guardar como Blob URL
            const anexoFilename = `AnexoIII_${formData.associationName || 'Asociacion'}.pdf`;
            const anexoUrl = await savePdfToBlobUrl(finalAnexoDoc, anexoFilename);
            anexoResults.value = [{ name: anexoFilename, url: anexoUrl }];
            anexoGenerationProgress.value = 100; // Marcar como 100% completado
            console.log('Anexo III generado con éxito.');

        } catch (err: unknown) {
            console.error('Error generando Anexo III:', err);
            anexoError.value = `Error al generar Anexo III: ${(err instanceof Error) ? err.message : 'Desconocido'}`;
            anexoGenerationProgress.value = 100; // Marcar como completado aunque falle para quitar barra
        } finally {
            isGeneratingAnexo.value = false;
        }
    };

    /**
     * Genera un único PDF fusionando las facturas encontradas en `foundInvoicePdfs`
     * que corresponden a entradas en `csvData`.
     */
    const mergeInvoicePdfs = async (): Promise<void> => {
        if (!invoiceFolderHandle.value || foundInvoicePdfs.value.size === 0) {
            console.log('No hay carpeta seleccionada o facturas encontradas para fusionar.');
            // Podríamos establecer un mensaje informativo en pdfMergeError si se desea
            // pdfMergeError.value = 'No se seleccionó carpeta o no se encontraron facturas válidas.';
            return;
        }

        console.log(`Iniciando fusión de ${foundInvoicePdfs.value.size} facturas PDF encontradas...`);
        isMergingPdfs.value = true;
        pdfMergeProgress.value = 0;
        pdfMergeError.value = null;
        if (mergedPdfUrl.value) {
            URL.revokeObjectURL(mergedPdfUrl.value);
            mergedPdfUrl.value = null;
        }

        const masterInvoicePdf = await PDFLibDocument.create();
        let facturasProcesadas = 0;
        // Filtrar las facturas del CSV que realmente se encontraron en la carpeta
        const facturasAProcesar = csvData.value.filter(f => f.number && foundInvoicePdfs.value.has(f.number));

        if (facturasAProcesar.length === 0) {
            console.log("Aunque se seleccionó carpeta, ninguna factura del CSV coincide con los archivos encontrados.");
            pdfMergeError.value = "Ninguna factura del CSV coincide con los PDFs encontrados.";
            isMergingPdfs.value = false;
            return;
        }

        try {
            for (const factura of facturasAProcesar) {
                const file = foundInvoicePdfs.value.get(factura.number!)!;
                console.log(` - Fusionando ${file.name} (Num: ${factura.number})...`);
                // Actualizar progreso (0-95%)
                pdfMergeProgress.value = Math.round((facturasProcesadas / facturasAProcesar.length) * 95);

                try {
                    // Cargar el PDF de la factura individual
                    const tempPdf = await loadPdf(file);
                    // Copiar todas sus páginas al documento maestro
                    const tempPages = await masterInvoicePdf.copyPages(tempPdf, tempPdf.getPageIndices());
                    tempPages.forEach(page => masterInvoicePdf.addPage(page));
                } catch (processError) {
                    console.warn(`Error procesando ${file.name} para fusión:`, processError);
                    // Acumular errores sin detener el proceso
                    if (!pdfMergeError.value) pdfMergeError.value = "Errores encontrados durante la fusión: ";
                    pdfMergeError.value += `${file.name} (${(processError instanceof Error) ? processError.message : 'Error lectura'}); `;
                }
                facturasProcesadas++;
                // Pequeña pausa para evitar congelar el navegador con muchos archivos
                if (facturasProcesadas % 10 === 0) await new Promise(resolve => setTimeout(resolve, 20));
            }

            // Comprobar si se añadió alguna página al PDF maestro
            if (masterInvoicePdf.getPageCount() === 0) {
                if (!pdfMergeError.value) pdfMergeError.value = "No se pudo añadir ninguna página de las facturas encontradas (posiblemente corruptas o protegidas).";
                else pdfMergeError.value += " | No se añadió ninguna página válida al PDF final.";
            } else {
                console.log('Guardando PDF de facturas fusionadas...');
                pdfMergeProgress.value = 98; // Casi listo
                const pdfBytes = await masterInvoicePdf.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                mergedPdfUrl.value = URL.createObjectURL(blob);
                console.log('PDF de facturas generado:', mergedPdfUrl.value);
            }

            pdfMergeProgress.value = 100; // Marcar como 100% completado
            console.log('Proceso de fusión de facturas completado.');

        } catch (err: unknown) {
            console.error('Error crítico durante fusión de facturas:', err);
            if (!pdfMergeError.value) pdfMergeError.value = ""; else pdfMergeError.value += " | ";
            pdfMergeError.value += `Error General Fusión: ${(err instanceof Error) ? err.message : 'Desconocido'}`;
            if (mergedPdfUrl.value) URL.revokeObjectURL(mergedPdfUrl.value);
            mergedPdfUrl.value = null;
            pdfMergeProgress.value = 100; // Marcar como terminado aunque falle
        } finally {
            isMergingPdfs.value = false;
        }
    };

    /**
     * Orquesta la generación de todos los documentos necesarios.
     */
    const generateDocuments = async () => {
        // Validaciones previas
        if (!csvData.value || csvData.value.length === 0) {
            anexoError.value = 'Carga un archivo CSV válido primero.';
            return;
        }
        if (!formData.associationName || !formData.associationCif || !formData.representativeName || !formData.representativeId) {
            anexoError.value = 'Completa los datos de la asociación y representante en el formulario.';
            return;
        }

        resetGenerationState(); // Limpiar resultados anteriores

        // Lanzar generación de Anexo III (siempre se intenta)
        const anexoPromise = generateAnexoIII();

        // Lanzar fusión de PDFs si hay carpeta y facturas encontradas
        let mergePromise: Promise<void> | null = null;
        if (invoiceFolderHandle.value && foundInvoicePdfs.value.size > 0) {
            mergePromise = mergeInvoicePdfs();
        }

        // Esperar a que ambas (o una) terminen
        await anexoPromise;
        if (mergePromise) {
            await mergePromise;
        }

        console.log('Proceso de generación completado.');
        // El estado (progreso, resultados, errores) se actualiza dentro de cada función
    };

    return {
        isGenerating,
        isGeneratingAnexo,
        anexoGenerationProgress,
        anexoResults,
        anexoError,
        isMergingPdfs,
        pdfMergeProgress,
        mergedPdfUrl,
        pdfMergeError,
        generateDocuments,
        resetGenerationState // Exponer para resetear si es necesario
    };
} 