<template>
    <UContainer class="py-8 lg:max-w-[90vw]">
        <!-- Encabezado -->
        <header class="mb-12 text-center">
            <h1 class="text-4xl font-bold mb-2">Generador de Anexo III subvenciones Parla 2026</h1>
            <p class="text-lg text-gray-600 dark:text-gray-400">
                Sube tu archivo CSV y genera automáticamente los documentos PDF necesarios para tu asociación de forma
                rápida y sencilla.
            </p>
        </header>

        <!-- Sección de Tutorial -->
        <section class="mb-12 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow">
            <h2 class="text-2xl font-semibold mb-4">Cómo Funciona</h2>
            <ol class="list-decimal list-inside space-y-4">
                <li>
                    <UIcon name="i-heroicons-document-arrow-down" class="mr-2 align-middle" />
                    <strong>Descarga la plantilla:</strong> Usa el botón abajo para obtener la plantilla a rellenar.
                </li>
                <li>
                    <UIcon name="i-heroicons-table-cells" class="mr-2 align-middle" />
                    <strong>Rellena tus datos:</strong> Completa la plantilla con la información requerida (fechas,
                    importes, etc.).
                </li>
                <li>
                    <UIcon name="i-heroicons-arrow-up-tray" class="mr-2 align-middle" />
                    <strong>Sube el archivo relleno:</strong> Carga el archivo completado en el formulario.
                </li>
                <li>
                    <UIcon name="i-heroicons-folder-arrow-down" class="mr-2 align-middle" />
                    <strong>(Opcional) Selecciona carpeta de facturas:</strong> Si deseas adjuntar los PDF de las
                    facturas, selecciona la carpeta que los contiene.
                    <ul class="list-disc list-inside pl-6 text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <li>Los archivos PDF deben llamarse <code>facturaNNN.pdf</code> (ej.
                            <code>factura001.pdf</code>, <code>factura042.pdf</code>).
                        </li>
                        <li>El número <code>NNN</code> debe coincidir con la columna "#" del archivo (ej. '1' o '42').
                        </li>
                    </ul>
                </li>
                <li>
                    <UIcon name="i-heroicons-information-circle" class="mr-2 align-middle" />
                    <strong>Introduce datos de la asociación:</strong> Rellena el nombre, CIF y datos del representante.
                </li>
                <li>
                    <UIcon name="i-heroicons-cog-6-tooth" class="mr-2 align-middle" />
                    <strong>Genera los documentos:</strong> Haz clic en "Generar documentos". Se creará el Anexo III y,
                    si seleccionaste una carpeta, un PDF adicional con las facturas adjuntas.
                </li>
                <li>
                    <UIcon name="i-heroicons-arrow-down-tray" class="mr-2 align-middle" />
                    <strong>Descarga tus documentos:</strong> Una vez generados, podrás descargar los PDFs
                    resultantes.
                </li>
            </ol>
        </section>

        <!-- Sección de Formato del CSV -->
        <section class="mb-12 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow">
            <h2 class="text-2xl font-semibold mb-4 flex items-center">
                <UIcon name="i-heroicons-document-text" class="mr-2" />
                Formato del archivo CSV
            </h2>
            <p class="mb-6 text-gray-600 dark:text-gray-400">
                El archivo CSV debe contener una fila por factura con las siguientes columnas:
            </p>

            <div class="mb-6 overflow-x-auto">
                <table class="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                    <thead>
                        <tr class="bg-gray-100 dark:bg-gray-700">
                            <th class="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Columna</th>
                            <th class="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">Requerido</th>
                            <th class="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Descripción</th>
                            <th class="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Si falta</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2 font-mono">#</td>
                            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-red-600 font-bold">✓</td>
                            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2">Número secuencial de la factura (1, 2, 3...)</td>
                            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2 text-red-600">Error: valor requerido</td>
                        </tr>
                        <tr class="bg-gray-50 dark:bg-gray-800">
                            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2 font-mono">Número</td>
                            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-gray-500">—</td>
                            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2">
                                Número de factura real (ej. F12345, 2406109)<br>
                                <span class="text-sm text-gray-600 dark:text-gray-400">Nota: Esta columna <strong>NO se usa</strong> en la generación de documentos. Se incluye para compatibilidad con contabilidad.</span>
                            </td>
                            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2 text-green-600">Se procesa si está presente</td>
                        </tr>
                        <tr>
                            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2 font-mono">Fecha</td>
                            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-red-600 font-bold">✓</td>
                            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2">Fecha de la factura</td>
                            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2 text-red-600">Error: valor requerido</td>
                        </tr>
                        <tr class="bg-gray-50 dark:bg-gray-800">
                            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2 font-mono">Fecha de pago</td>
                            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-gray-500">—</td>
                            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2">Fecha en que se pagó la factura</td>
                            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2 text-green-600">Se usa la Fecha de la factura</td>
                        </tr>
                        <tr>
                            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2 font-mono">Actividad</td>
                            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-red-600 font-bold">✓</td>
                            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2">Tipo de actividad (ej. "Curso Premonitores", "Ocio", "Local")</td>
                            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2 text-red-600">Error: valor requerido</td>
                        </tr>
                        <tr class="bg-gray-50 dark:bg-gray-800">
                            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2 font-mono">Concepto</td>
                            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-red-600 font-bold">✓</td>
                            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2">Descripción del gasto (ej. "Fotocopias", "Desayuno", "Gasolina")</td>
                            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2 text-red-600">Error: valor requerido</td>
                        </tr>
                        <tr>
                            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2 font-mono">Proveedor</td>
                            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-gray-500">—</td>
                            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2">Nombre del proveedor y/o CIF (ej. "B83409177 / SUR 4 COLORES SL")</td>
                            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2 text-green-600">Se procesa si está presente</td>
                        </tr>
                        <tr class="bg-gray-50 dark:bg-gray-800">
                            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2 font-mono">Total Factura</td>
                            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-red-600 font-bold">✓</td>
                            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2">Importe total de la factura</td>
                            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2 text-red-600">Error: valor requerido</td>
                        </tr>
                        <tr>
                            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2 font-mono">Gasto Justificable</td>
                            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-amber-600">(*)</td>
                            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2">
                                Importe a justificar para la subvención<br>
                                <span class="text-sm text-gray-600 dark:text-gray-400">Puede ser igual o menor al Total Factura</span>
                            </td>
                            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2 text-amber-600">⚠️ Fila descartada si está vacío</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="space-y-4 mb-6">
                <div class="text-amber-600 dark:text-amber-400 text-sm flex items-start">
                    <UIcon name="i-heroicons-exclamation-triangle" class="mr-2 mt-0.5" />
                    <div>
                        <strong>Nota importante:</strong> La columna <em>Gasto Justificable</em> es opcional pero, si se incluye, debe tener un valor. Si está vacía, toda la fila se descartará.
                    </div>
                </div>
                <div class="text-blue-600 dark:text-blue-400 text-sm flex items-start">
                    <UIcon name="i-heroicons-information-circle" class="mr-2 mt-0.5" />
                    <div>
                        <strong>Puedes incluir columnas extra:</strong> El archivo CSV puede tener columnas adicionales sin problema. Solo se procesarán las columnas listadas arriba; las extra se ignorarán.
                    </div>
                </div>
            </div>

            <!-- Formatos Válidos -->
            <h3 class="text-xl font-semibold mb-4 flex items-center">
                <UIcon name="i-heroicons-check-circle" class="mr-2" />
                Formatos válidos
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                    <h4 class="font-semibold mb-3 text-gray-800 dark:text-gray-200">Fechas</h4>
                    <ul class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        <li class="flex items-start">
                            <span class="text-green-600 mr-2">✓</span>
                            <span><strong>Formato preferido:</strong> DD/MM/YYYY</span>
                        </li>
                        <li class="flex items-start">
                            <span class="text-green-600 mr-2">✓</span>
                            <span><strong>También acepta:</strong> DD/MM/YY (se asume año 20XX)</span>
                        </li>
                        <li class="flex items-start">
                            <span class="text-blue-600 mr-2">ℹ</span>
                            <span><strong>Ejemplos válidos:</strong></span>
                        </li>
                        <li class="pl-8 text-gray-600 dark:text-gray-400">
                            15/01/2026, 4/1/26, 31/12/25
                        </li>
                        <li class="flex items-start">
                            <span class="text-blue-600 mr-2">ℹ</span>
                            <span><strong>Rango válido:</strong></span>
                        </li>
                        <li class="pl-8 text-gray-600 dark:text-gray-400">
                            Las fechas deben estar dentro del periodo de la subvención configurado
                        </li>
                    </ul>
                </div>

                <div class="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                    <h4 class="font-semibold mb-3 text-gray-800 dark:text-gray-200">Importes</h4>
                    <ul class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        <li class="flex items-start">
                            <span class="text-green-600 mr-2">✓</span>
                            <span><strong>Formato español:</strong> Coma decimal, punto de miles</span>
                        </li>
                        <li class="flex items-start">
                            <span class="text-green-600 mr-2">✓</span>
                            <span><strong>Símbolo €:</strong> Opcional al final</span>
                        </li>
                        <li class="flex items-start">
                            <span class="text-blue-600 mr-2">ℹ</span>
                            <span><strong>Ejemplos válidos:</strong></span>
                        </li>
                        <li class="pl-8 text-gray-600 dark:text-gray-400">
                            123,45 € | 1.234,56 | 89,00 €
                        </li>
                        <li class="flex items-start">
                            <span class="text-red-600 mr-2">✗</span>
                            <span><strong>NO válido:</strong> Punto decimal (formato inglés)</span>
                        </li>
                        <li class="pl-8 text-gray-600 dark:text-gray-400">
                            123.45 | 1,234.56
                        </li>
                    </ul>
                </div>
            </div>
        </section>

        <!-- Formulario Principal -->
        <section class="mb-12">
            <h2 class="text-2xl font-semibold mb-6">Información y Carga de Datos</h2>

            <!-- Datos Asociación -->
            <UCard class="mb-6">
                <template #header>
                    <h3 class="text-lg font-medium">Datos de la asociación y representante (Obligatorio)</h3>
                </template>
                <!-- Usamos formData directamente, ya que es reactivo -->
                <UForm :state="formData" class="space-y-4 space-x-4 flex flex-row flex-wrap">
                    <UFormField
