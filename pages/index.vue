<template>
    <UContainer class="py-8">
        <!-- Encabezado -->
        <header class="mb-12 text-center">
            <h1 class="text-4xl font-bold mb-2">Generador de Documentación PDF para Asociaciones</h1>
            <p class="text-lg text-gray-600 dark:text-gray-400">
                Sube tu archivo Excel y genera automáticamente los documentos PDF necesarios para tu asociación de forma
                rápida y sencilla.
            </p>
        </header>

        <!-- Sección de Tutorial -->
        <section class="mb-12 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow">
            <h2 class="text-2xl font-semibold mb-4">Cómo Funciona</h2>
            <ol class="list-decimal list-inside space-y-4">
                <li>
                    <UIcon name="i-heroicons-document-arrow-down" class="mr-2 align-middle" />
                    <strong>Descarga la Plantilla CSV:</strong> Asegúrate de que tus datos siguen el formato correcto.
                </li>
                <li>
                    <UIcon name="i-heroicons-table-cells" class="mr-2 align-middle" />
                    <strong>Rellena tus Datos:</strong> Completa la plantilla CSV con la información requerida.
                </li>
                <li>
                    <UIcon name="i-heroicons-arrow-up-tray" class="mr-2 align-middle" />
                    <strong>Sube el Archivo CSV:</strong> Carga el archivo CSV completado en el formulario.
                </li>
                <li>
                    <UIcon name="i-heroicons-folder-arrow-down" class="mr-2 align-middle" />
                    <strong>(Opcional) Selecciona Carpeta de Facturas:</strong> Si deseas adjuntar los PDF de las
                    facturas, selecciona la carpeta que los contiene.
                    <ul class="list-disc list-inside pl-6 text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <li>Los archivos PDF deben llamarse <code>facturaNNN.pdf</code> (ej.
                            <code>factura001.pdf</code>, <code>factura042.pdf</code>).
                        </li>
                        <li>El número <code>NNN</code> debe coincidir con la columna 'number' del CSV.</li>
                    </ul>
                </li>
                <li>
                    <UIcon name="i-heroicons-cog-6-tooth" class="mr-2 align-middle" />
                    <strong>Genera los Documentos:</strong> Haz clic en "Generar Documentos". Se creará el Anexo III y,
                    si seleccionaste una carpeta, un PDF adicional con las facturas encontradas.
                </li>
                <li>
                    <UIcon name="i-heroicons-arrow-down-tray" class="mr-2 align-middle" />
                    <strong>Descarga tus Documentos:</strong> Una vez generados, podrás descargar los PDFs
                    individualmente.
                </li>
            </ol>
        </section>

        <!-- Formulario Principal -->
        <section class="mb-12">
            <h2 class="text-2xl font-semibold mb-6">Información y Carga de Datos</h2>

            <!-- Datos Asociación (sin cambios) -->
            <UCard class="mb-6">
                <template #header>
                    <h3 class="text-lg font-medium">Datos de la Asociación y Representante</h3>
                </template>
                <UForm :state="{}" class="space-y-4 space-x-4">
                    <UFormGroup label="Nombre de la Asociación" name="associationName" required>
                        <UInput v-model="formData.associationName" placeholder="Asociación Ejemplo XYZ" />
                    </UFormGroup>
                    <UFormGroup label="CIF de la Asociación" name="associationCif" required>
                        <UInput v-model="formData.associationCif" placeholder="G12345678" />
                    </UFormGroup>
                    <UFormGroup label="Nombre del Representante" name="representativeName" required>
                        <UInput v-model="formData.representativeName" placeholder="Juan Pérez García" />
                    </UFormGroup>
                    <UFormGroup label="CIF/DNI del Representante" name="representativeId" required>
                        <UInput v-model="formData.representativeId" placeholder="12345678A" />
                    </UFormGroup>
                </UForm>
            </UCard>

            <!-- Carga de Datos: CSV y Carpeta Opcional -->
            <UCard>
                <template #header>
                    <h3 class="text-lg font-medium">Origen de Datos para Generación</h3>
                </template>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <!-- Columna 1: Carga CSV Obligatoria -->
                    <div class="border p-4 rounded-md">
                        <h4 class="font-semibold mb-3">1. Cargar Archivo CSV (Obligatorio)</h4>
                        <UFormGroup label="Archivo CSV (.csv)" name="csvFile" required>
                            <UInput type="file" size="lg" accept=".csv, text/csv"
                                :disabled="isGenerating || isProcessingFolder" @change="handleFileChange" />
                        </UFormGroup>
                        <div class="flex items-center space-x-4 mt-2">
                            <UButton variant="outline" icon="i-heroicons-document-arrow-down"
                                label="Descargar Plantilla CSV" :disabled="isGenerating || isProcessingFolder"
                                @click="downloadTemplate" />
                            <!-- Info Archivo Cargado -->
                            <div class="text-sm flex-grow">
                                <span v-if="!csvFile" class="text-gray-500 dark:text-gray-400">(No hay archivo
                                    cargado)</span>
                                <span v-else class="text-green-600 dark:text-green-400 truncate">
                                    <UIcon name="i-heroicons-check-circle" class="mr-1" /> {{ csvFile.name }} ({{
                                        csvData.length }}
                                    filas)
                                </span>
                                <div v-if="parsingError" class="text-red-500 mt-1">
                                    Error: {{ parsingError }}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Columna 2: Selección Carpeta Opcional -->
                    <div class="border p-4 rounded-md">
                        <h4 class="font-semibold mb-3">2. (Opcional) Adjuntar Facturas PDF</h4>

                        <UTooltip class="w-full">
                            <template #text>
                                <div class="max-w-xs text-wrap">
                                    Selecciona la carpeta que contiene los archivos PDF de las facturas listadas en el
                                    CSV.<br>
                                    Los archivos deben nombrarse <code>facturaNNN.pdf</code> (ej:
                                    <code>factura001.pdf</code>, <code>factura015.pdf</code>).<br>
                                    El número <code>NNN</code> se obtiene de la columna 'number' del CSV, añadiendo
                                    ceros a la izquierda si es necesario.
                                </div>
                            </template>
                            <UButton class="w-full" icon="i-heroicons-folder-arrow-down"
                                label="Seleccionar Carpeta de Facturas"
                                :disabled="csvData.length === 0 || isGenerating || isProcessingFolder"
                                :loading="isProcessingFolder" @click="selectAndFindInvoicePdfs" />
                        </UTooltip>

                        <!-- Feedback Selección Carpeta -->
                        <div class="mt-3 text-sm space-y-1">
                            <div v-if="invoiceFolderHandle">
                                <UIcon name="i-heroicons-check-circle" class="text-green-500 mr-1" />
                                Carpeta seleccionada.
                                <span v-if="!isProcessingFolder"> ({{ foundInvoicePdfs.size }} facturas encontradas, {{
                                    missingInvoiceNumbers.length }} faltantes)</span>
                            </div>
                            <div v-else class="text-gray-500 dark:text-gray-400">
                                (No se ha seleccionado carpeta)
                            </div>
                            <div v-if="csvMergeError && !isMergingCsvPdfs" class="text-red-500">
                                Error Facturas: {{ csvMergeError }}
                            </div>
                            <div v-if="missingInvoiceNumbers.length > 0 && !isProcessingFolder"
                                class="text-amber-600 dark:text-amber-400">
                                <span class="font-medium">Facturas no encontradas:</span> {{
                                    missingInvoiceNumbers.join(', ') }}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Botón Principal de Generación -->
                <div class="text-center mt-6 pt-4 border-t">
                    <UButton size="xl" color="primary" icon="i-heroicons-cog-6-tooth" label="Generar Documentos"
                        :loading="isGenerating || isMergingCsvPdfs"
                        :disabled="csvData.length === 0 || isGenerating || isMergingCsvPdfs || isProcessingFolder"
                        @click="generateDocuments" />
                </div>
            </UCard>
        </section>

        <!-- Sección de Resultados -->
        <section>
            <h2 class="text-2xl font-semibold mb-6">Resultados de Generación</h2>
            <UCard>
                <!-- Indicadores de Progreso -->
                <div v-if="isGenerating || isMergingCsvPdfs" class="my-4 text-center space-y-4">
                    <div v-if="isGenerating">
                        <p class="mb-1">Generando Anexo III... ({{ generationProgress }}%)</p>
                        <UProgress :value="generationProgress" indicator size="sm" />
                    </div>
                    <div v-if="isMergingCsvPdfs">
                        <p class="mb-1">Generando PDF de Facturas... ({{ csvMergeProgress }}%)</p>
                        <UProgress :value="csvMergeProgress" indicator size="sm" />
                    </div>
                </div>

                <!-- Área de resultados -->
                <div v-if="(!isGenerating && !isMergingCsvPdfs) && (results.length > 0 || csvMergedPdfUrl || error || csvMergeError)"
                    class="mt-6 text-center">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <!-- Resultados Anexo III -->
                        <div class="border rounded-md p-4">
                            <h3 class="text-lg font-medium mb-2">Anexo III</h3>
                            <div v-if="results.length > 0">
                                <p class="text-green-600 dark:text-green-400 mb-4">¡Anexo III generado con éxito!</p>
                                <ul class="space-y-2 text-left max-w-md mx-auto mb-4">
                                    <li v-for="(result, index) in results" :key="`anexo-${index}`">
                                        <a :href="result.url" :download="result.name"
                                            :title="`Descargar ${result.name}`"
                                            class="text-primary hover:underline flex items-center">
                                            <UIcon name="i-heroicons-document-arrow-down" class="mr-2 flex-shrink-0" />
                                            <span class="truncate">{{ result.name }}</span>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                            <div v-if="error">
                                <p class="text-red-600 dark:text-red-400 font-medium">Error al generar Anexo III:</p>
                                <p class="text-red-600 dark:text-red-400 text-sm">{{ error }}</p>
                            </div>
                            <div v-if="results.length === 0 && !error" class="text-gray-500 dark:text-gray-400">
                                (No generado)
                            </div>
                        </div>

                        <!-- Resultados Facturas Fusionadas -->
                        <div class="border rounded-md p-4">
                            <h3 class="text-lg font-medium mb-2">Facturas Adjuntas</h3>
                            <div v-if="csvMergedPdfUrl">
                                <p class="text-green-600 dark:text-green-400 mb-4">¡PDF de facturas generado con éxito!
                                </p>
                                <div class="max-w-md mx-auto mb-4">
                                    <a :href="csvMergedPdfUrl" download="Facturas_Adjuntas.pdf"
                                        title="Descargar PDF de Facturas"
                                        class="text-primary hover:underline flex items-center justify-center">
                                        <UIcon name="i-heroicons-document-arrow-down" class="mr-2 flex-shrink-0" />
                                        <span class="truncate">Facturas_Adjuntas.pdf</span>
                                    </a>
                                </div>
                            </div>
                            <div v-if="csvMergeError">
                                <p class="text-red-600 dark:text-red-400 font-medium">Error al generar PDF de Facturas:
                                </p>
                                <p class="text-red-600 dark:text-red-400 text-sm">{{ csvMergeError }}</p>
                            </div>
                            <div v-if="!csvMergedPdfUrl && !csvMergeError && !invoiceFolderHandle"
                                class="text-gray-500 dark:text-gray-400">
                                (No se seleccionó carpeta)
                            </div>
                            <div v-if="!csvMergedPdfUrl && !csvMergeError && invoiceFolderHandle && foundInvoicePdfs.size === 0"
                                class="text-amber-600 dark:text-amber-400">
                                (No se encontraron facturas válidas en la carpeta)
                            </div>
                            <div v-if="!csvMergedPdfUrl && !csvMergeError && invoiceFolderHandle && foundInvoicePdfs.size > 0 && !isMergingCsvPdfs"
                                class="text-gray-500 dark:text-gray-400">
                                (Pendiente de generar)
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Mensaje si no hay acciones realizadas -->
                <div v-if="!isGenerating && !isMergingCsvPdfs && results.length === 0 && !csvMergedPdfUrl && !error && !csvMergeError"
                    class="text-center text-gray-500 dark:text-gray-400 py-4">
                    Carga un archivo CSV y haz clic en "Generar Documentos" para ver los resultados aquí.
                </div>

                <!-- Botón Descargar Todo (Eliminado temporalmente, necesita reimplementación ZIP) -->
                <!-- <div v-if="..." class="text-center mt-6 pt-4 border-t">
                    <UButton variant="outline" icon="i-heroicons-archive-box-arrow-down" label="Descargar Todo" ... />
                </div> -->

            </UCard>
        </section>

    </UContainer>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useAppConfig } from '#app';
