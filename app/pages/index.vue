<template>
    <UContainer class="py-6 md:py-10 lg:max-w-6xl">
        <header class="mb-8 rounded-2xl border border-primary/15 bg-primary-50/70 p-6 dark:bg-primary-950/20 md:p-8">
            <div class="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-end">
                <div class="max-w-3xl">
                    <p class="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-medium text-primary-700 ring-1 ring-primary/15 dark:bg-gray-900 dark:text-primary-300">
                        <UIcon name="i-heroicons-document-check" class="size-4" />
                        Subvenciones Parla 2026
                    </p>
                    <h1 class="text-balance text-3xl font-bold tracking-tight text-gray-950 dark:text-white md:text-4xl">
                        Genera el Anexo III paso a paso
                    </h1>
                    <p class="mt-4 max-w-2xl text-pretty text-base leading-7 text-gray-700 dark:text-gray-300 md:text-lg">
                        Descarga la plantilla, sube tus facturas en CSV y revisa cada paso antes de descargar los documentos finales.
                    </p>
                </div>

                <div class="flex flex-col gap-3 rounded-xl bg-white p-4 ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
                    <UButton
                        size="lg"
                        icon="i-heroicons-document-arrow-down"
                        label="Descargar plantilla CSV"
                        href="/Facturas Subvención - Plantilla.csv"
                        external
                        :disabled="isGenerating || isProcessingFolder"
                    />
                    <p class="text-sm leading-6 text-gray-600 dark:text-gray-400">
                        Completa una fila por factura. Puedes volver aquí y subirla cuando esté lista.
                    </p>
                </div>
            </div>
        </header>

        <section class="mb-8 grid gap-3 md:grid-cols-4" aria-label="Estado del trámite">
            <div class="step-chip" :class="csvData.length > 0 ? 'step-chip-ready' : 'step-chip-pending'">
                <span class="step-number">1</span>
                <span>
                    <strong>CSV</strong>
                    <small>{{ csvStepStatus }}</small>
                </span>
            </div>
            <div class="step-chip" :class="hasAssociationData ? 'step-chip-ready' : 'step-chip-pending'">
                <span class="step-number">2</span>
                <span>
                    <strong>Datos</strong>
                    <small>{{ associationStepStatus }}</small>
                </span>
            </div>
            <div class="step-chip" :class="invoiceFolderHandle ? 'step-chip-ready' : 'step-chip-pending'">
                <span class="step-number">3</span>
                <span>
                    <strong>Facturas</strong>
                    <small>{{ invoiceStepStatus }}</small>
                </span>
            </div>
            <div class="step-chip" :class="showResultsSection ? 'step-chip-ready' : 'step-chip-pending'">
                <span class="step-number">4</span>
                <span>
                    <strong>Descarga</strong>
                    <small>{{ resultsStepStatus }}</small>
                </span>
            </div>
        </section>

        <main class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <div class="space-y-6">
                <UCard>
                    <template #header>
                        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 class="text-xl font-semibold text-gray-950 dark:text-white">1. Sube el CSV de facturas</h2>
                                <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Primero comprobamos que las filas tengan el formato esperado.</p>
                            </div>
                            <UButton
                                variant="outline"
                                icon="i-heroicons-document-arrow-down"
                                label="Plantilla"
                                href="/Facturas Subvención - Plantilla.csv"
                                external
                                :disabled="isGenerating || isProcessingFolder"
                            />
                        </div>
                    </template>

                    <div class="space-y-5">
                        <UFormField label="Archivo de facturas (.csv)" name="csvFile" required>
                            <UInput
                                type="file"
                                size="lg"
                                accept=".csv, text/csv"
                                :disabled="isGenerating || isProcessingFolder"
                                @change="handleFileChange"
                            />
                        </UFormField>

                        <div v-if="csvFile" class="status-panel status-panel-success">
                            <UIcon name="i-heroicons-check-circle" class="mt-0.5 size-5 shrink-0" />
                            <div class="min-w-0">
                                <p class="font-medium">{{ csvFile.name }}</p>
                                <p class="text-sm">{{ formatReadyRows(csvData.length) }}.</p>
                            </div>
                        </div>
                        <div v-else class="status-panel status-panel-muted">
                            <UIcon name="i-heroicons-arrow-up-tray" class="mt-0.5 size-5 shrink-0" />
                            <p>Cuando subas el CSV, aquí verás si las filas son válidas o qué hay que corregir.</p>
                        </div>

                        <div v-if="parsingError && parsingRowErrors.length === 0" class="status-panel status-panel-error" :title="parsingError">
                            <UIcon name="i-heroicons-exclamation-circle" class="mt-0.5 size-5 shrink-0" />
                            <div>
                                <p class="font-medium">No hemos podido leer el archivo</p>
                                <p class="text-sm">{{ parsingError }}</p>
                            </div>
                        </div>

                        <div v-if="parsingRowErrors.length > 0" class="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/20">
                            <div class="flex flex-col gap-4 text-red-700 dark:text-red-300 sm:flex-row sm:items-start sm:justify-between">
                                <div class="flex items-start gap-2">
                                <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 size-5 shrink-0" />
                                <div>
                                    <h3 class="font-semibold">Hay {{ formatCount(parsingRowErrors.length, 'error que corregir', 'errores que corregir') }} en el CSV</h3>
                                    <p class="text-sm">Corrige esas líneas y vuelve a subir el archivo.</p>
                                    <p v-if="parsingRowErrors[0]" class="mt-2 text-sm">
                                        Primer error: línea {{ parsingRowErrors[0].line }}, {{ parsingRowErrors[0].message }}
                                    </p>
                                </div>
                            </div>

                                <UModal
                                    title="Errores encontrados en el CSV"
                                    description="Revisa las líneas señaladas, corrige la plantilla y vuelve a subirla."
                                    :ui="{ content: 'max-w-4xl' }"
                                    scrollable
                                >
                                    <UButton
                                        color="error"
                                        variant="soft"
                                        icon="i-heroicons-list-bullet"
                                        trailing-icon="i-heroicons-arrow-top-right-on-square"
                                        label="Ver errores"
                                    />

                                    <template #body>
                                        <div class="overflow-x-auto rounded-xl border border-red-200 bg-white dark:border-red-900/60 dark:bg-gray-950">
                                            <UTable
                                                :data="parsingRowErrors"
                                                :columns="[
                                                    { accessorKey: 'line', header: 'Línea del archivo' },
                                                    { accessorKey: 'message', header: 'Error' }
                                                ]"
                                            />
                                        </div>
                                    </template>
                                </UModal>
                            </div>
                        </div>

                        <UModal
                            title="Columnas y formatos aceptados"
                            description="Consulta esta guía cuando estés preparando o corrigiendo la plantilla CSV."
                            :ui="{ content: 'max-w-5xl' }"
                            scrollable
                        >
                            <UButton
                                variant="soft"
                                color="neutral"
                                icon="i-heroicons-table-cells"
                                trailing-icon="i-heroicons-arrow-top-right-on-square"
                                label="Ver columnas y formatos aceptados"
                            />

                            <template #body>
                                <div class="space-y-5">
                                <div class="grid gap-4 md:grid-cols-2">
                                    <div class="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/70">
                                        <h3 class="font-semibold text-gray-900 dark:text-white">Fechas</h3>
                                        <ul class="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                            <li><strong>Preferido:</strong> DD/MM/YYYY.</li>
                                            <li><strong>También acepta:</strong> DD/MM/YY.</li>
                                            <li><strong>Ejemplos:</strong> 15/01/2026, 4/1/26, 31/12/25.</li>
                                            <li><strong>Rango:</strong> {{ configStartDateString }} a {{ configEndDateString }}.</li>
                                        </ul>
                                    </div>
                                    <div class="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/70">
                                        <h3 class="font-semibold text-gray-900 dark:text-white">Importes</h3>
                                        <ul class="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                            <li><strong>Correcto:</strong> coma decimal y punto de miles.</li>
                                            <li><strong>Ejemplos:</strong> 123,45 €, 1.234,56, 89,00 €.</li>
                                            <li><strong>Evita:</strong> 123.45 o 1,234.56.</li>
                                        </ul>
                                    </div>
                                </div>

                                <div class="csv-help-table-wrap">
                                    <table class="csv-help-table">
                                        <thead>
                                            <tr>
                                                <th>Columna</th>
                                                <th>Estado</th>
                                                <th>Descripción</th>
                                                <th>Si falta</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="column in csvColumnData" :key="column.column">
                                                <td>
                                                    <code>{{ column.column }}</code>
                                                </td>
                                                <td>
                                                    <span class="csv-badge" :class="getCsvRequiredClass(column.required)">
                                                        {{ getCsvRequiredLabel(column.required) }}
                                                    </span>
                                                </td>
                                                <td class="csv-description">
                                                    <span v-for="line in column.description.split('\n')" :key="line">{{ line }}</span>
                                                </td>
                                                <td class="csv-missing" :class="getCsvMissingClass(column.missing)">
                                                    {{ column.missing }}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div class="status-panel status-panel-warning">
                                    <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 size-5 shrink-0" />
                                    <p><strong>Gasto Justificable:</strong> si la columna existe y una fila está vacía, esa fila se descartará. Las columnas extra se ignoran.</p>
                                </div>
                                </div>
                            </template>
                        </UModal>
                    </div>
                </UCard>

                <UCard>
                    <template #header>
                        <div>
                            <h2 class="text-xl font-semibold text-gray-950 dark:text-white">2. Datos de la asociación</h2>
                            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Se guardan en este navegador para que no tengas que repetirlos cada vez.</p>
                        </div>
                    </template>

                    <UForm :state="formData" class="grid gap-4 md:grid-cols-2">
                        <UFormField label="Nombre de la asociación" name="associationName" required>
                            <UInput v-model="formData.associationName" placeholder="Asociación Ejemplo XYZ" />
                        </UFormField>
                        <UFormField label="CIF de la asociación" name="associationCif" required>
                            <UInput v-model="formData.associationCif" placeholder="G12345678" />
                        </UFormField>
                        <UFormField label="Nombre del representante" name="representativeName" required>
                            <UInput v-model="formData.representativeName" placeholder="Juan Pérez García" />
                        </UFormField>
                        <UFormField label="CIF/DNI del representante" name="representativeId" required>
                            <UInput v-model="formData.representativeId" placeholder="12345678A" />
                        </UFormField>
                    </UForm>
                </UCard>

                <UCard>
                    <template #header>
                        <div>
                            <h2 class="text-xl font-semibold text-gray-950 dark:text-white">3. Adjunta facturas PDF, si las necesitas</h2>
                            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Este paso es opcional. Si eliges una carpeta, se generará también un PDF único con las facturas encontradas.</p>
                        </div>
                    </template>

                    <div class="grid gap-5 md:grid-cols-[minmax(0,1fr)_220px] md:items-start">
                        <div class="space-y-3 text-sm leading-6 text-gray-700 dark:text-gray-300">
                            <p>Los archivos deben llamarse <code>facturaNNN.pdf</code>, por ejemplo <code>factura001.pdf</code> o <code>factura042.pdf</code>.</p>
                            <p>El número <code>NNN</code> debe coincidir con la columna <code>#</code> del CSV.</p>
                            <p v-if="!supportsInvoiceFolderPicker" class="text-amber-700 dark:text-amber-300">La selección de carpetas requiere un navegador compatible como Chrome o Edge.</p>
                        </div>

                        <UButton
                            class="w-full justify-center"
                            icon="i-heroicons-folder-arrow-down"
                            label="Elegir carpeta"
                            :disabled="csvData.length === 0 || isGenerating || isProcessingFolder || !supportsInvoiceFolderPicker"
                            :loading="isProcessingFolder"
                            @click="selectAndFindInvoicePdfs"
                        />
                    </div>

                    <div class="mt-5 space-y-3">
                        <div v-if="searchError" class="status-panel status-panel-error">
                            <UIcon name="i-heroicons-exclamation-circle" class="mt-0.5 size-5 shrink-0" />
                            <p><strong>Error carpeta:</strong> {{ searchError }}</p>
                        </div>
                        <div v-else-if="invoiceFolderHandle" class="status-panel status-panel-success">
                            <UIcon name="i-heroicons-check-circle" class="mt-0.5 size-5 shrink-0" />
                            <p>
                                Carpeta <strong>{{ invoiceFolderHandle.name }}</strong> seleccionada.
                                <span v-if="!isProcessingFolder">{{ formatFoundInvoices(foundInvoicePdfs.size, csvData.length) }}.</span>
                            </p>
                        </div>
                        <div v-else class="status-panel status-panel-muted">
                            <UIcon name="i-heroicons-folder" class="mt-0.5 size-5 shrink-0" />
                            <p>Puedes saltarte este paso y generar solo el Anexo III.</p>
                        </div>
                        <div v-if="missingInvoiceNumbers.length > 0 && !isProcessingFolder && !searchError" class="status-panel status-panel-warning">
                            <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 size-5 shrink-0" />
                            <p><strong>No encontradas:</strong> {{ missingInvoiceNumbers.join(', ') }}. Revisa el nombre de archivo o la columna #.</p>
                        </div>
                    </div>
                </UCard>
            </div>

            <aside class="space-y-6 lg:sticky lg:top-6">
                <UCard>
                    <template #header>
                        <h2 class="text-xl font-semibold text-gray-950 dark:text-white">4. Genera y descarga</h2>
                    </template>

                    <div class="space-y-5">
                        <div class="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/70">
                            <h3 class="font-medium text-gray-950 dark:text-white">Antes de generar</h3>
                            <ul class="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                <li class="flex gap-2">
                                    <UIcon :name="csvData.length > 0 ? 'i-heroicons-check-circle' : 'i-heroicons-clock'" class="mt-0.5 size-4 shrink-0" :class="csvData.length > 0 ? 'text-green-600' : 'text-gray-400'" />
                                    CSV válido cargado
                                </li>
                                <li class="flex gap-2">
                                    <UIcon :name="hasAssociationData ? 'i-heroicons-check-circle' : 'i-heroicons-clock'" class="mt-0.5 size-4 shrink-0" :class="hasAssociationData ? 'text-green-600' : 'text-gray-400'" />
                                    Datos obligatorios completos
                                </li>
                                <li class="flex gap-2">
                                    <UIcon name="i-heroicons-information-circle" class="mt-0.5 size-4 shrink-0 text-primary" />
                                    Facturas PDF opcionales
                                </li>
                            </ul>
                        </div>

                        <UButton
                            block
                            size="xl"
                            color="primary"
                            icon="i-heroicons-cog-6-tooth"
                            label="Generar documentos"
                            :loading="isGenerating"
                            :disabled="!isReadyToGenerate || isGenerating"
                            @click="generateDocuments"
                        />
                        <p v-if="!isReadyToGenerate && !isGenerating" class="text-sm text-gray-600 dark:text-gray-400">
                            Completa el CSV y los datos obligatorios para activar la generación.
                        </p>
                    </div>
                </UCard>

                <UCard v-if="showResultsSection || isGenerating">
                    <template #header>
                        <h2 class="text-xl font-semibold text-gray-950 dark:text-white">Resultados</h2>
                    </template>

                    <div v-if="isGenerating" class="space-y-4">
                        <div v-if="isGeneratingAnexo">
                            <div class="mb-2 flex justify-between text-sm font-medium">
                                <span>Generando Anexo III</span>
                                <span>{{ anexoGenerationProgress }}%</span>
                            </div>
                            <UProgress :value="anexoGenerationProgress" indicator size="sm" />
                        </div>
                        <div v-if="isMergingPdfs">
                            <div class="mb-2 flex justify-between text-sm font-medium">
                                <span>Uniendo facturas</span>
                                <span>{{ pdfMergeProgress }}%</span>
                            </div>
                            <UProgress :value="pdfMergeProgress" indicator size="sm" />
                        </div>
                    </div>

                    <div v-else class="space-y-5">
                        <div>
                            <h3 class="font-semibold text-gray-950 dark:text-white">Anexo III</h3>
                            <div v-if="anexoResults.length > 0" class="mt-3 space-y-2">
                                <p class="text-sm text-green-700 dark:text-green-300">Documento generado correctamente.</p>
                                <a
                                    v-for="(result, index) in anexoResults"
                                    :key="`anexo-${index}`"
                                    :href="result.url"
                                    :download="result.name"
                                    :title="`Descargar ${result.name}`"
                                    class="download-link"
                                >
                                    <UIcon name="i-heroicons-arrow-down-tray" class="size-4 shrink-0" />
                                    <span class="truncate">{{ result.name }}</span>
                                </a>
                            </div>
                            <div v-else-if="anexoError" class="status-panel status-panel-error mt-3">
                                <UIcon name="i-heroicons-exclamation-circle" class="mt-0.5 size-5 shrink-0" />
                                <p>{{ anexoError }}</p>
                            </div>
                            <p v-else class="mt-2 text-sm text-gray-500 dark:text-gray-400">Pendiente de generar.</p>
                        </div>

                        <div class="border-t border-gray-200 pt-5 dark:border-gray-800">
                            <h3 class="font-semibold text-gray-950 dark:text-white">Facturas adjuntas</h3>
                            <div v-if="mergedPdfUrl" class="mt-3 space-y-2">
                                <p class="text-sm text-green-700 dark:text-green-300">PDF de facturas generado correctamente.</p>
                                <a
                                    :href="mergedPdfUrl"
                                    download="Facturas_Adjuntas.pdf"
                                    title="Descargar PDF de Facturas Adjuntas"
                                    class="download-link"
                                >
                                    <UIcon name="i-heroicons-arrow-down-tray" class="size-4 shrink-0" />
                                    <span class="truncate">Facturas_Adjuntas.pdf</span>
                                </a>
                                <p v-if="pdfMergeError" class="text-sm text-amber-700 dark:text-amber-300">Algunas facturas pudieron dar error. {{ pdfMergeError }}</p>
                            </div>
                            <div v-else-if="pdfMergeError" class="status-panel status-panel-error mt-3">
                                <UIcon name="i-heroicons-exclamation-circle" class="mt-0.5 size-5 shrink-0" />
                                <p>{{ pdfMergeError }}</p>
                            </div>
                            <p v-else-if="!invoiceFolderHandle" class="mt-2 text-sm text-gray-500 dark:text-gray-400">No se seleccionó carpeta.</p>
                            <p v-else-if="foundInvoicePdfs.size === 0 && !searchError" class="mt-2 text-sm text-amber-700 dark:text-amber-300">No se encontraron facturas válidas.</p>
                            <p v-else class="mt-2 text-sm text-gray-500 dark:text-gray-400">Facturas encontradas, pendiente de generar.</p>
                        </div>
                    </div>
                </UCard>
            </aside>
        </main>
    </UContainer>
