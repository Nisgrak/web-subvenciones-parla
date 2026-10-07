<template>
    <UContainer class="py-6 md:py-10 lg:max-w-4xl">
        <header class="mb-8 rounded-2xl border border-primary/15 bg-primary-50/70 p-6 dark:bg-primary-950/20 md:p-8">
            <p class="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-medium text-primary-700 ring-1 ring-primary/15 dark:bg-gray-900 dark:text-primary-300">
                <UIcon name="i-heroicons-document-check" class="size-4" />
                Subvenciones Parla 2026
            </p>
            <h1 class="text-balance text-3xl font-bold tracking-tight text-gray-950 dark:text-white md:text-4xl">
                Genera el Anexo III paso a paso
            </h1>
            <p class="mt-4 max-w-2xl text-pretty text-base leading-7 text-gray-700 dark:text-gray-300 md:text-lg">
                Rellena la plantilla con tus facturas, súbela y revisa lo que hemos leído antes de descargar los documentos.
                Todo se hace en tu ordenador: tus archivos no se envían a ningún sitio.
            </p>
        </header>

        <section class="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Estado del trámite">
            <div v-for="step in stepChips" :key="step.number" class="step-chip" :class="`step-chip-${step.state}`">
                <span class="step-number">
                    <UIcon v-if="step.state === 'ready'" name="i-heroicons-check" class="size-4" />
                    <UIcon v-else-if="step.state === 'warning'" name="i-heroicons-exclamation-triangle" class="size-4" />
                    <template v-else>{{ step.number }}</template>
                </span>
                <span class="min-w-0">
                    <strong>{{ step.title }}</strong>
                    <small>{{ step.status }}</small>
                </span>
            </div>
        </section>

        <main class="space-y-6">
            <!-- Paso 1: archivo de facturas -->
            <UCard>
                <template #header>
                    <h2 class="text-xl font-semibold text-gray-950 dark:text-white">1. Prepara y sube tus facturas</h2>
                    <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Una fila por factura. Comprobamos cada fila antes de generar nada.</p>
                </template>

                <ol class="space-y-6">
                    <li class="substep">
                        <span class="substep-letter">a</span>
                        <div class="min-w-0 flex-1">
                            <h3 class="font-medium text-gray-950 dark:text-white">Descarga la plantilla</h3>
                            <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                                <UButton
                                    icon="i-heroicons-document-arrow-down"
                                    label="Descargar plantilla Excel"
                                    :href="TEMPLATE_XLSX_URL"
                                    download="Facturas Subvención - Plantilla.xlsx"
                                    external
                                />
                                <a :href="TEMPLATE_CSV_URL" download="Facturas Subvención - Plantilla.csv" class="text-sm text-gray-600 underline underline-offset-4 hover:text-primary dark:text-gray-400">
                                    o descárgala en CSV
                                </a>
                            </div>
                        </div>
                    </li>

                    <li class="substep">
                        <span class="substep-letter">b</span>
                        <div class="min-w-0 flex-1">
                            <h3 class="font-medium text-gray-950 dark:text-white">Rellénala con tus facturas</h3>
                            <p class="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
                                Las filas de ejemplo son solo orientativas: sustitúyelas por las tuyas.
                                No cambies los títulos de la primera fila.
                            </p>
                            <div class="status-panel status-panel-warning mt-3">
                                <UIcon name="i-heroicons-information-circle" class="mt-0.5 size-5 shrink-0" />
                                <div class="space-y-2">
                                    <p>
                                        <strong>Importante:</strong> debes justificar el importe <strong>SOLICITADO de la subvención, no el concedido</strong>.
                                        Solo hay que enviar las facturas subvencionables; incluir las no justificables es <strong>totalmente opcional</strong>.
                                    </p>
                                    <p>
                                        Recomendamos que el total justificable de las facturas supere ligeramente el importe solicitado.
                                        Así tendrás un margen de seguridad si alguna factura no se acepta al revisar la justificación.
                                    </p>
                                </div>
                            </div>
                            <UModal
                                title="Qué poner en cada columna"
                                description="Consulta esta guía mientras rellenas o corriges la plantilla."
                                :ui="{ content: 'max-w-4xl' }"
                                scrollable
                            >
                                <UButton
                                    class="mt-3"
                                    variant="soft"
                                    color="neutral"
                                    icon="i-heroicons-table-cells"
                                    label="Ver qué poner en cada columna"
                                />

                                <template #body>
                                    <div class="space-y-5">
                                        <div class="grid gap-4 md:grid-cols-2">
                                            <div class="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/70">
                                                <h3 class="font-semibold text-gray-900 dark:text-white">Fechas</h3>
                                                <ul class="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                                    <li><strong>Formato:</strong> día/mes/año.</li>
                                                    <li><strong>Ejemplos:</strong> 15/01/2026, 4/1/26, 31/12/2025.</li>
                                                    <li><strong>Válidas:</strong> del {{ configStartDateString }} al {{ configEndDateString }}.</li>
                                                </ul>
                                            </div>
                                            <div class="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/70">
                                                <h3 class="font-semibold text-gray-900 dark:text-white">Importes</h3>
                                                <ul class="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                                    <li><strong>Ejemplos:</strong> 123,45 € · 1.234,56 · 89</li>
                                                    <li>Puedes poner o no el símbolo €.</li>
                                                    <li>Antes de generar verás una tabla con los importes leídos para comprobarlos.</li>
                                                </ul>
                                            </div>
                                        </div>

                                        <div class="csv-help-table-wrap">
                                            <table class="csv-help-table">
                                                <thead>
                                                    <tr>
                                                        <th>Columna</th>
                                                        <th>¿Obligatoria?</th>
                                                        <th>Qué poner</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr v-for="column in columnHelp" :key="column.column">
                                                        <td>
                                                            <code>{{ column.column }}</code>
                                                        </td>
                                                        <td>
                                                            <span class="csv-badge" :class="column.required ? 'csv-badge-required' : 'csv-badge-optional'">
                                                                {{ column.required ? 'Sí' : 'No' }}
                                                            </span>
                                                        </td>
                                                        <td class="csv-description">
                                                            <span v-for="line in column.description" :key="line">{{ line }}</span>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        <div class="status-panel status-panel-muted">
                                            <UIcon name="i-heroicons-information-circle" class="mt-0.5 size-5 shrink-0" />
                                            <p>Puedes añadir más columnas para tu propio control: se ignoran. Las filas con errores no se incluyen en el Anexo III hasta que las corrijas.</p>
                                        </div>
                                    </div>
                                </template>
                            </UModal>
                        </div>
                    </li>

                    <li class="substep">
                        <span class="substep-letter">c</span>
                        <div class="min-w-0 flex-1 space-y-4">
                            <h3 class="font-medium text-gray-950 dark:text-white">Súbela aquí</h3>

                            <label
                                class="drop-zone"
                                :class="{ 'drop-zone-active': isDragging, 'drop-zone-disabled': isBusy }"
                                @dragenter.prevent="isDragging = true"
                                @dragover.prevent="isDragging = true"
                                @dragleave.prevent="isDragging = false"
                                @drop.prevent="handleDrop"
                            >
                                <input
                                    type="file"
                                    class="sr-only"
                                    :accept="acceptedInvoiceFileTypes"
                                    :disabled="isBusy"
                                    @change="handleFileChange"
                                >
                                <UIcon :name="isReadingFile ? 'i-heroicons-arrow-path' : 'i-heroicons-arrow-up-tray'" class="size-7" :class="{ 'animate-spin': isReadingFile }" />
                                <span class="font-semibold">
                                    {{ isReadingFile ? 'Leyendo el archivo…' : csvFile ? 'Elegir otro archivo o el mismo corregido' : 'Elige el archivo de facturas' }}
                                </span>
                                <span class="text-sm text-gray-600 dark:text-gray-400">o arrástralo aquí · Excel (.xlsx) o CSV</span>
                            </label>

                            <div v-if="parsingError" class="status-panel status-panel-error" role="alert">
                                <UIcon name="i-heroicons-exclamation-circle" class="mt-0.5 size-5 shrink-0" />
                                <div>
                                    <p class="font-medium">No hemos podido usar {{ csvFile ? `«${csvFile.name}»` : 'el archivo' }}</p>
                                    <p>{{ parsingError }}</p>
                                </div>
                            </div>

                            <div v-else-if="csvFile && !isReadingFile && parsedInvoices.length > 0" class="status-panel status-panel-success">
                                <UIcon name="i-heroicons-check-circle" class="mt-0.5 size-5 shrink-0" />
                                <div class="min-w-0">
                                    <p class="font-medium break-words">{{ csvFile.name }}</p>
                                    <p>{{ formatCount(csvData.length, 'factura lista', 'facturas listas') }} para el Anexo III.</p>
                                </div>
                            </div>

                            <div v-if="parsingRowWarnings.length > 0 && !isReadingFile" class="status-panel status-panel-warning" role="status">
                                <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 size-5 shrink-0" />
                                <div class="min-w-0 space-y-3">
                                    <h4 class="font-semibold">{{ formatCount(parsingRowWarnings.length, 'factura sin gasto justificable', 'facturas sin gasto justificable') }}</h4>
                                    <p>El «Gasto Justificable» es 0 o está vacío. Estas facturas no aportan importe a la justificación y se excluyen por defecto.</p>
                                    <details>
                                        <summary class="cursor-pointer font-medium">Ver las filas con aviso</summary>
                                        <ul class="mt-2 list-disc space-y-1 pl-5">
                                            <li v-for="warning in parsingRowWarnings" :key="warning.line">
                                                Fila {{ warning.line }}<span v-if="warning.context"> · {{ warning.context }}</span>
                                            </li>
                                        </ul>
                                    </details>
                                    <label class="flex min-h-11 cursor-pointer items-start gap-3 py-2">
                                        <input v-model="includeNonJustifiable" type="checkbox" class="mt-1 size-4 shrink-0 accent-primary" :disabled="isBusy" aria-describedby="non-justifiable-help">
                                        <span class="font-medium">Incluir también las facturas no justificables (totalmente opcional)</span>
                                    </label>
                                    <p id="non-justifiable-help" class="text-sm">
                                        Se añadirán al Anexo III y, si eliges una carpeta, al PDF de facturas unidas, con 0 € justificables.
                                        Si cambias esta opción, tendrás que volver a elegir la carpeta y generar los documentos.
                                    </p>
                                </div>
                            </div>

                            <div v-if="sharedNumbers.length > 0 && !isReadingFile" class="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/20 dark:text-amber-100" role="status">
                                <div class="flex items-start gap-2">
                                    <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 size-5 shrink-0" />
                                    <div class="min-w-0 flex-1 space-y-2">
                                        <h4 class="font-semibold">
                                            {{ sharedNumbers.length === 1 ? 'Hay un «Nº orden» repetido' : `Hay ${sharedNumbers.length} «Nº orden» repetidos` }} en facturas de años distintos
                                        </h4>
                                        <p class="text-sm">Lo aceptamos porque son de años diferentes, pero comprueba que no sea un error al numerar.</p>
                                        <ul class="list-disc space-y-0.5 pl-5 text-sm">
                                            <li v-for="shared in sharedNumbers" :key="shared.number">
                                                <strong>Nº {{ shared.number }}:</strong>
                                                {{ joinList(shared.rows.map(row => `fila ${row.line} (${row.date})`)) }}
                                            </li>
                                        </ul>
                                        <p class="text-sm">
                                            Si vas a unir las facturas en PDF (paso 3), esos archivos deben llevar el año en el nombre, por ejemplo
                                            <code>{{ sharedFileNameExample }}</code>.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div v-if="errorRows.length > 0" class="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-200" role="alert">
                                <div class="flex items-start gap-2">
                                    <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 size-5 shrink-0" />
                                    <div class="min-w-0 flex-1">
                                        <h4 class="font-semibold">
                                            {{ formatCount(errorRows.length, 'fila tiene', 'filas tienen') }} errores y no {{ errorRows.length === 1 ? 'se incluirá' : 'se incluirán' }}
                                        </h4>
                                        <p class="text-sm">Corrígelas en tu archivo, guárdalo y vuelve a subirlo.</p>

                                        <ul class="mt-3 space-y-2">
                                            <li v-for="row in errorRows.slice(0, MAX_INLINE_ERROR_ROWS)" :key="row.line" class="error-row">
                                                <p class="font-medium">
                                                    Fila {{ row.line }}<span v-if="row.context" class="font-normal"> · {{ row.context }}</span>
                                                </p>
                                                <ul class="mt-1 list-disc space-y-0.5 pl-5 text-sm">
                                                    <li v-for="message in row.messages" :key="message">{{ message }}</li>
                                                </ul>
                                            </li>
                                        </ul>

                                        <UModal
                                            v-if="errorRows.length > MAX_INLINE_ERROR_ROWS"
                                            title="Filas con errores"
                                            description="Corrige estas filas en tu archivo y vuelve a subirlo."
                                            :ui="{ content: 'max-w-3xl' }"
                                            scrollable
                                        >
                                            <UButton
                                                class="mt-3"
                                                color="error"
                                                variant="soft"
                                                icon="i-heroicons-list-bullet"
                                                :label="`Ver las ${errorRows.length} filas con errores`"
                                            />

                                            <template #body>
                                                <ul class="space-y-3">
                                                    <li v-for="row in errorRows" :key="row.line" class="error-row text-red-800 dark:text-red-200">
                                                        <p class="font-medium">
                                                            Fila {{ row.line }}<span v-if="row.context" class="font-normal"> · {{ row.context }}</span>
                                                        </p>
                                                        <ul class="mt-1 list-disc space-y-0.5 pl-5 text-sm">
                                                            <li v-for="message in row.messages" :key="message">{{ message }}</li>
                                                        </ul>
                                                    </li>
                                                </ul>
                                            </template>
                                        </UModal>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                </ol>

                <div v-if="csvData.length > 0 && !isReadingFile" class="mt-8 border-t border-gray-200 pt-6 dark:border-gray-800">
                    <h3 class="font-semibold text-gray-950 dark:text-white">Revisa lo que hemos leído</h3>
                    <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Comprueba que fechas e importes son correctos. Ocupará {{ formatCount(estimatedAnexoPages, 'página', 'páginas') }} del Anexo III.
                    </p>

                    <div class="preview-table-wrap mt-4">
                        <table class="preview-table">
                            <thead>
                                <tr>
                                    <th scope="col">Nº</th>
                                    <th scope="col">Fecha</th>
                                    <th scope="col">Concepto</th>
                                    <th scope="col" class="text-right max-sm:hidden">Total factura</th>
                                    <th scope="col" class="text-right">Justificable</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="factura in csvData" :key="getInvoiceKey(factura)">
                                    <td class="whitespace-nowrap">
                                        {{ factura.number }}
                                        <span v-if="factura.sharedNumber" class="shared-badge" :title="`Nº orden repetido en otro año`">{{ factura.date.slice(6) }}</span>
                                    </td>
                                    <td class="whitespace-nowrap">{{ factura.date }}</td>
                                    <td>
                                        <span class="block">{{ factura.concept }}</span>
                                        <span class="block text-xs text-gray-500 dark:text-gray-400">{{ factura.activity }}</span>
                                        <span v-if="!factura.grantExpense" class="block text-xs font-medium text-amber-700 dark:text-amber-300">No justificable · opcional</span>
                                    </td>
                                    <td class="whitespace-nowrap text-right tabular-nums max-sm:hidden">{{ formatEuro(factura.expense) }}</td>
                                    <td class="whitespace-nowrap text-right font-medium tabular-nums">{{ formatEuro(factura.grantExpense) }}</td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr>
                                    <th scope="row" colspan="3">Total ({{ formatCount(csvData.length, 'factura', 'facturas') }})</th>
                                    <td class="whitespace-nowrap text-right tabular-nums max-sm:hidden">{{ formatEuro(totalInvoiced) }}</td>
                                    <td class="whitespace-nowrap text-right tabular-nums">{{ formatEuro(totalJustified) }}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </UCard>

            <!-- Paso 2: datos de la asociación -->
            <UCard>
                <template #header>
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h2 class="text-xl font-semibold text-gray-950 dark:text-white">2. Datos de la asociación</h2>
                            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Se guardan solo en este navegador para que no tengas que repetirlos.</p>
                        </div>
                        <UButton
                            v-if="hasAnyAssociationData"
                            variant="ghost"
                            color="neutral"
                            size="sm"
                            icon="i-heroicons-trash"
                            label="Borrar mis datos"
                            @click="clearAssociationData"
                        />
                    </div>
                </template>

                <UForm :state="formData" class="grid gap-4 md:grid-cols-2">
                    <UFormField label="Nombre de la asociación" name="associationName" required>
                        <UInput v-model="formData.associationName" class="w-full" placeholder="Asociación Ejemplo XYZ" autocomplete="organization" />
                    </UFormField>
                    <UFormField label="CIF de la asociación" name="associationCif" required :error="associationCifWarning">
                        <UInput v-model="formData.associationCif" class="w-full" placeholder="G12345674" @blur="touchedIds.associationCif = true" />
                    </UFormField>
                    <UFormField label="Nombre y apellidos del representante" name="representativeName" required>
                        <UInput v-model="formData.representativeName" class="w-full" placeholder="Juan Pérez García" autocomplete="name" />
                    </UFormField>
                    <UFormField label="DNI/NIE del representante" name="representativeId" required :error="representativeIdWarning">
                        <UInput v-model="formData.representativeId" class="w-full" placeholder="12345678Z" @blur="touchedIds.representativeId = true" />
                    </UFormField>
                </UForm>
            </UCard>

            <!-- Paso 3: facturas PDF -->
            <UCard>
                <template #header>
                    <h2 class="text-xl font-semibold text-gray-950 dark:text-white">3. Une las facturas en PDF <span class="font-normal text-gray-500">(opcional)</span></h2>
                    <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Si eliges la carpeta donde las guardas, crearemos también un único PDF con las facturas incluidas en el paso 1, en el mismo orden.</p>
                </template>

                <div class="grid gap-5 md:grid-cols-[minmax(0,1fr)_220px] md:items-start">
                    <div class="space-y-3 text-sm leading-6 text-gray-700 dark:text-gray-300">
                        <p>Los archivos deben llamarse <code>facturaNNN.pdf</code>, por ejemplo <code>factura001.pdf</code> o <code>factura042.pdf</code>.</p>
                        <p>El número <code>NNN</code> es el de la columna «Nº orden» de tu plantilla.</p>
                        <p v-if="includeNonJustifiable">También buscaremos las facturas sin gasto justificable que has decidido incluir.</p>
                        <p>También puedes poner delante el año con dos cifras: <code>factura26-001.pdf</code>, <code>factura25-042.pdf</code>.</p>
                        <p v-if="sharedNumbers.length > 0" class="font-medium text-amber-700 dark:text-amber-300">
                            Las facturas con «Nº orden» repetido llevan además el año: {{ joinList(sharedFileNames) }}.
                        </p>
                        <p v-if="!supportsInvoiceFolderPicker" class="text-amber-700 dark:text-amber-300">Este paso solo funciona en Chrome o Edge. Puedes saltártelo y generar solo el Anexo III.</p>
                    </div>

                    <div class="space-y-2">
                        <UButton
                            class="w-full justify-center"
                            icon="i-heroicons-folder-open"
                            :label="invoiceFolderHandle ? 'Elegir otra carpeta' : 'Elegir carpeta'"
                            :disabled="csvData.length === 0 || isBusy || !supportsInvoiceFolderPicker"
                            :loading="isProcessingFolder"
                            @click="selectAndFindInvoicePdfs"
                        />
                        <p v-if="csvData.length === 0 && supportsInvoiceFolderPicker" class="text-center text-xs text-gray-500 dark:text-gray-400">
                            Primero sube tus facturas en el paso 1.
                        </p>
                    </div>
                </div>

                <div class="mt-5 space-y-3">
                    <div v-if="searchError" class="status-panel status-panel-error" role="alert">
                        <UIcon name="i-heroicons-exclamation-circle" class="mt-0.5 size-5 shrink-0" />
                        <p>{{ searchError }}</p>
                    </div>
                    <div v-else-if="invoiceFolderHandle && !isProcessingFolder" class="status-panel" :class="missingInvoiceNumbers.length > 0 ? 'status-panel-warning' : 'status-panel-success'">
                        <UIcon :name="missingInvoiceNumbers.length > 0 ? 'i-heroicons-exclamation-triangle' : 'i-heroicons-check-circle'" class="mt-0.5 size-5 shrink-0" />
                        <div>
                            <p>
                                Carpeta <strong>{{ invoiceFolderHandle.name }}</strong>:
                                {{ formatFoundInvoices(foundInvoicePdfs.size, csvData.length) }}.
                            </p>
                            <p v-if="missingInvoiceNumbers.length > 0">
                                <strong>No encontramos:</strong> {{ joinList(missingInvoiceNumbers) }}. Revisa que esos archivos estén en la carpeta y se llamen así.
                            </p>
                        </div>
                    </div>
                    <div v-else-if="!isProcessingFolder" class="status-panel status-panel-muted">
                        <UIcon name="i-heroicons-folder" class="mt-0.5 size-5 shrink-0" />
                        <p>Puedes saltarte este paso y generar solo el Anexo III.</p>
                    </div>
                    <div v-if="unreadableFiles.length > 0" class="status-panel status-panel-warning">
                        <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 size-5 shrink-0" />
                        <p><strong>No hemos podido abrir:</strong> {{ unreadableFiles.join(', ') }}. Comprueba que no están abiertos en otro programa y vuelve a elegir la carpeta.</p>
                    </div>
                </div>
                <div v-if="invoiceFolderHandle && !isProcessingFolder" class="mt-6 space-y-3 border-t border-gray-200 pt-5 dark:border-gray-800">
                    <h3 class="font-semibold text-gray-950 dark:text-white">Añade otros PDF <span class="font-normal text-gray-500 dark:text-gray-400">(opcional)</span></h3>
                    <p id="extra-pdf-help" class="text-sm leading-6 text-gray-600 dark:text-gray-400">
                        Puedes añadir otros documentos PDF. Se colocarán al final del PDF de facturas,
                        en el orden de esta lista. Puedes mantener sus nombres originales.
                    </p>
                    <label for="extra-pdf-input" class="block text-sm font-medium text-gray-950 dark:text-white">Seleccionar PDF adicionales</label>
                    <input
                        id="extra-pdf-input"
                        type="file"
                        accept=".pdf,application/pdf"
                        multiple
                        :disabled="isBusy"
                        aria-describedby="extra-pdf-help"
                        class="block w-full min-w-0 rounded-md text-sm text-gray-700 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary-50 file:px-4 file:py-3 file:font-medium file:text-primary-700 hover:file:bg-primary-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 dark:text-gray-300 dark:file:bg-primary-950 dark:file:text-primary-300 dark:hover:file:bg-primary-900"
                        @change="handleExtraPdfChange"
                    >
                    <div v-if="extraPdfSelectionError" class="status-panel status-panel-warning" role="alert">
                        <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 size-5 shrink-0" />
                        <p>{{ extraPdfSelectionError }}</p>
                    </div>
                    <ol v-if="extraPdfFiles.length > 0" class="divide-y divide-gray-200 dark:divide-gray-800" aria-label="PDF adicionales, en orden de inclusión">
                        <li v-for="(file, index) in extraPdfFiles" :key="`${file.name}-${file.size}-${file.lastModified}`" class="flex items-center gap-3 py-2">
                            <span class="shrink-0 text-sm text-gray-500 dark:text-gray-400">{{ index + 1 }}.</span>
                            <span class="min-w-0 flex-1 break-words text-sm text-gray-700 dark:text-gray-300">{{ file.name }}</span>
                            <UButton
                                variant="ghost"
                                color="neutral"
                                icon="i-heroicons-x-mark"
                                label="Quitar"
                                :aria-label="`Quitar ${file.name}`"
                                :disabled="isBusy"
                                @click="removeExtraPdf(index)"
                            />
                        </li>
                    </ol>
                </div>
            </UCard>

            <!-- Paso 4: generar y descargar -->
            <UCard>
                <template #header>
                    <h2 class="text-xl font-semibold text-gray-950 dark:text-white">4. Genera y descarga</h2>
                </template>

                <div class="space-y-5">
                    <div v-if="missingRequirements.length > 0 && !isGenerating" class="status-panel status-panel-muted">
                        <UIcon name="i-heroicons-clipboard-document-list" class="mt-0.5 size-5 shrink-0" />
                        <div>
                            <p class="font-medium">Para generar los documentos falta:</p>
                            <ul class="mt-1 list-disc pl-5">
                                <li v-for="item in missingRequirements" :key="item">{{ item }}</li>
                            </ul>
                        </div>
                    </div>

                    <div v-if="isOutdated && !isGenerating" class="status-panel status-panel-warning" role="status">
                        <UIcon name="i-heroicons-arrow-path" class="mt-0.5 size-5 shrink-0" />
                        <p><strong>Has cambiado datos después de generar.</strong> Vuelve a generar para que los documentos estén al día.</p>
                    </div>

                    <UButton
                        block
                        size="xl"
                        color="primary"
                        icon="i-heroicons-document-plus"
                        :label="hasResults ? 'Volver a generar documentos' : 'Generar documentos'"
                        :loading="isGenerating"
                        :disabled="!isReadyToGenerate || isBusy"
                        @click="requestGeneration"
                    />

                    <UModal
                        v-model:open="isDiscardConfirmOpen"
                        title="Hay facturas que no se incluirán"
                        :ui="{ content: 'max-w-lg' }"
                    >
                        <template #body>
                            <p class="text-gray-700 dark:text-gray-300">
                                {{ formatCount(errorRows.length, 'fila tiene', 'filas tienen') }} errores y no {{ errorRows.length === 1 ? 'aparecerá' : 'aparecerán' }} en el Anexo III.
                                Solo {{ csvData.length === 1 ? 'se incluirá' : 'se incluirán' }} {{ formatCount(csvData.length, 'factura', 'facturas') }}, por un total justificable de <strong>{{ formatEuro(totalJustified) }}</strong>.
                            </p>
                            <p class="mt-3 text-gray-700 dark:text-gray-300">Lo recomendable es corregir el archivo y volver a subirlo.</p>
                        </template>
                        <template #footer>
                            <div class="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <UButton variant="ghost" color="neutral" label="Generar sin esas filas" @click="runGeneration" />
                                <UButton label="Corregir primero" @click="isDiscardConfirmOpen = false" />
                            </div>
                        </template>
                    </UModal>

                    <div v-if="isGenerating" class="space-y-4" aria-live="polite">
                        <div v-if="isGeneratingAnexo">
                            <div class="mb-2 flex justify-between text-sm font-medium">
                                <span>Generando Anexo III</span>
                                <span>{{ anexoGenerationProgress }}%</span>
                            </div>
                            <UProgress :model-value="anexoGenerationProgress" size="sm" />
                        </div>
                        <div v-if="isMergingPdfs">
                            <div class="mb-2 flex justify-between text-sm font-medium">
                                <span>Uniendo facturas y documentos</span>
                                <span>{{ pdfMergeProgress }}%</span>
                            </div>
                            <UProgress :model-value="pdfMergeProgress" size="sm" />
                        </div>
                    </div>

                    <div v-else-if="showResultsSection" class="space-y-5 border-t border-gray-200 pt-5 dark:border-gray-800" aria-live="polite">
                        <div>
                            <h3 class="font-semibold text-gray-950 dark:text-white">Anexo III</h3>
                            <div v-if="anexoResults.length > 0" class="mt-3 space-y-2">
                                <p v-if="anexoSummary" class="text-sm text-green-700 dark:text-green-300">
                                    Listo: {{ formatCount(anexoSummary.pages, 'página', 'páginas') }},
                                    {{ formatCount(anexoSummary.invoices, 'factura', 'facturas') }},
                                    {{ formatEuro(anexoSummary.total) }} justificados.
                                </p>
                                <a
                                    v-for="(result, index) in anexoResults"
                                    :key="`anexo-${index}`"
                                    :href="result.url"
                                    :download="result.name"
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
                        </div>

                        <div v-if="invoiceFolderHandle">
                            <h3 class="font-semibold text-gray-950 dark:text-white">Facturas unidas</h3>
                            <div v-if="mergedPdfUrl" class="mt-3 space-y-2">
                                <p v-if="mergedSummary" class="text-sm text-green-700 dark:text-green-300">
                                    Listo: {{ formatCount(mergedSummary.invoices, 'factura', 'facturas') }}<template v-if="mergedSummary.extras > 0"> y {{ formatCount(mergedSummary.extras, 'PDF adicional', 'PDF adicionales') }}</template>
                                    en {{ formatCount(mergedSummary.pages, 'página', 'páginas') }}.
                                </p>
                                <a :href="mergedPdfUrl" :download="MERGED_PDF_NAME" class="download-link">
                                    <UIcon name="i-heroicons-arrow-down-tray" class="size-4 shrink-0" />
                                    <span class="truncate">{{ MERGED_PDF_NAME }}</span>
                                </a>
                                <p v-if="pdfMergeError" class="text-sm text-amber-700 dark:text-amber-300">Algunos PDF no se han podido añadir. {{ pdfMergeError }}</p>
                            </div>
                            <div v-else-if="pdfMergeError" class="status-panel status-panel-error mt-3">
                                <UIcon name="i-heroicons-exclamation-circle" class="mt-0.5 size-5 shrink-0" />
                                <p>{{ pdfMergeError }}</p>
                            </div>
                            <p v-else-if="foundInvoicePdfs.size === 0" class="mt-2 text-sm text-amber-700 dark:text-amber-300">No se encontraron facturas en la carpeta.</p>
                        </div>

                        <UButton
                            v-if="downloadableResults.length > 1"
                            variant="soft"
                            icon="i-heroicons-arrow-down-tray"
                            label="Descargar todo"
                            @click="downloadAll"
                        />

                        <p v-if="anexoResults.length > 0" class="text-sm text-gray-600 dark:text-gray-400">
                            Abre los PDF y revísalos antes de presentarlos. El Anexo III se firma después de descargarlo.
                        </p>
                    </div>
                </div>
            </UCard>
        </main>
    </UContainer>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { useAppConfig } from '#app';
