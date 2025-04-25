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
                    <strong>Descarga la Plantilla:</strong> Asegúrate de que tu Excel sigue el formato correcto
                    descargando nuestra plantilla.
                    <div class="mt-2 pl-6">
                        <!-- Placeholder para captura de pantalla -->
                        <img src="https://via.placeholder.com/300x150/e2e8f0/94a3b8?text=Ejemplo+Plantilla"
                            alt="Ejemplo de plantilla Excel" class="rounded border my-2">
                    </div>
                </li>
                <li>
                    <UIcon name="i-heroicons-table-cells" class="mr-2 align-middle" />
                    <strong>Rellena tus Datos:</strong> Completa la plantilla Excel con la información de tu asociación
                    y los datos necesarios.
                </li>
                <li>
                    <UIcon name="i-heroicons-arrow-up-tray" class="mr-2 align-middle" />
                    <strong>Sube el Archivo:</strong> Carga el archivo Excel completado en el formulario de abajo.
                    <div class="mt-2 pl-6">
                        <!-- Placeholder para captura de pantalla -->
                        <img src="https://via.placeholder.com/300x150/e2e8f0/94a3b8?text=Ejemplo+Carga"
                            alt="Ejemplo de carga de archivo" class="rounded border my-2">
                    </div>
                </li>
                <li>
                    <UIcon name="i-heroicons-play-circle" class="mr-2 align-middle" />
                    <strong>Video Demostrativo:</strong> Mira nuestro breve video para ver el proceso completo.
                    <div class="mt-2 pl-6">
                        <!-- Placeholder para video -->
                        <div
                            class="aspect-video bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-gray-500">
                            (Video demostrativo 1-2 min)
                        </div>
                    </div>
                </li>
                <li>
                    <UIcon name="i-heroicons-document-check" class="mr-2 align-middle" />
                    <strong>Genera los PDFs:</strong> Haz clic en "Generar PDFs" y espera a que la magia suceda.
                </li>
                <li>
                    <UIcon name="i-heroicons-arrow-down-tray" class="mr-2 align-middle" />
                    <strong>Descarga tus Documentos:</strong> Una vez generados, podrás descargar los PDFs
                    individualmente o como un archivo comprimido.
                </li>
            </ol>
        </section>

        <!-- Formulario Principal -->
        <section class="mb-12">
            <h2 class="text-2xl font-semibold mb-6">Información y Carga de Archivo</h2>
            <UCard>
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

                    <UFormGroup label="Carpeta Destino (Opcional)" name="destinationFolder">
                        <UInput v-model="formData.destinationFolder" type="text"
                            placeholder="Ej: /Documentos/Subvenciones2024" icon="i-heroicons-folder-open" />
                        <template #help>
                            Indica una ruta si quieres guardar los PDFs en una carpeta específica en tu equipo (requiere
                            permisos). Déjalo vacío para descargar desde el navegador.
                        </template>
                    </UFormGroup>

                </UForm>
            </UCard>

            <UCard class="mt-6">
                <template #header>
                    <h3 class="text-lg font-medium">Carga de Archivo CSV</h3>
                </template>
                <div class="space-y-4">
                    <UFormGroup label="Archivo CSV (.csv)" name="csvFile" required>
                        <UInput type="file" size="lg" accept=".csv, text/csv" @change="handleFileChange" />
                        <!-- TODO: Añadir vista previa más detallada (ej. primeras filas) -->
                    </UFormGroup>
                    <div class="flex items-center space-x-4">
                        <UButton variant="outline" icon="i-heroicons-document-arrow-down"
                            label="Descargar Plantilla CSV" @click="downloadTemplate" />
                        <!-- Indicador de estado/vista previa -->
                        <span v-if="!csvFile" class="text-sm text-gray-500 dark:text-gray-400">(No hay archivo
                            cargado)</span>
                        <span v-else class="text-sm text-green-600 dark:text-green-400 truncate">
                            <UIcon name="i-heroicons-check-circle" class="mr-1" /> {{ csvFile.name }} ({{ csvData.length
                            }} filas)
                        </span>
                    </div>
                    <div v-if="parsingError" class="text-sm text-red-500">
                        Error al leer el CSV: {{ parsingError }}
                    </div>
                </div>
            </UCard>
        </section>

        <!-- Sección de Generación -->
        <section>
            <h2 class="text-2xl font-semibold mb-6">Generación de Documentos</h2>
            <UCard>
                <div class="text-center">
                    <UButton size="xl" color="primary" icon="i-heroicons-cog-6-tooth" label="Generar PDFs" class="mb-4"
                        :loading="isGenerating" :disabled="!csvFile || csvData.length === 0 || isGenerating"
                        @click="generatePdfs" />
                    <!-- Indicador de progreso -->
                    <div v-if="isGenerating" class="my-4"> <!-- Visible durante la generación -->
                        <p class="mb-2">Generando documentos... ({{ generationProgress }}%)</p>
                        <UProgress :value="generationProgress" indicator />
                    </div>
                    <!-- Área de resultados -->
                    <div v-if="!isGenerating && results.length > 0" class="mt-6"> <!-- Visible si hay resultados -->
                        <h3 class="text-lg font-medium mb-2">Resultados</h3>
                        <p class="text-green-600 dark:text-green-400 mb-4">¡Documentos generados con éxito!</p>
                        <ul class="space-y-2 text-left max-w-md mx-auto">
                            <li v-for="(result, index) in results" :key="index">
                                <a :href="result.url" download :title="`Descargar ${result.name}`"
                                    class="text-primary hover:underline flex items-center">
                                    <UIcon name="i-heroicons-document-arrow-down" class="mr-2 flex-shrink-0" />
                                    <span class="truncate">{{ result.name }}</span>
                                </a>
                            </li>
                        </ul>
                        <UButton variant="outline" icon="i-heroicons-archive-box-arrow-down"
                            label="Descargar Todos (.zip)" class="mt-4" @click="downloadAllResults" />
                    </div>
                    <!-- Mensaje de error -->
                    <div v-if="!isGenerating && error" class="mt-6"> <!-- Visible si hay error -->
                        <p class="text-red-600 dark:text-red-400">{{ error }}</p>
                    </div>
                </div>
            </UCard>
        </section>

    </UContainer>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useAppConfig } from '#app'; // Importar hook de configuración