</template>

<script setup lang="ts">
// Quitar ref de las importaciones
import { reactive, computed, onMounted, watch, onUnmounted } from 'vue';
import { useAppConfig } from '#app';
import { parse, getTime, isValid } from 'date-fns';
// Eliminar importación no usada de Factura
// import type { Factura } from '~/types';

// Importar Composables
import { useCsvHandling } from '~/composables/useCsvHandling';
import { useInvoiceFolder } from '~/composables/useInvoiceFolder';
import { useDocumentGeneration } from '~/composables/useDocumentGeneration';

// Clave para LocalStorage
const LOCAL_STORAGE_KEY = 'associationFormData';

// Configuración App (Fechas)
const appConfig = useAppConfig();
const { startDate: configStartDateString, endDate: configEndDateString } = appConfig.invoiceDateRange;
const startDate = parse(configStartDateString, 'dd/MM/yyyy', new Date());
const endDate = parse(configEndDateString, 'dd/MM/yyyy', new Date());

// Validar fechas de configuración
if (!isValid(startDate) || !isValid(endDate)) {
    console.error('¡Error Crítico! Las fechas de inicio/fin en app.config.ts no son válidas! Verifica el formato dd/MM/yyyy.');
    // Podríamos mostrar un error al usuario aquí o deshabilitar la app
}
const startDateTimestamp = isValid(startDate) ? getTime(startDate) : -Infinity;
const endDateTimestamp = isValid(endDate) ? getTime(endDate) : Infinity;