import { parse, getTime, isValid } from 'date-fns';
import type { PDFDocument, PDFForm } from 'pdf-lib';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';

import {
    loadPdfTemplate,
    fillInvoiceRow,
    finalizePage,
    savePdfToBlobUrl,
    type PdfTemplate,
    type Factura
} from '~/utils/pdfUtils';

// Configuración App
const appConfig = useAppConfig();
const { startDate: configStartDateString, endDate: configEndDateString } = appConfig.invoiceDateRange;
const startDate = parse(configStartDateString, 'dd/MM/yyyy', new Date());
const endDate = parse(configEndDateString, 'dd/MM/yyyy', new Date());
if (!isValid(startDate) || !isValid(endDate)) {
    console.error('Fechas de inicio/fin en app.config.ts no son válidas!');
}
const startDateTimestamp = isValid(startDate) ? getTime(startDate) : -Infinity;
const endDateTimestamp = isValid(endDate) ? getTime(endDate) : Infinity;

// Estado Formulario Asociación
const formData = reactive({
    associationName: 'Asociación Ejemplo XYZ',
    associationCif: 'G12345678',
    representativeName: 'Juan Pérez García',
    representativeId: '12345678A',
    destinationFolder: ''
});

// Configuración Columnas CSV
interface ColumnOptions {
    name: keyof Factura;
    parse?: (value: string) => number | undefined | string;
}
function convertFloat(input: string): number | undefined {
    if (!input) return undefined;
    const cleanedInput = input.replace(/\s*€/g, "").replace(/,/g, ".");
    const result = parseFloat(cleanedInput);
    return Number.isNaN(result) ? undefined : result;
}
const columns: ColumnOptions[] = [
    { name: "number" }, { name: "providerNumber" }, { name: "date" },
    { name: "activity" }, { name: "concept" }, { name: "nif" },
    { name: "income", parse: convertFloat }, { name: "expense", parse: convertFloat },
    { name: "total", parse: convertFloat }, { name: "infancyExpense", parse: convertFloat },
    { name: "participationExpense", parse: convertFloat },
];