import { parse, getTime, isValid } from 'date-fns';

import { useCsvHandling, acceptedInvoiceFileTypes } from '~/composables/useCsvHandling';
import { useInvoiceFolder } from '~/composables/useInvoiceFolder';
import { useDocumentGeneration } from '~/composables/useDocumentGeneration';
import { isValidCif, isValidDniNie, normalizeId } from '~/utils/idUtils';
import { getExpectedInvoiceFileName, getInvoiceKey } from '~/utils/fileUtils';
import { selectInvoicesForGeneration } from '~/utils/csvUtils';

const LOCAL_STORAGE_KEY = 'associationFormData';
const TEMPLATE_XLSX_URL = '/Facturas Subvención - Plantilla.xlsx';
const TEMPLATE_CSV_URL = '/Facturas Subvención - Plantilla.csv';
const MERGED_PDF_NAME = 'Facturas_Adjuntas.pdf';
const MAX_INLINE_ERROR_ROWS = 5;

// Configuración App (Fechas)
const appConfig = useAppConfig();
const { startDate: configStartDateString, endDate: configEndDateString } = appConfig.invoiceDateRange;
const startDate = parse(configStartDateString, 'dd/MM/yyyy', new Date());
const endDate = parse(configEndDateString, 'dd/MM/yyyy', new Date());