import { parse, getTime, isValid } from 'date-fns'; // Importar funciones de date-fns
import type { PDFDocument, PDFForm } from 'pdf-lib'; // Añadir importación de tipos aquí

// Importar utilidades y tipos necesarios
import {
    loadPdfTemplate,
    fillInvoiceRow,
    finalizePage,
    savePdfToBlobUrl,
    // mergePdfs, // Descomentar si se implementa la fusión
    type PdfTemplate,
    type Factura // Importar Factura desde donde se definió (ahora utils)
} from '~/utils/pdfUtils';

// Obtener configuración de la app
const appConfig = useAppConfig();
const { startDate: configStartDateString, endDate: configEndDateString } = appConfig.invoiceDateRange;

// Parsear fechas de configuración una vez para eficiencia
// Usamos parse con el formato esperado YYYY-MM-DD de la config
const startDate = parse(configStartDateString, 'dd/MM/yyyy', new Date());
const endDate = parse(configEndDateString, 'dd/MM/yyyy', new Date());

// Validar que las fechas de config sean válidas
if (!isValid(startDate) || !isValid(endDate)) {
    console.error('Fechas de inicio/fin en app.config.ts no son válidas!');
    // Podrías mostrar un error al usuario o usar fechas por defecto
}

const startDateTimestamp = isValid(startDate) ? getTime(startDate) : -Infinity;
const endDateTimestamp = isValid(endDate) ? getTime(endDate) : Infinity;

// Estado del formulario
const formData = reactive({
    associationName: 'Asociación Ejemplo XYZ',
    associationCif: 'G12345678',
    representativeName: 'Juan Pérez García',
    representativeId: '12345678A',
    destinationFolder: ''
});

// --- Mantener estas definiciones aquí por ahora --- 
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
// --- Fin definiciones CSV locales --- 

// Estado del archivo CSV
const csvFile = ref<File | null>(null);
const csvData = ref<Factura[]>([]); // Usar Factura[] como tipo
const parsingError = ref<string | null>(null);

// Estado de generación
const isGenerating = ref(false);
const generationProgress = ref(0); // Progreso de 0 a 100
const results = ref<{ name: string; url: string }[]>([]); // Array para los enlaces de los PDFs generados
const error = ref<string | null>(null); // Mensaje de error de generación

// --- Funciones ---

/**
 * Parsea un string CSV a un array de objetos Factura.
 * Valida que la fecha de la factura esté dentro del rango definido en app.config.ts
 */