// --- Estado Carga CSV ---
const csvFile = ref<File | null>(null);
const csvData = ref<Factura[]>([]);
const parsingError = ref<string | null>(null);

// --- Estado Generación Anexo III ---
const isGenerating = ref(false);
const generationProgress = ref(0);
const results = ref<{ name: string; url: string }[]>([]); // Solo para Anexo III
const error = ref<string | null>(null); // Error específico Anexo III

// --- Estado Selección Carpeta y Fusión Facturas (Opcional) ---
const invoiceFolderHandle = ref<FileSystemDirectoryHandle | null>(null);
const foundInvoicePdfs = ref<Map<string, File>>(new Map()); // Clave: factura.number, Valor: File
const missingInvoiceNumbers = ref<string[]>([]);
const isProcessingFolder = ref(false); // Feedback al buscar archivos
const isMergingCsvPdfs = ref(false); // Estado para la fusión opcional
const csvMergeProgress = ref(0);
const csvMergedPdfUrl = ref<string | null>(null); // URL del PDF de facturas fusionadas
const csvMergeError = ref<string | null>(null); // Error específico fusión facturas

// --- Funciones Auxiliares ---

/**
 * Formatea un número de factura (string) a 3 dígitos con ceros a la izquierda.
 */
const formatInvoiceNumber = (numStr: string | undefined): string => {
    if (!numStr) return 'invalid'; // Evitar errores si el número no existe
    const cleanNum = numStr.trim();
    if (!/^[0-9]+$/.test(cleanNum)) return 'invalid'; // Asegurarse que sean solo dígitos
    return cleanNum.padStart(3, '0');
};