if (!isValid(startDate) || !isValid(endDate)) {
    console.error('¡Error Crítico! Las fechas de inicio/fin en app.config.ts no son válidas! Verifica el formato dd/MM/yyyy.');
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

onMounted(() => {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData) {
        try {
            Object.assign(formData, JSON.parse(savedData));
        } catch (e) {
            console.error('Error al parsear datos de asociación desde localStorage:', e);
            localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
    }
});

watch(formData, (newData) => {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newData));
    } catch (e) {
        console.error('Error al guardar datos de asociación en localStorage:', e);
    }
}, { deep: true });

const clearAssociationData = () => {
    Object.assign(formData, { associationName: '', associationCif: '', representativeName: '', representativeId: '' });
    touchedIds.associationCif = false;
    touchedIds.representativeId = false;
    try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
        console.error('Error al borrar datos de asociación de localStorage:', e);
    }
};

// Validación orientativa de CIF y DNI/NIE: avisa, pero no bloquea la generación
const touchedIds = reactive({ associationCif: false, representativeId: false });

const shouldCheckId = (value: string, touched: boolean) => {
    const id = normalizeId(value);
    return id.length > 0 && (touched || id.length >= 9);
};

const associationCifWarning = computed(() =>
    shouldCheckId(formData.associationCif, touchedIds.associationCif) && !isValidCif(formData.associationCif)
        ? 'Este CIF no parece correcto. Revisa que no falte ni sobre ninguna letra o número.'
        : undefined
);