label="Nombre de la Asociación" name="associationName" required
                        class="flex-1 min-w-[250px]">
                        <UInput v-model="formData.associationName" placeholder="Asociación Ejemplo XYZ" />
                    </UFormField>
                    <UFormField
label="CIF de la Asociación" name="associationCif" required
                        class="flex-1 min-w-[150px]">
                        <UInput v-model="formData.associationCif" placeholder="G12345678" />
                    </UFormField>
                    <UFormField
label="Nombre del representante" name="representativeName" required
                        class="flex-1 min-w-[250px]">
                        <UInput v-model="formData.representativeName" placeholder="Juan Pérez García" />
                    </UFormField>
                    <UFormField
label="CIF/DNI del representante" name="representativeId" required
                        class="flex-1 min-w-[150px]">
                        <UInput v-model="formData.representativeId" placeholder="12345678A" />
                    </UFormField>
                </UForm>
            </UCard>

            <!-- Carga de Datos: CSV y Carpeta Opcional -->
            <UCard>
                <template #header>
                    <h3 class="text-lg font-medium">Origen de datos para generación</h3>
                </template>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <!-- Columna 1: Carga CSV Obligatoria -->
                    <div class="border p-4 rounded-md flex flex-col">
                        <h4 class="font-semibold mb-3">1. Cargar archivo (Obligatorio)</h4>
                        <UFormField label="Archivo de facturas (.csv)" name="csvFile" required>
                            <UInput