// --- Estado Formulario Asociación ---
const formData = reactive({
    associationName: '',
    associationCif: '',
    representativeName: '',
    representativeId: ''
});

// --- Cargar datos desde LocalStorage al montar ---
onMounted(() => {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            // Asignar valores al objeto reactivo existente
            Object.assign(formData, parsedData);
            console.log('Datos de asociación cargados desde localStorage.');
        } catch (e) {
            console.error('Error al parsear datos de asociación desde localStorage:', e);
            // Opcional: limpiar localStorage si los datos están corruptos
            localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
    }
});

// --- Guardar datos en LocalStorage al cambiar ---
watch(formData, (newData) => {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newData));
    } catch (e) {
        console.error('Error al guardar datos de asociación en localStorage:', e);
    }
}, { deep: true }); // deep: true para observar cambios en propiedades anidadas


// --- Inicializar Composables ---

const {
    csvFile,
    csvData,
    parsingError,
    parsingRowErrors,
    handleFileChange,
    setInvoiceFolderHandleRef,
    setFoundInvoicePdfsRef,
    setMissingInvoiceNumbersRef,
    setCsvMergedPdfUrlRef,
    setCsvMergeErrorRef,
    setGenerationResultsRef,
    setGenerationErrorRef
} = useCsvHandling(startDateTimestamp, endDateTimestamp, configStartDateString, configEndDateString);