const representativeIdWarning = computed(() =>
    shouldCheckId(formData.representativeId, touchedIds.representativeId) && !isValidDniNie(formData.representativeId)
        ? 'Este DNI/NIE no parece correcto. Comprueba los números y la letra.'
        : undefined
);


// --- Inicializar Composables ---

const includeNonJustifiable = ref(false);
const extraPdfFiles = ref<File[]>([]);
const extraPdfSelectionError = ref<string | null>(null);

// Al cargar un archivo nuevo, la carpeta y los documentos generados dejan de valer
const resetDependentSteps = () => {
    resetFolderState();
    resetGenerationState();
    extraPdfFiles.value = [];
    extraPdfSelectionError.value = null;
    lastGenerationKey.value = null;
};

const {
    csvFile,
    csvData: parsedInvoices,
    parsingError,
    parsingRowErrors,
    parsingRowWarnings,
    sharedNumbers,
    isReadingFile,
    handleFileChange,
    loadFile
} = useCsvHandling(startDateTimestamp, endDateTimestamp, configStartDateString, configEndDateString, () => {
    includeNonJustifiable.value = false;
    resetDependentSteps();
});

const csvData = computed(() => selectInvoicesForGeneration(parsedInvoices.value, includeNonJustifiable.value));

watch(includeNonJustifiable, resetDependentSteps, { flush: 'sync' });