type="file" size="lg" accept=".csv, text/csv"
                                :disabled="isGenerating || isProcessingFolder" @change="handleFileChange" />
                        </UFormField>
                        <div class="flex items-center space-x-4 mt-2 mb-4">
                            <UButton
variant="outline" icon="i-heroicons-document-arrow-down"
                                label="Descargar plantilla" href="/Facturas Subvención - Plantilla.csv" external
                                :disabled="isGenerating || isProcessingFolder" />
                            <!-- Info Archivo Cargado -->
                            <div class="text-sm flex-grow">
                                <div v-if="!csvFile" class="text-gray-500 dark:text-gray-400">(No hay archivo
                                    cargado)</div>
                                <div v-else class="text-green-600 dark:text-green-400 flex items-center" :title="csvFile.name">
                                    <UIcon name="i-heroicons-check-circle" class="mr-1 min-w-5" />
                                    <div class="">

                                        {{ csvFile.name }} ({{
                                            csvData.length }}
                                        filas válidas)
                                    </div>
                                </div>
                                <div
v-if="parsingError && parsingRowErrors.length === 0" class="text-red-500 mt-1"
                                    :title="parsingError">
                                    Error General: {{ parsingError }}
                                </div>
                            </div>
                        </div>

                        <!-- Tabla de Errores de Parseo CSV -->
                        <div v-if="parsingRowErrors.length > 0" class="mt-4 overflow-auto flex-grow">
                            <h5 class="text-red-600 dark:text-red-400 font-semibold mb-2">Errores encontrados en el archivo
                                ({{
                                    parsingRowErrors.length }}):</h5>
                            <UTable