const {
    invoiceFolderHandle,
    foundInvoicePdfs,
    missingInvoiceNumbers,
    isProcessingFolder,
    searchError,
    selectAndFindInvoicePdfs,
} = useInvoiceFolder(csvData);

const {
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
} = useDocumentGeneration(csvData, formData, invoiceFolderHandle, foundInvoicePdfs);

// --- Lógica de UI y Habilitación ---

const formatCount = (count: number, singular: string, plural: string) => `${count} ${count === 1 ? singular : plural}`;

const formatReadyRows = (count: number) =>
    count === 1 ? '1 fila válida lista para generar' : `${count} filas válidas listas para generar`;

const formatFoundInvoices = (found: number, total: number) => {
    const foundText = formatCount(found, 'factura encontrada', 'facturas encontradas');
    const totalText = formatCount(total, 'factura del CSV', 'facturas del CSV');
    return `${foundText} de ${totalText}`;
};

const isReadyToGenerate = computed(() =>
    csvData.value.length > 0 &&
    !!formData.associationName &&
    !!formData.associationCif &&
    !!formData.representativeName &&
    !!formData.representativeId
);

const hasAssociationData = computed(() =>
    !!formData.associationName &&
    !!formData.associationCif &&
    !!formData.representativeName &&
    !!formData.representativeId
);