const {
    invoiceFolderHandle,
    foundInvoicePdfs,
    missingInvoiceNumbers,
    isProcessingFolder,
    searchError,
    unreadableFiles,
    selectAndFindInvoicePdfs,
    resetFolderState
} = useInvoiceFolder(csvData);

const {
    isGenerating,
    isGeneratingAnexo,
    anexoGenerationProgress,
    anexoResults,
    anexoError,
    anexoSummary,
    isMergingPdfs,
    pdfMergeProgress,
    mergedPdfUrl,
    pdfMergeError,
    mergedSummary,
    generateDocuments,
    resetGenerationState
} = useDocumentGeneration(csvData, formData, invoiceFolderHandle, foundInvoicePdfs, extraPdfFiles);

// --- Subida de archivo ---

const isDragging = ref(false);

const handleDrop = (event: DragEvent) => {
    isDragging.value = false;
    const file = event.dataTransfer?.files?.[0];
    if (file && !isBusy.value) void loadFile(file);
};

const handleExtraPdfChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (isBusy.value || !invoiceFolderHandle.value) return;

    const rejected = files.filter(file => !/\.pdf$/i.test(file.name));
    extraPdfSelectionError.value = rejected.length > 0
        ? `Solo puedes añadir archivos PDF. No se han añadido: ${rejected.map(file => file.name).join(', ')}.`
        : null;
    for (const file of files) {
        if (!/\.pdf$/i.test(file.name)) continue;
        const alreadyAdded = extraPdfFiles.value.some(existing =>
            existing.name === file.name && existing.size === file.size && existing.lastModified === file.lastModified);
        if (!alreadyAdded) extraPdfFiles.value.push(file);
    }
};