/**
 * Carga un archivo PDF y devuelve el objeto PDFDocument de pdf-lib.
 */
const loadPdf = async (file: File): Promise<PDFDocument> => {
    const arrayBuffer = await file.arrayBuffer();
    try {
        return await PDFLibDocument.load(arrayBuffer, { ignoreEncryption: true });
    } catch (loadError) {
        console.error(`Error al cargar ${file.name}:`, loadError);
        throw new Error(`No se pudo cargar ${file.name}. Puede estar corrupto o protegido.`);
    }
};

// --- Funciones Principales ---

/**
 * Parsea un string CSV a un array de objetos Factura.
 * Valida que la fecha de la factura esté dentro del rango definido en app.config.ts
 */
const parseCsv = (csvString: string): Factura[] => {
    const lines = csvString.trim().split('\n');
    if (lines.length < 1) return [];
    const data: Factura[] = [];
    let currentParsingError: string | null = null; // Usar variable local para evitar sobreescribir errores de fecha

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values: string[] = [];
        let currentField = '';
        let inQuotes = false;
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            const nextChar = line[j + 1];
            if (char === '"' && !inQuotes && currentField.length === 0) {
                inQuotes = true; continue;
            }
            if (char === '"' && inQuotes) {
                if (nextChar === '"') { currentField += '"'; j++; }
                else if (line[j + 1] === ',' || j + 1 === line.length) { inQuotes = false; continue; }
                else { currentField += char; }
            } else if (char === ',' && !inQuotes) {
                values.push(currentField); currentField = '';
            } else { currentField += char; }
        }
        values.push(currentField);

        if (values.length === columns.length) {
            const factura: Record<string, any> = {}; // Definir tipo explícito aquí
            let validRow = true;
            let rawDateValue = '';

            for (let k = 0; k < columns.length; k++) {
                const column = columns[k];
                const rawValue = values[k].trim();
                if (column.name === 'date') rawDateValue = rawValue;
                try {
                    const parsedValue = column.parse ? column.parse(rawValue) : rawValue;
                    const key = column.name as keyof Factura;
                    if (typeof parsedValue === 'string') factura[key] = parsedValue;
                    else if (typeof parsedValue === 'number') factura[key] = parsedValue;
                    else if (parsedValue === undefined) factura[key] = undefined;
                    else factura[key] = rawValue;
                } catch (parseError: unknown) {
                    currentParsingError = `Error formato columna '${column.name}' fila ${i + 1}.`;
                    console.error(currentParsingError, parseError);
                    validRow = false; break;
                }
            }

            if (validRow && rawDateValue) {
                try {
                    let formattedDate = rawDateValue;
                    if (formattedDate.match(/^\d\//)) formattedDate = `0${formattedDate}`;
                    const invoiceDate = parse(formattedDate, 'dd/MM/yyyy', new Date());
                    if (!isValid(invoiceDate)) throw new Error(`Formato inválido.`);
                    const invoiceTimestamp = getTime(invoiceDate);
                    if (invoiceTimestamp < startDateTimestamp || invoiceTimestamp > endDateTimestamp) {
                        throw new Error(`Fuera rango (${configStartDateString} - ${configEndDateString}).`);
                    }
                    factura.date = formattedDate;
                } catch (dateError: unknown) {
                    currentParsingError = `Error fecha fila ${i + 1}: ${(dateError instanceof Error) ? dateError.message : 'Inválida'}`;
                    console.error(currentParsingError);
                    validRow = false;
                }
            } else if (validRow && !rawDateValue) {
                currentParsingError = `Falta valor 'date' fila ${i + 1}.`;
                console.error(currentParsingError);
                validRow = false;
            }

            if (factura.infancyExpense === undefined) validRow = false;
            console.log(factura, validRow);

            if (validRow) data.push(factura as Factura);

        } else {
            console.warn(`Fila ${i + 1} ignorada: ${values.length} columnas != ${columns.length}.`);
            currentParsingError = `Número columnas incorrecto fila ${i + 1}.`;
            break; // Detener si hay error de estructura
        }
    }

    parsingError.value = currentParsingError; // Asignar error al final
    return currentParsingError ? [] : data; // Devolver vacío si hubo error
};