const supportsInvoiceFolderPicker = computed(() =>
    typeof window !== 'undefined' && 'showDirectoryPicker' in window
);

const csvStepStatus = computed(() => {
    if (parsingRowErrors.value.length > 0) return formatCount(parsingRowErrors.value.length, 'error', 'errores');
    if (parsingError.value) return 'Revisar archivo';
    if (csvData.value.length > 0) return formatCount(csvData.value.length, 'fila válida', 'filas válidas');
    return 'Pendiente';
});

const associationStepStatus = computed(() =>
    hasAssociationData.value ? 'Completo' : 'Faltan datos'
);

const invoiceStepStatus = computed(() => {
    if (!supportsInvoiceFolderPicker.value) return 'Navegador no compatible';
    if (searchError.value) return 'Revisar carpeta';
    if (invoiceFolderHandle.value) return formatCount(foundInvoicePdfs.value.size, 'encontrada', 'encontradas');
    return 'Opcional';
});

const resultsStepStatus = computed(() => {
    if (isGenerating.value) return 'Generando';
    if (anexoResults.value.length > 0 || mergedPdfUrl.value) return 'Listo';
    if (anexoError.value || pdfMergeError.value) return 'Con errores';
    return 'Pendiente';
});

const showResultsSection = computed(() =>
    anexoResults.value.length > 0 || mergedPdfUrl.value || anexoError.value || pdfMergeError.value || isGenerating.value
);