const removeExtraPdf = (index: number) => {
    if (!isBusy.value) extraPdfFiles.value.splice(index, 1);
};

// --- Formato ---

const formatCount = (count: number, singular: string, plural: string) => `${count} ${count === 1 ? singular : plural}`;

const euroFormatter = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const formatEuro = (value: number | undefined) => (value === undefined ? '—' : euroFormatter.format(value));

// "a, b y c"
const joinList = (items: string[]) =>
    items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;

const formatFoundInvoices = (found: number, total: number) =>
    `${formatCount(found, 'factura encontrada', 'facturas encontradas')} de ${total}`;

// --- Estado derivado ---

const isBusy = computed(() => isGenerating.value || isProcessingFolder.value || isReadingFile.value);

// Errores agrupados por fila para mostrarlos juntos
const errorRows = computed(() => {
    const rows = new Map<number, { line: number; context?: string; messages: string[] }>();
    for (const error of parsingRowErrors.value) {
        const row = rows.get(error.line) ?? { line: error.line, context: error.context, messages: [] };
        row.messages.push(error.message);
        rows.set(error.line, row);
    }
    return [...rows.values()];
});

// Nombres de archivo de las facturas cuyo Nº orden se repite en otro año
const sharedFileNames = computed(() =>
    csvData.value
        .filter(factura => factura.sharedNumber)
        .map(factura => getExpectedInvoiceFileName(factura))
        .filter((name): name is string => !!name)
);
// Ejemplo con el mismo número en sus distintos años (factura25-025.pdf y factura26-025.pdf)
const sharedFileNameExample = computed(() => {
    const firstShared = sharedNumbers.value[0]?.number;
    return joinList(csvData.value
        .filter(factura => factura.number === firstShared)
        .map(factura => getExpectedInvoiceFileName(factura))
        .filter((name): name is string => !!name));
});