const parseCsv = (csvString: string): Factura[] => {
    const lines = csvString.trim().split('\n');
    if (lines.length < 1) {
        return [];
    }

    const data: Factura[] = [];
    parsingError.value = null; // Limpiar error de parseo al inicio

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
                inQuotes = true;
                continue;
            }

            if (char === '"' && inQuotes) {
                if (nextChar === '"') {
                    currentField += '"';
                    j++;
                } else {
                    // Fin de las comillas, verificar si es el final del campo
                    if (line[j + 1] === ',' || j + 1 === line.length) {
                        inQuotes = false;
                        continue; // Saltar la comilla final
                    } else {
                        // Comilla dentro de un campo no escapada? Tratar como parte del campo
                        // O lanzar error si se requiere formato estricto
                        currentField += char;
                    }
                }
            } else if (char === ',' && !inQuotes) {
                values.push(currentField); // No hacer trim aquí, se hará al asignar
                currentField = '';
            } else {
                currentField += char;
            }
        }
        values.push(currentField); // Añadir el último campo

        if (values.length === columns.length) {
            const factura = {} as Partial<Factura>;
            let validRow = true;
            let rawDateValue = ''; // Para almacenar el valor string de la fecha

            for (let k = 0; k < columns.length; k++) {
                const column = columns[k];
                const rawValue = values[k].trim();

                // Guardar el valor raw de la fecha para validación posterior
                if (column.name === 'date') {
                    rawDateValue = rawValue;
                }

                try {
                    const parsedValue = column.parse
                        ? column.parse(rawValue)
                        : rawValue;

                    const key = column.name as keyof Factura;

                    if (typeof parsedValue === 'string') {
                        (factura as Record<keyof Factura, string | number | undefined>)[key] = parsedValue;
                    } else if (typeof parsedValue === 'number') {
                        (factura as Record<keyof Factura, string | number | undefined>)[key] = parsedValue;
                    } else if (parsedValue === undefined) {
                        (factura as Record<keyof Factura, string | number | undefined>)[key] = undefined;
                    } else {
                        console.warn(`Tipo inesperado para columna ${key}: ${typeof parsedValue}`);
                        (factura as Record<keyof Factura, string | number | undefined>)[key] = rawValue;
                    }

                } catch (parseError: unknown) {
                    const errorMsg = `Error en formato de columna '${column.name}' en fila ${i + 1}.`;
                    console.error(errorMsg, parseError);
                    parsingError.value = errorMsg;
                    validRow = false;
                    break;
                }
            }

            // --- Validación de Fecha --- 
            if (validRow && rawDateValue) {
                try {
                    let formattedDate = rawDateValue;
                    // Añadir cero inicial si el día es de un solo dígito (ej: 1/12/2024 -> 01/12/2024)
                    if (formattedDate.match(/^\d\//)) {
                        formattedDate = `0${formattedDate}`;
                    }
                    // Intentar parsear la fecha en formato dd/MM/yyyy
                    const invoiceDate = parse(formattedDate, 'dd/MM/yyyy', new Date());

                    if (!isValid(invoiceDate)) {
                        throw new Error(`Formato de fecha inválido.`);
                    }

                    const invoiceTimestamp = getTime(invoiceDate);

                    // Comparar timestamps
                    if (invoiceTimestamp < startDateTimestamp || invoiceTimestamp > endDateTimestamp) {
                        throw new Error(`La fecha está fuera del rango permitido (${configStartDateString} - ${configEndDateString}).`);
                    }

                    // Opcional: guardar la fecha parseada en el objeto
                    factura.date = formattedDate;

                } catch (dateError: unknown) {
                    const errorMsg = `Error en fecha de factura (columna 'date') en fila ${i + 1}: ${(dateError instanceof Error) ? dateError.message : 'Error desconocido'}`;
                    console.error(errorMsg);
                    parsingError.value = errorMsg;
                    validRow = false;
                }
            } else if (validRow && !rawDateValue) {
                // Si la fila era válida pero no se encontró valor para la fecha
                const errorMsg = `Error en fila ${i + 1}: Falta el valor en la columna 'date'.`;
                console.error(errorMsg);
                parsingError.value = errorMsg;
                validRow = false;
            }
            // --- Fin Validación de Fecha ---

            if (validRow) {
                data.push(factura as Factura);
            }
            // Si !validRow, el error ya está en parsingError.value y la fila se ignora

        } else {
            console.warn(`Fila ${i + 1} ignorada: número de columnas (${values.length}) no coincide con columnas definidas (${columns.length}). Línea: ${line}`);
            // Podrías establecer parsingError aquí también si es un error crítico
        }
    }

    // Si hubo algún error durante el parseo, invalidar los datos parseados
    if (parsingError.value) {
        return []; // Devolver array vacío para indicar fallo
    }

    return data;
};