const csvColumnData = [
    {
        column: '#',
        required: '✓',
        description: 'Número secuencial de la factura (1, 2, 3...)',
        missing: 'Error: valor requerido'
    },
    {
        column: 'Número',
        required: '✓',
        description: 'Número de factura real (ej. F12345, 2406109). Se rellena en la columna "Nº Factura" del Anexo III.',
        missing: 'Error: valor requerido'
    },
    {
        column: 'Fecha',
        required: '✓',
        description: 'Fecha de la factura',
        missing: 'Error: valor requerido'
    },
    {
        column: 'Fecha de pago',
        required: '—',
        description: 'Fecha en que se pagó la factura',
        missing: 'Se usa la Fecha de la factura'
    },
    {
        column: 'Actividad',
        required: '✓',
        description: 'Tipo de actividad (ej. "Curso Premonitores", "Ocio", "Local")',
        missing: 'Error: valor requerido'
    },
    {
        column: 'Concepto',
        required: '✓',
        description: 'Descripción del gasto (ej. "Fotocopias", "Desayuno", "Gasolina")',
        missing: 'Error: valor requerido'
    },
    {
        column: 'Proveedor',
        required: '—',
        description: 'Nombre del proveedor y/o CIF (ej. "B83409177 / SUR 4 COLORES SL")',
        missing: 'Se procesa si está presente'
    },
    {
        column: 'Total Factura',
        required: '✓',
        description: 'Importe total de la factura',
        missing: 'Error: valor requerido'
    },
    {
        column: 'Gasto Justificable',
        required: '(*)',
        description: 'Importe a justificar para la subvención\nPuede ser igual o menor al Total Factura',
        missing: '⚠️ Fila descartada si está vacío'
    }
];