const totalInvoiced = computed(() => csvData.value.reduce((sum, factura) => sum + (factura.expense ?? 0), 0));
const totalJustified = computed(() => csvData.value.reduce((sum, factura) => sum + (factura.grantExpense ?? 0), 0));
const estimatedAnexoPages = computed(() => Math.max(1, Math.ceil(csvData.value.length / appConfig.pdfTemplate.maxRowsPerPage)));

const associationFieldLabels = {
    associationName: 'Nombre de la asociación',
    associationCif: 'CIF de la asociación',
    representativeName: 'Nombre del representante',
    representativeId: 'DNI/NIE del representante'
} as const;

const missingAssociationFields = computed(() =>
    (Object.keys(associationFieldLabels) as (keyof typeof associationFieldLabels)[])
        .filter(key => !formData[key].trim())
        .map(key => associationFieldLabels[key])
);

const hasAnyAssociationData = computed(() => Object.values(formData).some(value => value.trim() !== ''));

const missingRequirements = computed(() => {
    const items: string[] = [];
    if (csvData.value.length === 0) {
        items.push(parsedInvoices.value.length > 0
            ? 'Añadir facturas con gasto justificable o activar la inclusión opcional de las no justificables (paso 1)'
            : 'Subir el archivo de facturas sin errores (paso 1)');
    }
    missingAssociationFields.value.forEach(label => items.push(`${label} (paso 2)`));
    return items;
});

const isReadyToGenerate = computed(() => missingRequirements.value.length === 0);

const supportsInvoiceFolderPicker = ref(false);
onMounted(() => {
    supportsInvoiceFolderPicker.value = 'showDirectoryPicker' in window;
});

const hasResults = computed(() => anexoResults.value.length > 0 || !!mergedPdfUrl.value);

const showResultsSection = computed(() =>
    hasResults.value || !!anexoError.value || !!pdfMergeError.value
);

// --- Generación ---

const isDiscardConfirmOpen = ref(false);

// Huella de los datos usados en la última generación, para avisar si cambian después
const lastGenerationKey = ref<string | null>(null);
const generationKey = computed(() => JSON.stringify({
    form: formData,
    includeNonJustifiable: includeNonJustifiable.value,
    file: csvFile.value ? [csvFile.value.name, csvFile.value.lastModified, csvData.value.length] : null,
    invoices: [...foundInvoicePdfs.value.keys()],
    extraPdfs: extraPdfFiles.value.map(file => [file.name, file.size, file.lastModified])
}));

const isOutdated = computed(() =>
    hasResults.value && lastGenerationKey.value !== null && lastGenerationKey.value !== generationKey.value
);

const runGeneration = async () => {
    isDiscardConfirmOpen.value = false;
    const key = generationKey.value;
    await generateDocuments();
    lastGenerationKey.value = key;
};

const requestGeneration = () => {
    if (errorRows.value.length > 0) {
        isDiscardConfirmOpen.value = true;
        return;
    }
    void runGeneration();
};

const downloadableResults = computed(() => [
    ...anexoResults.value,
    ...(mergedPdfUrl.value ? [{ name: MERGED_PDF_NAME, url: mergedPdfUrl.value }] : [])
]);

const downloadAll = async () => {
    for (const result of downloadableResults.value) {
        const link = document.createElement('a');
        link.href = result.url;
        link.download = result.name;
        link.click();
        // Algunos navegadores ignoran descargas lanzadas a la vez
        await new Promise(resolve => setTimeout(resolve, 300));
    }
};

// --- Estado de los pasos ---

type StepState = 'pending' | 'ready' | 'warning';

const stepChips = computed<{ number: number; title: string; status: string; state: StepState }[]>(() => {
    const invoicesStep = (): { status: string; state: StepState } => {
        if (isReadingFile.value) return { status: 'Leyendo…', state: 'pending' };
        if (parsingError.value) return { status: 'Revisar archivo', state: 'warning' };
        if (errorRows.value.length > 0) {
            return { status: `${formatCount(csvData.value.length, 'lista', 'listas')} · ${errorRows.value.length} con errores`, state: 'warning' };
        }
        if (sharedNumbers.value.length > 0) {
            return { status: `${formatCount(csvData.value.length, 'lista', 'listas')} · Nº repetidos`, state: 'warning' };
        }
        if (parsingRowWarnings.value.length > 0) {
            return { status: `${formatCount(csvData.value.length, 'incluida', 'incluidas')} · ${parsingRowWarnings.value.length} opcionales`, state: 'warning' };
        }
        if (csvData.value.length > 0) return { status: formatCount(csvData.value.length, 'factura lista', 'facturas listas'), state: 'ready' };
        return { status: 'Pendiente', state: 'pending' };
    };

    const dataStep = (): { status: string; state: StepState } => {
        const missing = missingAssociationFields.value.length;
        if (missing === 0) {
            return associationCifWarning.value || representativeIdWarning.value
                ? { status: 'Revisar CIF o DNI', state: 'warning' }
                : { status: 'Completo', state: 'ready' };
        }
        return { status: missing === 1 ? 'Falta 1 dato' : `Faltan ${missing} datos`, state: 'pending' };
    };

    const pdfStep = (): { status: string; state: StepState } => {
        if (!supportsInvoiceFolderPicker.value) return { status: 'Solo en Chrome o Edge', state: 'pending' };
        if (searchError.value) return { status: 'Revisar carpeta', state: 'warning' };
        if (invoiceFolderHandle.value && !isProcessingFolder.value) {
            const status = `${foundInvoicePdfs.value.size} de ${csvData.value.length} encontradas`;
            return { status, state: missingInvoiceNumbers.value.length > 0 ? 'warning' : 'ready' };
        }
        return { status: 'Opcional', state: 'pending' };
    };

    const downloadStep = (): { status: string; state: StepState } => {
        if (isGenerating.value) return { status: 'Generando…', state: 'pending' };
        if (isOutdated.value) return { status: 'Vuelve a generar', state: 'warning' };
        if (hasResults.value) return { status: 'Listo para descargar', state: 'ready' };
        if (anexoError.value || pdfMergeError.value) return { status: 'Con errores', state: 'warning' };
        return { status: 'Pendiente', state: 'pending' };
    };

    return [
        { number: 1, title: 'Facturas', ...invoicesStep() },
        { number: 2, title: 'Datos', ...dataStep() },
        { number: 3, title: 'PDF facturas', ...pdfStep() },
        { number: 4, title: 'Descarga', ...downloadStep() }
    ];
});