// Maneja la selección del archivo CSV
const handleFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    csvFile.value = null; // Resetear estado previo
    csvData.value = [];
    parsingError.value = null;
    error.value = null; // Limpiar error de generación también
    results.value = [];

    if (target.files && target.files[0]) {
        const file = target.files[0];
        csvFile.value = file;
        console.log('Archivo CSV seleccionado:', file.name);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                if (!content) {
                    throw new Error("No se pudo leer el contenido del archivo.");
                }
                csvData.value = parseCsv(content);
                console.log('CSV Parseado:', csvData.value);
                if (csvData.value.length === 0) {
                    parsingError.value = "El archivo CSV parece estar vacío o no contiene datos válidos.";
                }
            } catch (err: unknown) {
                console.error('Error al parsear CSV:', err);
                if (err instanceof Error) {
                    parsingError.value = err.message;
                } else {
                    parsingError.value = "Ocurrió un error desconocido al procesar el archivo.";
                }
                csvFile.value = null; // Invalidar selección si hay error de parseo
            }
        };
        reader.onerror = (e) => {
            console.error('Error al leer archivo:', e);
            parsingError.value = "No se pudo leer el archivo.";
            csvFile.value = null;
        };
        reader.readAsText(file); // Leer como texto
    }
};

// Descarga la plantilla (simulado)
const downloadTemplate = () => {
    console.log('Descargando plantilla CSV...');
    alert('Funcionalidad de descarga de plantilla CSV pendiente.');
};