const getCsvRequiredLabel = (required: string) => {
    if (required === '✓') return 'Requerida';
    if (required === '(*)') return 'Condicional';
    return 'Opcional';
};

const getCsvRequiredClass = (required: string) => {
    if (required === '✓') return 'csv-badge-required';
    if (required === '(*)') return 'csv-badge-conditional';
    return 'csv-badge-optional';
};

const getCsvMissingClass = (missing: string) => {
    if (missing.startsWith('Error')) return 'csv-missing-error';
    if (missing.includes('descartada')) return 'csv-missing-warning';
    return 'csv-missing-ok';
};

// --- Conectar Reseteo de CSV con otros Composables ---
setInvoiceFolderHandleRef(invoiceFolderHandle);
setFoundInvoicePdfsRef(foundInvoicePdfs);
setMissingInvoiceNumbersRef(missingInvoiceNumbers);
setCsvMergedPdfUrlRef(mergedPdfUrl);
setCsvMergeErrorRef(pdfMergeError);
setGenerationResultsRef(anexoResults);
setGenerationErrorRef(anexoError);

// --- Limpieza al desmontar ---
onUnmounted(() => {
    if (mergedPdfUrl.value) {
        URL.revokeObjectURL(mergedPdfUrl.value);
    }
    anexoResults.value.forEach(result => URL.revokeObjectURL(result.url));
    console.log("Componente desmontado, URLs revocadas.");
});

</script>

<style scoped>
.step-chip {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    min-width: 0;
    padding: 0.875rem;
    border: 1px solid var(--ui-border);
    border-radius: 0.875rem;
    background: var(--ui-bg);
}

.step-chip strong,
.step-chip small {
    display: block;
}

.step-chip small {
    margin-top: 0.125rem;
    color: var(--ui-text-muted);
    font-size: 0.8125rem;
    line-height: 1.25rem;
}

.step-number {
    display: grid;
    width: 2rem;
    height: 2rem;
    flex: 0 0 auto;
    place-items: center;
    border-radius: 999px;
    font-weight: 700;
}

.step-chip-pending .step-number {
    background: var(--ui-bg-elevated);
    color: var(--ui-text-muted);
}

.step-chip-ready {
    border-color: color-mix(in oklab, var(--ui-primary) 35%, transparent);
    background: color-mix(in oklab, var(--ui-primary) 6%, transparent);
}

.step-chip-ready .step-number {
    background: var(--ui-primary);
    color: white;
}

.status-panel {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
    border-radius: 0.875rem;
    padding: 1rem;
    font-size: 0.875rem;
    line-height: 1.5rem;
}

.status-panel-muted {
    background: var(--ui-bg-elevated);
    color: var(--ui-text-muted);
}

.status-panel-success {
    background: rgb(240 253 244);
    color: rgb(21 128 61);
}