:data="parsingRowErrors" :columns="[
                                { accessorKey: 'line', header: 'Línea del archivo' },
                                { accessorKey: 'message', header: 'Error' }
                            ]" />
                        </div>
                    </div>

                    <!-- Columna 2: Selección Carpeta Opcional -->
                    <div class="border p-4 rounded-md">
                        <h4 class="font-semibold mb-3">2. (Opcional) Adjuntar facturas PDF</h4>
                        
                            <UButton
class="w-full" icon="i-heroicons-folder-arrow-down"
                                label="Seleccionar Carpeta de Facturas"
                                :disabled="csvData.length === 0 || isGenerating || isProcessingFolder"
                                :loading="isProcessingFolder" @click="selectAndFindInvoicePdfs" />
               

                        <!-- Feedback Selección Carpeta -->
                        <div class="mt-3 text-sm space-y-1">
                            <div v-if="searchError" class="text-red-500">
                                Error carpeta: {{ searchError }}
                            </div>
                            <div v-if="invoiceFolderHandle">
                                <UIcon name="i-heroicons-check-circle" class="text-green-500 mr-1" />
                                Carpeta seleccionada: <i>{{ invoiceFolderHandle.name }}</i>
                                <span v-if="!isProcessingFolder"> ({{ foundInvoicePdfs.size }} facturas encontradas de
                                    {{
                                        csvData.length }} en CSV)</span>
                            </div>
                            <div v-else-if="!searchError" class="text-gray-500 dark:text-gray-400">
                                (No se ha seleccionado carpeta)
                            </div>
                            <div
v-if="missingInvoiceNumbers.length > 0 && !isProcessingFolder && !searchError"
                                class="text-amber-600 dark:text-amber-400">
                                <span class="font-medium">Facturas del archivo no encontradas en carpeta (formato incorrecto o ausentes):</span> {{ missingInvoiceNumbers.join(', ') }}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Botón Principal de Generación -->
                <div class="text-center mt-6 pt-4 border-t">
                    <UButton
size="xl" color="primary" icon="i-heroicons-cog-6-tooth" label="Generar Documentos"
                        :loading="isGenerating" :disabled="!isReadyToGenerate || isGenerating"
                        @click="generateDocuments" />
                    <p v-if="!isReadyToGenerate && !isGenerating" class="text-xs text-gray-500 mt-1">
                        (Necesitas cargar un archivo válido y rellenar los datos de la asociación)
                    </p>
                </div>
            </UCard>
        </section>

        <!-- Sección de Resultados -->
        <section v-if="showResultsSection" class="mt-12">
            <h2 class="text-2xl font-semibold mb-6">Resultados de Generación</h2>
            <UCard>
                <!-- Indicadores de Progreso -->
                <div v-if="isGenerating" class="my-4 text-center space-y-4">
                    <div v-if="isGeneratingAnexo">
                        <p class="mb-1">Generando Anexo III... ({{ anexoGenerationProgress }}%)</p>
                        <UProgress :value="anexoGenerationProgress" indicator size="sm" />
                    </div>
                    <div v-if="isMergingPdfs">
                        <p class="mb-1">Generando PDF de facturas adjuntas... ({{ pdfMergeProgress }}%)</p>
                        <UProgress :value="pdfMergeProgress" indicator size="sm" />
                    </div>
                </div>

                <!-- Área de resultados -->
                <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <!-- Resultados Anexo III -->
                    <div class="border rounded-md p-4">
                        <h3 class="text-lg font-medium mb-2">Anexo III</h3>
                        <div v-if="anexoResults.length > 0">
                            <p class="text-green-600 dark:text-green-400 mb-4">¡Anexo III generado con éxito!</p>
                            <ul class="space-y-2 text-left max-w-md mx-auto mb-4">
                                <li v-for="(result, index) in anexoResults" :key="`anexo-${index}`">
                                    <a