// Maneja la selección del archivo CSV
const handleFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    // Resetear todo lo relacionado con CSV y la carpeta opcional
    csvFile.value = null;
    csvData.value = [];
    parsingError.value = null;
    error.value = null;
    results.value = [];
    invoiceFolderHandle.value = null;
    foundInvoicePdfs.value.clear();
    missingInvoiceNumbers.value = [];
    csvMergedPdfUrl.value = null;
    csvMergeError.value = null;

    if (target.files && target.files[0]) {
        const file = target.files[0];
        csvFile.value = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                if (!content) throw new Error("No se pudo leer el contenido.");
                csvData.value = parseCsv(content);
                if (csvData.value.length === 0 && !parsingError.value) {
                    parsingError.value = "CSV vacío o sin datos válidos.";
                }
            } catch (err: unknown) {
                parsingError.value = (err instanceof Error) ? err.message : "Error desconocido al procesar CSV.";
                csvFile.value = null;
                csvData.value = [];
            }
        };
        reader.onerror = () => {
            parsingError.value = "No se pudo leer el archivo CSV.";
            csvFile.value = null;
        };
        reader.readAsText(file);
    }
};

// Descarga la plantilla CSV
const downloadTemplate = () => {
    console.log('Descargando plantilla CSV...');
    const csvHeader = columns.map(c => `"${c.name}"`).join(',');
    const csvExample = '"1","P001","01/07/2024","Actividad A","Concepto A","A1234567Z",,"50.00","50.00","50.00",';
    const csvContent = `${csvHeader}\n${csvExample}`;
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_facturas.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Abre selector de directorio y busca los PDF de facturas según CSV.
 */
const selectAndFindInvoicePdfs = async () => {
    if (!('showDirectoryPicker' in window) || typeof window.showDirectoryPicker !== 'function') {
        csvMergeError.value = 'Navegador no soporta selección de carpetas.';
        return;
    }
    if (csvData.value.length === 0) {
        csvMergeError.value = 'Carga primero un archivo CSV.';
        return;
    }

    isProcessingFolder.value = true;
    invoiceFolderHandle.value = null; // Resetear por si seleccionan otra vez
    foundInvoicePdfs.value.clear();
    missingInvoiceNumbers.value = [];
    csvMergeError.value = null;
    csvMergedPdfUrl.value = null; // Resetear resultado anterior

    try {
        const handle = await window.showDirectoryPicker();
        invoiceFolderHandle.value = handle;

        const expectedFiles = new Map<string, string>(); // Map<formattedName, originalNumber>
        csvData.value.forEach(factura => {
            const formattedNum = formatInvoiceNumber(factura.number);
            if (formattedNum !== 'invalid' && factura.number) {
                expectedFiles.set(`factura${formattedNum}.pdf`, factura.number);
            }
        });

        const foundMap = new Map<string, File>();
        const tempMissing: string[] = Array.from(expectedFiles.values()); // Empezar con todos como faltantes

        for await (const entry of handle.values()) {
            if (entry.kind === 'file' && expectedFiles.has(entry.name.toLowerCase())) {
                const originalNumber = expectedFiles.get(entry.name.toLowerCase())!;
                try {
                    const file = await entry.getFile();
                    foundMap.set(originalNumber, file);
                    // Quitar de la lista de faltantes
                    const missingIndex = tempMissing.indexOf(originalNumber);
                    if (missingIndex > -1) {
                        tempMissing.splice(missingIndex, 1);
                    }
                    console.log(`Factura encontrada: ${entry.name} (Num: ${originalNumber})`);
                } catch (fileError) {
                    console.warn(`No se pudo acceder a ${entry.name}:`, fileError);
                    csvMergeError.value = `Error al leer ${entry.name}. Verifica permisos.`;
                    // No detener, pero marcar como no encontrada si falla la lectura
                    if (!tempMissing.includes(originalNumber)) {
                        tempMissing.push(originalNumber);
                    }
                }
            }
        }

        foundInvoicePdfs.value = foundMap;
        missingInvoiceNumbers.value = tempMissing;

        if (foundMap.size === 0) {
            csvMergeError.value = 'No se encontró ninguna factura con el formato esperado en la carpeta.';
        } else if (tempMissing.length > 0) {
            // Es un warning, no un error bloqueante si se encontraron algunas
            console.warn(`Facturas del CSV no encontradas en la carpeta: ${tempMissing.join(', ')}`);
        }

    } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
            console.log('Selección de carpeta cancelada.');
            // No establecer error si cancela
        } else if (err instanceof Error && err.name === 'NotAllowedError') {
            csvMergeError.value = 'Permiso denegado para acceder a la carpeta.';
        } else {
            csvMergeError.value = `Error al procesar carpeta: ${(err instanceof Error) ? err.message : 'Desconocido'}`;
        }
        invoiceFolderHandle.value = null; // Resetear si hay error
    } finally {
        isProcessingFolder.value = false;
    }
};