// --- Ayuda de columnas ---

const columnHelp = [
    { column: 'Nº orden', required: true, description: ['Número de la fila: 1, 2, 3...', 'Sirve para encontrar el PDF de cada factura (factura001.pdf).', 'Solo puede repetirse en facturas de años distintos; entonces el PDF lleva delante el año (factura26-001.pdf).'] },
    { column: 'Nº factura', required: true, description: ['Número que aparece en la factura (ej. F12345, 2406109).'] },
    { column: 'Fecha', required: true, description: ['Fecha de la factura (ej. 15/01/2026).'] },
    { column: 'Fecha de pago', required: false, description: ['Fecha en que se pagó.', 'Si la dejas vacía, se usa la fecha de la factura.'] },
    { column: 'Actividad', required: true, description: ['Actividad o proyecto (ej. «Curso Premonitores», «Ocio», «Local»).'] },
    { column: 'Concepto', required: true, description: ['Qué se compró o pagó (ej. «Fotocopias», «Desayuno», «Gasolina»).'] },
    { column: 'Proveedor', required: false, description: ['CIF y nombre del proveedor (ej. «B83409177 / SUR 4 COLORES SL»).'] },
    { column: 'Total Factura', required: true, description: ['Importe total de la factura (ej. 89,00 €).'] },
    { column: 'Gasto Justificable', required: false, description: ['Parte de la factura que justificas con la subvención: igual o menor que el Total Factura.', 'Mantén el título de la columna. Si la celda está vacía o vale 0, se muestra un aviso y la factura se excluye por defecto; puedes incluirla de forma totalmente opcional.', 'Debes justificar el importe SOLICITADO de subvención, no el concedido.'] }
];

// --- Limpieza al desmontar ---
onUnmounted(() => {
    if (mergedPdfUrl.value) {
        URL.revokeObjectURL(mergedPdfUrl.value);
    }
    anexoResults.value.forEach(result => URL.revokeObjectURL(result.url));
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

.step-chip-warning {
    border-color: rgb(245 158 11 / 0.5);
    background: rgb(255 251 235);
}

.step-chip-warning .step-number {
    background: rgb(245 158 11);
    color: white;
}

:global(.dark) .step-chip-warning {
    background: rgb(120 53 15 / 0.24);
}

.substep {
    display: flex;
    gap: 0.875rem;
    align-items: flex-start;
}

.substep-letter {
    display: grid;
    width: 1.75rem;
    height: 1.75rem;
    flex: 0 0 auto;
    place-items: center;
    border-radius: 999px;
    background: color-mix(in oklab, var(--ui-primary) 12%, transparent);
    color: var(--ui-primary);
    font-size: 0.875rem;
    font-weight: 700;
}

.drop-zone {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    align-items: center;
    justify-content: center;
    padding: 1.75rem 1rem;
    border: 2px dashed var(--ui-border-accented);
    border-radius: 0.875rem;
    background: var(--ui-bg-muted);
    color: var(--ui-text);
    text-align: center;
    cursor: pointer;
    transition: border-color 0.15s, background-color 0.15s;
}

.drop-zone > * {
    pointer-events: none;
}

.drop-zone:hover,
.drop-zone-active {
    border-color: var(--ui-primary);
    background: color-mix(in oklab, var(--ui-primary) 6%, transparent);
}

.drop-zone:has(input:focus-visible) {
    outline: 2px solid var(--ui-primary);
    outline-offset: 2px;
}

.drop-zone-disabled {
    cursor: not-allowed;
    opacity: 0.6;
}

.shared-badge {
    display: inline-block;
    margin-left: 0.25rem;
    border-radius: 999px;
    background: rgb(254 243 199);
    padding: 0 0.375rem;
    color: rgb(146 64 14);
    font-size: 0.6875rem;
    font-weight: 700;
    line-height: 1.125rem;
}

:global(.dark) .shared-badge {
    background: rgb(120 53 15 / 0.35);
    color: rgb(253 230 138);
}

.error-row {
    border-radius: 0.625rem;
    background: rgb(255 255 255 / 0.7);
    padding: 0.625rem 0.75rem;
}

:global(.dark) .error-row {
    background: rgb(0 0 0 / 0.2);
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

.preview-table-wrap {
    max-height: 28rem;
    overflow: auto;
    border: 1px solid var(--ui-border);
    border-radius: 0.875rem;
}

.preview-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
    line-height: 1.25rem;
}

.preview-table th,
.preview-table td {
    padding: 0.625rem 0.75rem;
    text-align: left;
    vertical-align: top;
}

.preview-table thead th {
    position: sticky;
    top: 0;
    background: color-mix(in oklab, var(--ui-primary) 8%, var(--ui-bg));
    color: var(--ui-text-highlighted);
    font-weight: 700;
}

.preview-table tbody td {
    border-top: 1px solid var(--ui-border);
}

.preview-table tfoot th,
.preview-table tfoot td {
    position: sticky;
    bottom: 0;
    border-top: 2px solid var(--ui-border-accented);
    background: var(--ui-bg-elevated);
    color: var(--ui-text-highlighted);
    font-weight: 700;
}

.preview-table .text-right {
    text-align: right;
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
    width: 10rem;
}

.csv-help-table th:nth-child(2),
.csv-help-table td:nth-child(2) {
    width: 8rem;
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

.csv-badge-optional {
    background: rgb(220 252 231);
    color: rgb(22 101 52);
}

:global(.dark) .csv-badge-required {
    background: rgb(127 29 29 / 0.35);
    color: rgb(254 202 202);
}

:global(.dark) .csv-badge-optional {
    background: rgb(20 83 45 / 0.35);
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