// Inicia la generación de PDFs usando las utilidades
const generatePdfs = async () => {
    if (!csvFile.value || csvData.value.length === 0) {
        error.value = 'Por favor, carga un archivo CSV válido primero.';
        if (parsingError.value) error.value += ` (${parsingError.value})`;
        return;
    }

    isGenerating.value = true;
    error.value = null;
    parsingError.value = null;
    results.value = [];
    generationProgress.value = 0;
    const totalFacturas = csvData.value.length;
    let facturasProcesadas = 0;

    // Obtener configuración de campos PDF
    const pdfConfig = appConfig.pdfTemplate;
    const MAX_ROWS = pdfConfig.maxRowsPerPage;
    const fields = pdfConfig.fields;

    console.log('Iniciando generación de Anexo III...');
    console.log('Datos formulario:', formData);
    console.log(`Procesando ${totalFacturas} facturas.`);

    const docsList: PDFDocument[] = [];
    let actualDoc: PDFDocument | null = null;
    let actualForm: PDFForm | null = null;
    let invoiceInTemplateIndex = 0;
    let subtotalAcc = 0;
    let totalAcc = 0;

    try {
        // Función interna para obtener una nueva página (template)
        const getNewPage = async (): Promise<PdfTemplate> => {
            console.log('Cargando/Copiando plantilla Anexo III...');
            // Para la primera página, carga el original
            // Para las siguientes, podríamos copiar la primera para eficiencia si es idéntica
            // O cargar siempre el original si hay variaciones o es más simple
            return await loadPdfTemplate('/Anexo III.pdf');
        };

        // Cargar la primera página
        const firstPageTemplate = await getNewPage();
        actualDoc = firstPageTemplate.doc;
        actualForm = firstPageTemplate.form;
        docsList.push(actualDoc);
        generationProgress.value = 5; // Progreso inicial

        // Iterar sobre las facturas parseadas
        for (const factura of csvData.value) {
            // --- Determinar el gasto del proyecto --- 
            // !! ACLARACIÓN NECESARIA: ¿Usar infancyExpense o participationExpense? !!
            const proyectExpense = factura.infancyExpense; // Usando infancy como placeholder

            // Saltar si falta información esencial
            if (factura.expense === undefined || proyectExpense === undefined || factura.number === undefined) {
                console.warn(`Factura ${factura.number || 'desconocida'} saltada por datos faltantes.`);
                facturasProcesadas++; // Contar como procesada para el progreso
                generationProgress.value = 5 + Math.round((facturasProcesadas / totalFacturas) * 90); // Actualizar progreso
                continue;
            }

            // --- Manejo de Paginación --- 
            if (invoiceInTemplateIndex >= MAX_ROWS) {
                console.log(`Página llena (${MAX_ROWS} filas). Finalizando página...`);
                // Finalizar página actual (subtotal)
                console.log(subtotalAcc);
                finalizePage(actualForm!, fields, {
                    subtotal: subtotalAcc,
                    entityName: formData.associationName,
                    entityNif: formData.associationCif,
                    deputyName: formData.representativeName,
                    deputyNif: formData.representativeId,
                });

                // Cargar nueva página
                const nextPageTemplate = await getNewPage();
                actualDoc = nextPageTemplate.doc;
                actualForm = nextPageTemplate.form;
                docsList.push(actualDoc);

                // Resetear contadores de página
                invoiceInTemplateIndex = 0;
                subtotalAcc = 0;
                console.log('Nueva página añadida.');
            }

            // --- Rellenar Fila Actual --- 
            fillInvoiceRow(actualForm!, fields, factura, invoiceInTemplateIndex, proyectExpense);

            // Actualizar acumuladores
            subtotalAcc += proyectExpense;
            totalAcc += proyectExpense;
            invoiceInTemplateIndex++;
            facturasProcesadas++;

            // Actualizar progreso
            generationProgress.value = 5 + Math.round((facturasProcesadas / totalFacturas) * 90); // 5% inicial + 90% para el bucle

        } // Fin del bucle for

        // --- Finalizar Última Página --- 
        if (actualForm) {
            console.log('Finalizando última página (total)...');
            finalizePage(actualForm, fields, {
                total: totalAcc,
                entityName: formData.associationName,
                entityNif: formData.associationCif,
                deputyName: formData.representativeName,
                deputyNif: formData.representativeId
            })
            // Aplanar AHORA si NO vamos a fusionar páginas después
            // actualForm.flatten();
        }

        // --- Fusión y Generación del PDF Final --- 
        console.log('Preparando PDF final...');
        let finalDoc: PDFDocument | null = null;
        const generatedResults: { name: string; url: string }[] = [];

        if (docsList.length === 0) {
            throw new Error("No se generaron páginas PDF."); // Caso improbable
        }

        if (docsList.length === 1) {
            // Caso de una sola página
            finalDoc = docsList[0];
            console.log('Se generó una sola página.');
        } else {
            // Caso de múltiples páginas: Fusionar
            console.log(`Fusionando ${docsList.length} páginas...`);
            finalDoc = docsList[0]; // Empezar con el primer documento
            // Iterar desde el segundo documento (índice 1)
            for (let i = 1; i < docsList.length; i++) {
                const docToCopy = docsList[i];
                // Copiar la primera (y única) página del documento actual
                const [copiedPage] = await finalDoc.copyPages(docToCopy, [0]);
                // Añadir la página copiada al documento final
                finalDoc.addPage(copiedPage);
                console.log(`Página ${i + 1} fusionada.`);
            }
            console.log('Fusión completada.');
        }

        // Aplanar el documento final ANTES de guardarlo
        console.log('Aplanando PDF final...');
        finalDoc.getForm()?.flatten();

        // Guardar el documento final fusionado
        console.log('Guardando PDF final...');
        const filename = `AnexoIII_${formData.associationName || 'Asociacion'}_Completo.pdf`;
        const url = await savePdfToBlobUrl(finalDoc, filename);
        generatedResults.push({ name: filename, url });

        results.value = generatedResults;
        generationProgress.value = 100;
        console.log('Generación completada. PDF único generado.');

    } catch (err: unknown) {
        console.error('Error durante la generación de PDFs:', err);
        error.value = `Error al generar los documentos: ${(err instanceof Error) ? err.message : 'Error desconocido'}`;
        results.value = []; // Limpiar resultados parciales si hubo error
    } finally {
        isGenerating.value = false;
    }
};

// Descarga todos los resultados (simulado)
const downloadAllResults = () => {
    console.log('Descargando todos los resultados (ZIP)...');
    alert('Funcionalidad de descarga de todos los resultados pendiente.');
};

// TODO:
// - Añadir validación detallada al formulario (UForm)
// - Implementar la lógica real de comunicación con el backend para:
//   - Enviar formData y csvData
//   - Iniciar el proceso de generación
//   - Obtener los resultados (URLs de los PDFs o el ZIP)
// - Implementar la descarga real de la plantilla y los resultados
// - Mejorar el parseo de CSV si se necesitan casos más complejos (librería externa?)
// - Considerar la gestión de la carpeta destino
// - Añadir feedback visual durante el parseo del CSV
</script>

<style scoped>
/* Estilos específicos si son necesarios, aunque Nuxt UI y Tailwind deberían cubrir la mayoría */
</style>