/**
 * Genera los documentos: Anexo III y opcionalmente el PDF de facturas.
 */
const generateDocuments = async () => {
    if (csvData.value.length === 0) {
        error.value = 'Carga un archivo CSV válido primero.';
        return;
    }

    // Resetear estados de generación
    isGenerating.value = true;
    isMergingCsvPdfs.value = !!invoiceFolderHandle.value && foundInvoicePdfs.value.size > 0;
    error.value = null;
    csvMergeError.value = null;
    results.value = [];
    if (csvMergedPdfUrl.value) URL.revokeObjectURL(csvMergedPdfUrl.value); // Limpiar URL anterior
    csvMergedPdfUrl.value = null;
    generationProgress.value = 0;
    csvMergeProgress.value = 0;

    // --- 1. Generación Anexo III (siempre se intenta) --- 
    console.log('Iniciando generación de Anexo III...');
    const pdfConfig = appConfig.pdfTemplate;
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

        const firstPageTemplate = await getNewAnexoPage();
        actualAnexoDoc = firstPageTemplate.doc;
        actualAnexoForm = firstPageTemplate.form;
        anexoDocsList.push(actualAnexoDoc);
        generationProgress.value = 5;

        for (let i = 0; i < csvData.value.length; i++) {
            const factura = csvData.value[i];
            const proyectExpense = factura.infancyExpense ?? 0; // TODO: Confirmar campo!

            if (factura.expense === undefined || !factura.number) {
                console.warn(`Factura ${factura.number || 'desconocida'} saltada en Anexo III por datos faltantes.`);
                continue; // Saltar fila en Anexo si faltan datos
            }

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

            fillInvoiceRow(actualAnexoForm!, fields, factura, invoiceInTemplateIndex, proyectExpense);
            subtotalAcc += proyectExpense;
            anexoTotalAcc += proyectExpense;
            invoiceInTemplateIndex++;
            generationProgress.value = 5 + Math.round(((i + 1) / csvData.value.length) * 45); // Anexo III = 50% del progreso total
        }

        if (actualAnexoForm) {
            finalizePage(actualAnexoForm, fields, {
                total: anexoTotalAcc,
                entityName: formData.associationName,
                entityNif: formData.associationCif,
                deputyName: formData.representativeName,
                deputyNif: formData.representativeId
            });
        }

        const finalAnexoDoc = await PDFLibDocument.create();

        for (const docToCopyFrom of anexoDocsList) {
            docToCopyFrom.getForm()?.flatten();
            const [copiedPage] = await finalAnexoDoc.copyPages(docToCopyFrom, [0]);
            finalAnexoDoc.addPage(copiedPage);
        }

        const anexoFilename = `AnexoIII_${formData.associationName || 'Asociacion'}.pdf`;
        const anexoUrl = await savePdfToBlobUrl(finalAnexoDoc, anexoFilename);
        results.value = [{ name: anexoFilename, url: anexoUrl }];
        generationProgress.value = 50; // Anexo III completado (50% del total)
        console.log('Anexo III generado con éxito.');

    } catch (err: unknown) {
        console.error('Error generando Anexo III:', err);
        error.value = `Error Anexo III: ${(err instanceof Error) ? err.message : 'Desconocido'}`;
        generationProgress.value = 50; // Marcar como completado aunque falle
    } finally {
        // Marcar Anexo III como no generando aquí si no hay fusión
        if (!isMergingCsvPdfs.value) isGenerating.value = false;
    }

    // --- 2. Fusión Facturas PDF (si aplica) --- 
    if (isMergingCsvPdfs.value) {
        console.log(`Iniciando fusión de ${foundInvoicePdfs.value.size} facturas PDF encontradas...`);
        const masterInvoicePdf = await PDFLibDocument.create();
        let facturasProcesadas = 0;
        const facturasAProcesar = csvData.value.filter(f => f.number && foundInvoicePdfs.value.has(f.number));

        try {
            for (const factura of facturasAProcesar) {
                const file = foundInvoicePdfs.value.get(factura.number!)!;
                console.log(` - Procesando ${file.name} (Num: ${factura.number})...`);
                csvMergeProgress.value = Math.round((facturasProcesadas / facturasAProcesar.length) * 95); // Fusión = 50% del progreso total

                try {
                    const tempPdf = await loadPdf(file);
                    const tempPages = await masterInvoicePdf.copyPages(tempPdf, tempPdf.getPageIndices());
                    tempPages.forEach(page => masterInvoicePdf.addPage(page));
                } catch (processError) {
                    console.warn(`Error procesando ${file.name} para fusión:`, processError);
                    if (!csvMergeError.value) csvMergeError.value = "Errores en facturas: ";
                    csvMergeError.value += `${file.name}; `;
                }
                facturasProcesadas++;
                // Pausa opcional
                if (facturasProcesadas % 10 === 0) await new Promise(resolve => setTimeout(resolve, 20));
            }

            if (masterInvoicePdf.getPageCount() === 0) {
                // Si no se pudo añadir ninguna página (todos los PDFs fallaron al cargar/copiar)
                if (!csvMergeError.value) csvMergeError.value = "No se pudo añadir ninguna página de las facturas encontradas.";
            } else {
                console.log('Guardando PDF de facturas fusionadas...');
                csvMergeProgress.value = 98;
                const pdfBytes = await masterInvoicePdf.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                csvMergedPdfUrl.value = URL.createObjectURL(blob);
                console.log('PDF de facturas generado:', csvMergedPdfUrl.value);
            }

            csvMergeProgress.value = 100;
            console.log('Proceso de fusión de facturas completado.');

        } catch (err: unknown) {
            console.error('Error crítico durante fusión de facturas:', err);
            if (!csvMergeError.value) csvMergeError.value = ""; else csvMergeError.value += " | ";
            csvMergeError.value += `Error Fusión: ${(err instanceof Error) ? err.message : 'Desconocido'}`;
            if (csvMergedPdfUrl.value) URL.revokeObjectURL(csvMergedPdfUrl.value);
            csvMergedPdfUrl.value = null;
            csvMergeProgress.value = 100; // Marcar como terminado aunque falle
        } finally {
            isMergingCsvPdfs.value = false;
            // Ahora sí, marcar la generación general como terminada
            isGenerating.value = false;
        }
    } else {
        // Si no se hizo fusión, la generación general termina aquí
        isGenerating.value = false;
        if (invoiceFolderHandle.value && foundInvoicePdfs.value.size === 0) {
            console.log('No se encontraron facturas válidas para fusionar.');
            // Podríamos poner un warning/info en csvMergeError si se desea
            // csvMergeError.value = 'No se encontraron facturas válidas en la carpeta seleccionada.'
        }
        else if (!invoiceFolderHandle.value) {
            console.log('No se seleccionó carpeta para buscar facturas.');
        }
    }

};

// TODO:
// - ACLARAR QUÉ CAMPO USAR EN ANEXO III (infancyExpense o participationExpense)
// - Implementar descarga ZIP real si se necesita
// - Añadir validación más robusta a campos de formulario
// - Considerar gestión de carpeta destino para guardar

</script>

<style scoped>
/* Estilos específicos si son necesarios */
</style>