:href="result.url" :download="result.name" :title="`Descargar ${result.name}`"
                                        class="text-primary hover:underline flex items-center">
                                        <UIcon name="i-heroicons-document-arrow-down" class="mr-2 flex-shrink-0" />
                                        <span class="truncate">{{ result.name }}</span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <div v-if="anexoError">
                            <p class="text-red-600 dark:text-red-400 font-medium">Error al generar Anexo III:</p>
                            <p class="text-red-600 dark:text-red-400 text-sm">{{ anexoError }}</p>
                        </div>
                        <div v-if="anexoResults.length === 0 && !anexoError" class="text-gray-500 dark:text-gray-400">
                            (No generado o pendiente)
                        </div>
                    </div>

                    <!-- Resultados Facturas Fusionadas -->
                    <div class="border rounded-md p-4">
                        <h3 class="text-lg font-medium mb-2">Facturas adjuntas (PDF Único)</h3>
                        <div v-if="mergedPdfUrl">
                            <p class="text-green-600 dark:text-green-400 mb-4">¡PDF de facturas adjuntas generado con
                                éxito!</p>
                            <div class="max-w-md mx-auto mb-4">
                                <a
:href="mergedPdfUrl" download="Facturas_Adjuntas.pdf"
                                    title="Descargar PDF de Facturas Adjuntas"
                                    class="text-primary hover:underline flex items-center justify-center">
                                    <UIcon name="i-heroicons-document-arrow-down" class="mr-2 flex-shrink-0" />
                                    <span class="truncate">Facturas_Adjuntas.pdf</span>
                                </a>
                            </div>
                            <p v-if="pdfMergeError" class="text-amber-600 dark:text-amber-400 text-xs mt-2">Nota:
                                Algunas facturas pudieron dar error durante la fusión. {{ pdfMergeError }}</p>
                        </div>
                        <div v-else-if="pdfMergeError && !mergedPdfUrl">
                            <p class="text-red-600 dark:text-red-400 font-medium">Error al generar PDF de facturas:</p>
                            <p class="text-red-600 dark:text-red-400 text-sm">{{ pdfMergeError }}</p>
                        </div>
                        <div v-else-if="!invoiceFolderHandle" class="text-gray-500 dark:text-gray-400">
                            (No se seleccionó carpeta para adjuntar facturas)
                        </div>
                        <div
v-else-if="foundInvoicePdfs.size === 0 && !searchError"
                            class="text-amber-600 dark:text-amber-400">
                            (No se encontraron facturas válidas en la carpeta seleccionada)
                        </div>
                        <div
v-else-if="invoiceFolderHandle && foundInvoicePdfs.size > 0 && !isGenerating && !mergedPdfUrl && !pdfMergeError"
                            class="text-gray-500 dark:text-gray-400">
                            (Facturas encontradas, pendiente de generar PDF adjunto)
                        </div>
                    </div>
                </div>

                <!-- Mensaje si no hay acciones realizadas -->
                <div
v-if="!isGenerating && anexoResults.length === 0 && !mergedPdfUrl && !anexoError && !pdfMergeError && !parsingError"
                    class="text-center text-gray-500 dark:text-gray-400 py-4">
                    Carga un archivo y haz clic en "Generar documentos" para ver los resultados aquí.
                </div>

            </UCard>
        </section>

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

const isReadyToGenerate = computed(() =>
    csvData.value.length > 0 &&
    !!formData.associationName &&
    !!formData.associationCif &&
    !!formData.representativeName &&
    !!formData.representativeId
);

const showResultsSection = computed(() =>
    anexoResults.value.length > 0 || mergedPdfUrl.value || anexoError.value || pdfMergeError.value || isGenerating.value
);

// --- Datos para la tabla de columnas CSV ---
const csvColumnColumns = [
    { accessorKey: 'column', header: 'Columna' },
    { accessorKey: 'required', header: 'Requerido' },
    { accessorKey: 'description', header: 'Descripción' },
    { accessorKey: 'missing', header: 'Si falta' }
];

const csvColumnData = [
    {
        column: '#',
        required: '✓',
        description: 'Número secuencial de la factura (1, 2, 3...)',
        missing: 'Error: valor requerido'
    },
    {
        column: 'Número',
        required: '—',
        description: 'Número de factura real (ej. F12345, 2406109)\nNota: Esta columna NO se usa en la generación de documentos. Se incluye para compatibilidad con contabilidad.',
        missing: 'Se procesa si está presente'
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
/* Estilos específicos si son necesarios */
/* Ajuste para que la tabla de errores no crezca indefinidamente */
.overflow-auto {
    max-height: 300px;
    /* O la altura que prefieras */
}
</style>