.status-panel-warning {
    background: rgb(255 251 235);
    color: rgb(180 83 9);
}

.status-panel-error {
    background: rgb(254 242 242);
    color: rgb(185 28 28);
}

:global(.dark) .status-panel-success {
    background: rgb(20 83 45 / 0.22);
    color: rgb(187 247 208);
}

:global(.dark) .status-panel-warning {
    background: rgb(120 53 15 / 0.24);
    color: rgb(253 230 138);
}

:global(.dark) .status-panel-error {
    background: rgb(127 29 29 / 0.24);
    color: rgb(254 202 202);
}

.csv-help-table-wrap {
    overflow: hidden;
    border: 1px solid var(--ui-border);
    border-radius: 0.875rem;
    background: var(--ui-bg);
}

.csv-help-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 0.875rem;
    line-height: 1.5rem;
}

.csv-help-table th {
    padding: 0.75rem 1rem;
    background: color-mix(in oklab, var(--ui-primary) 8%, var(--ui-bg));
    color: var(--ui-text-highlighted);
    font-weight: 700;
    text-align: left;
}

.csv-help-table td {
    padding: 0.875rem 1rem;
    border-top: 1px solid var(--ui-border);
    vertical-align: top;
}

.csv-help-table th:nth-child(1),
.csv-help-table td:nth-child(1) {
    width: 8.5rem;
}

.csv-help-table th:nth-child(2),
.csv-help-table td:nth-child(2) {
    width: 8rem;
}

.csv-help-table th:nth-child(4),
.csv-help-table td:nth-child(4) {
    width: 13rem;
}

.csv-help-table code {
    white-space: normal;
    word-break: break-word;
}

.csv-description {
    color: var(--ui-text);
    overflow-wrap: anywhere;
}

.csv-description span {
    display: block;
}

.csv-description span + span {
    margin-top: 0.25rem;
    color: var(--ui-text-muted);
}

.csv-badge {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 0.125rem 0.625rem;
    font-size: 0.75rem;
    font-weight: 700;
}

.csv-badge-required {
    background: rgb(254 226 226);
    color: rgb(153 27 27);
}

.csv-badge-conditional {
    background: rgb(254 243 199);
    color: rgb(146 64 14);
}

.csv-badge-optional {
    background: rgb(220 252 231);
    color: rgb(22 101 52);
}

.csv-missing {
    font-weight: 600;
}

.csv-missing-error {
    color: rgb(185 28 28);
}

.csv-missing-warning {
    color: rgb(180 83 9);
}

.csv-missing-ok {
    color: rgb(21 128 61);
}

:global(.dark) .csv-badge-required {
    background: rgb(127 29 29 / 0.35);
    color: rgb(254 202 202);
}

:global(.dark) .csv-badge-conditional {
    background: rgb(120 53 15 / 0.35);
    color: rgb(253 230 138);
}

:global(.dark) .csv-badge-optional {
    background: rgb(20 83 45 / 0.35);
    color: rgb(187 247 208);
}

:global(.dark) .csv-missing-error {
    color: rgb(254 202 202);
}

:global(.dark) .csv-missing-warning {
    color: rgb(253 230 138);
}

:global(.dark) .csv-missing-ok {
    color: rgb(187 247 208);
}

@media (max-width: 760px) {
    .csv-help-table,
    .csv-help-table thead,
    .csv-help-table tbody,
    .csv-help-table tr,
    .csv-help-table th,
    .csv-help-table td {
        display: block;
        width: 100%;
    }

    .csv-help-table thead {
        display: none;
    }

    .csv-help-table tr {
        padding: 0.875rem 1rem;
        border-top: 1px solid var(--ui-border);
    }

    .csv-help-table tr:first-child {
        border-top: 0;
    }

    .csv-help-table td {
        padding: 0.25rem 0;
        border-top: 0;
    }
}

.download-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
    border-radius: 0.75rem;
    background: color-mix(in oklab, var(--ui-primary) 8%, transparent);
    padding: 0.625rem 0.75rem;
    color: var(--ui-primary);
    font-weight: 600;
    text-decoration: none;
}

.download-link:hover {
    background: color-mix(in oklab, var(--ui-primary) 14%, transparent);
}

</style>
