import type { Factura } from '~/types';
import { parse, getTime, isValid } from 'date-fns';

/**
 * Limpia el texto de caracteres problemáticos incluyendo:
 * - Caracteres de control Unicode (U+0000 a U+001F, U+007F a U+009F)
 * - Zero-width characters (U+200B a U+200F)
 * - Direccionales Unicode (LTR, RTL marks, etc.) (U+202A a U+202E)
 * - Otros caracteres invisibles problemáticos
 * - BOM (Byte Order Mark)
 * @param text El texto a limpiar
 * @returns El texto limpiado
 */
export function cleanText(text: string): string {
    if (!text) return text;

    // Eliminar caracteres de control Unicode y otros caracteres problemáticos:
    // \u0000-\u001F: Caracteres de control C0 (incluye tabs, newlines, etc.)
    // \u007F-\u009F: Caracteres de control C1 y DEL
    // \u200B-\u200F: Zero-width spaces, joiners, LTR/RTL marks
    // \u202A-\u202E: Embedding y override direccionales (LRE, RLE, PDF, LRO, RLO)
    // \u2060-\u206F: Word joiner, invisible operators, etc.
    // \uFEFF: BOM (Byte Order Mark)
    // eslint-disable-next-line no-control-regex
    const cleaned = text.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, '');

    return cleaned.trim();
}

/**
 * Opciones para definir cómo parsear cada columna del CSV.
 */
interface ColumnOptions {
    name: keyof Factura;
    headerName: string; // Nombre exacto de la cabecera en el archivo CSV
    parse?: (value: string) => number | string | undefined;
    required?: boolean; // Añadir si es requerido para validar
    isDate?: boolean; // Marcar si es el campo de fecha
    discardEmpty?: boolean; // Si es true, no se guarda el campo si está vacío
}

/**
 * Detecta el separador más probable del CSV analizando la primera línea.
 * Prueba con los separadores más comunes y verifica que produzcan al menos
 * el número mínimo de columnas requerido (puede haber columnas extra).
 * 
 * @param csvString Contenido del archivo CSV.
 * @param minColumnCount Número mínimo de columnas requeridas.
 * @returns El separador detectado.
 */
export function detectCsvSeparator(csvString: string, minColumnCount: number): string {
    const lines = csvString.trim().split('\n');
    if (lines.length === 0) return ';'; // Default fallback

    const firstLine = lines[0];
    const possibleSeparators = [';', ',', '\t', '|'];

    // Buscar el separador que produzca al menos el número mínimo de columnas
    for (const sep of possibleSeparators) {
        const columns = firstLine.split(sep);
        if (columns.length >= minColumnCount) {
            return sep;
        }
    }

    // Si ninguno tiene el mínimo, usar el que más se acerque
    const counts = possibleSeparators.map(sep => ({
        separator: sep,
        count: firstLine.split(sep).length
    }));

    // Ordenar por diferencia mínima con el número mínimo esperado
    counts.sort((a, b) =>
        Math.abs(a.count - minColumnCount) - Math.abs(b.count - minColumnCount)
    );

    return counts[0].separator;
}

/**
 * Convierte un string (potencialmente con símbolo € y coma decimal) a número.
 * Maneja el formato español donde el punto es separador de miles y la coma es separador decimal.
 * Ejemplo: "1.958,08 €" -> 1958.08
 */
export function convertFloat(input: string): number | undefined {
    // 1. Eliminar el símbolo € y espacios
    let cleanedInput = input.replace(/\s*€/g, "").trim();
    // Devolver undefined si está vacío después de limpiar
    if (cleanedInput === "") return undefined;

    // 2. Eliminar los puntos (separadores de miles en formato español)
    cleanedInput = cleanedInput.replace(/\./g, "");

    // 3. Reemplazar la coma (separador decimal español) por punto (formato JS)
    cleanedInput = cleanedInput.replace(/,/g, ".");

    const result = parseFloat(cleanedInput);
    return isNaN(result) ? undefined : result; // Devolver undefined si no es un número válido
}

/**
 * Definición de las columnas esperadas en el archivo CSV.
 */
export const csvColumns: ColumnOptions[] = [
    { name: "number", headerName: "#", required: true },
    { name: "providerNumber", headerName: "Proveedor", required: false },
    { name: "date", headerName: "Fecha", required: true, isDate: true },
    { name: "datePay", headerName: "Fecha de pago", required: false, isDate: true },
    { name: "activity", headerName: "Actividad", required: true },
    { name: "concept", headerName: "Concepto", required: true },
    { name: "expense", headerName: "Total Factura", parse: convertFloat, required: true }, // Total factura
    { name: "grantExpense", headerName: "Gasto Justificable", parse: convertFloat, required: false, discardEmpty: true } // Gasto justificable
    // Añadir 'income' y 'total' si se necesitan en el futuro
];

/**
 * Resultados del parseo CSV, incluyendo datos válidos y errores.
 */
export interface CsvParseResult {
    data: Factura[];
    errors: { line: number; message: string }[];
    generalError: string | null;
}

/**
 * Parsea un string CSV a un array de objetos Factura.
 * Valida columnas, tipos y el rango de fechas.
 *
 * @param csvString Contenido del archivo CSV.
 * @param startDateTimestamp Fecha de inicio válida (timestamp).
 * @param endDateTimestamp Fecha de fin válida (timestamp).
 * @param configStartDateString Fecha de inicio para mensajes de error (dd/MM/yyyy).
 * @param configEndDateString Fecha de fin para mensajes de error (dd/MM/yyyy).
 * @returns Objeto CsvParseResult con datos y errores.
 */
export const parseCsvContent = (
    csvString: string,
    startDateTimestamp: number,
    endDateTimestamp: number,
    configStartDateString: string,
    configEndDateString: string
): CsvParseResult => {
    const lines = csvString.trim().split('\n');
    const data: Factura[] = [];
    const errors: { line: number; message: string }[] = [];
    let generalError: string | null = null;

    if (lines.length < 2) {
        return { data, errors, generalError: "El archivo CSV está vacío o solo contiene la cabecera." };
    }

    // Detectar el separador del CSV basándonos en el número mínimo de columnas requeridas
    const separator = detectCsvSeparator(csvString, csvColumns.length);

    // Leer y limpiar los nombres de la cabecera REAL del archivo
    const headerNames = lines[0].split(separator).map(h => h.trim().replace(/^"|"$/g, ''));

    // Crear mapa de cabeceras para búsqueda rápida (case-insensitive)
    const headerMap = new Map<string, number>();
    headerNames.forEach((name, index) => {
        headerMap.set(name.toLowerCase(), index);
    });

    // Crear mapeo de columnas CSV a índices en el archivo
    const columnIndexMap: Record<keyof Factura, number | undefined> = {} as Record<keyof Factura, number | undefined>;
    csvColumns.forEach(col => {
        const idx = headerMap.get(col.headerName.toLowerCase());
        columnIndexMap[col.name] = idx;
    });

    // Validar que todas las cabeceras requeridas estén presentes
    const missingHeaders = csvColumns
        .filter(col => col.required && columnIndexMap[col.name] === undefined)
        .map(col => col.headerName);

    if (missingHeaders.length > 0) {
        return {
            data,
            errors: [{ line: 1, message: `Faltan cabeceras requeridas: ${missingHeaders.join(', ')}` }],
            generalError: "La estructura del CSV no coincide con la plantilla."
        };
    }

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Lógica de parseo de línea CSV (manejo de comillas)
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
                if (nextChar === '"') { currentField += '"'; j++; } // Escaped quote
                else if (line[j + 1] === separator || j + 1 === line.length) { inQuotes = false; continue; } // Fin de campo entrecomillado
                else { currentField += char; } // Quote inside field (technically invalid CSV, but try to handle)
            } else if (char === separator && !inQuotes) {
                values.push(currentField.trim()); currentField = '';
            } else {
                currentField += char;
            }
        }
        values.push(currentField.trim());

        // Verificar que hay suficientes columnas en la fila (puede haber más, pero no menos)
        const requiredColIndices = Object.values(columnIndexMap).filter(idx => idx !== undefined) as number[];
        const maxRequiredIndex = Math.max(...requiredColIndices, -1);

        if (maxRequiredIndex >= values.length) {
            errors.push({ line: i + 1, message: `Número de columnas insuficiente (${values.length} encontrado, se requieren al menos ${maxRequiredIndex + 1} columnas).` });
            continue;
        }


        const factura: Partial<Factura> = {};
        let validRow = true;
        const rawDateValues: Record<string, string> = {}; // Guardar todas las fechas para validación posterior

        for (const column of csvColumns) {
            const csvIndex = columnIndexMap[column.name];

            // Saltar columnas que no están presentes en el CSV
            if (csvIndex === undefined) {
                continue;
            }

            const rawValue = cleanText(values[csvIndex]); // Limpiar caracteres problemáticos
            const headerName = column.headerName; // Usar el nombre de cabecera definido

            // Validar campos requeridos usando el nombre de la cabecera
            if (column.required && !rawValue) {
                // Usar headerName en el mensaje
                errors.push({ line: i + 1, message: `Falta valor requerido en columna '${headerName}'.` });
                validRow = false; continue;
            }
            if (column.discardEmpty && !rawValue) {
                errors.push({ line: i + 1, message: `Campo '${headerName}' vacío, se ha descartado.` });
                validRow = false; continue;
            }

            // Guardar valores de fechas para validación posterior
            if (column.isDate && rawValue) {
                rawDateValues[column.name] = rawValue;
            }

            try {
                const parsedValue = column.parse ? column.parse(rawValue) : rawValue;
                const key = column.name as keyof Factura;

                // Asignación basada en el tipo Factura
                if ((key === 'expense' || key === 'grantExpense' || key === 'income' || key === 'total') && (typeof parsedValue === 'number' || parsedValue === undefined)) {
                    factura[key] = parsedValue;
                } else if (typeof parsedValue === 'string' && !(key === 'expense' || key === 'grantExpense' || key === 'income' || key === 'total')) {
                    factura[key] = parsedValue;
                } else if (parsedValue !== undefined && parsedValue !== null) { // Solo error si hay un valor con tipo incorrecto
                    const expectedType = (key === 'expense' || key === 'grantExpense' || key === 'income' || key === 'total') ? 'número' : 'texto';
                    // Usar headerName también en errores de tipo
                    errors.push({ line: i + 1, message: `Error de tipo en columna '${headerName}'. Se esperaba ${expectedType}, se obtuvo ${typeof parsedValue}.` });
                    validRow = false;
                }
                // No romper el bucle aquí para recoger todos los errores de tipo en la fila

            } catch (parseError: unknown) {
                // Usar headerName en errores de formato
                errors.push({ line: i + 1, message: `Error formato columna '${headerName}'.` });
                console.warn(`Detalle error parseo fila ${i + 1}, columna '${headerName}':`, parseError);
                validRow = false; // Marcar como inválida si falla el parse
            }
        }

        // Si hubo errores de parseo o tipo en las columnas, saltar validación de fechas y final
        if (!validRow) continue;

        // Validar fechas (todas las que estén presentes)
        for (const [fieldName, rawDateValue] of Object.entries(rawDateValues)) {
            try {
                let formattedDate = rawDateValue;
                // Añadir cero inicial si falta para días < 10
                if (formattedDate.match(/^\d\//)) formattedDate = `0${formattedDate}`;
                // Añadir cero inicial si falta para meses < 10 (después del /)
                if (formattedDate.match(/^\d{2}\/\d\//)) {
                    const parts = formattedDate.split('/');
                    formattedDate = `${parts[0]}/0${parts[1]}/${parts[2]}`;
                }

                try {
                    // Estandarizar año a 4 dígitos (siempre 20XX)
                    const parts = formattedDate.split('/');
                    if (parts[2].length === 2) {
                        formattedDate = `${parts[0]}/${parts[1]}/20${parts[2]}`;
                    }
                } catch {
                    throw new Error(`Formato inválido. El formato debe ser DD/MM/YYYY`);
                }

                const invoiceDate = parse(formattedDate, 'dd/MM/yyyy', new Date());
                if (!isValid(invoiceDate)) throw new Error(`Fecha inválida. La fecha ${formattedDate} no existe.`);

                const invoiceTimestamp = getTime(invoiceDate);
                if (invoiceTimestamp < startDateTimestamp || invoiceTimestamp > endDateTimestamp) {
                    throw new Error(`Fuera rango (${configStartDateString} - ${configEndDateString}).`);
                }

                const facturaKey = fieldName as keyof Factura;
                factura[facturaKey] = formattedDate as any;
            } catch (dateError: unknown) {
                const dateColumn = csvColumns.find(c => c.name === fieldName);
                const dateHeaderName = dateColumn?.headerName || fieldName;
                errors.push({ line: i + 1, message: `Error en columna '${dateHeaderName}' (valor: '${rawDateValue}') - ${(dateError instanceof Error) ? dateError.message : 'Inválida'}` });
                validRow = false;
                break;
            }
        }

        // Verificar que las fechas requeridas estén presentes
        for (const column of csvColumns) {
            if (column.isDate && column.required && !rawDateValues[column.name]) {
                errors.push({ line: i + 1, message: `Falta valor requerido en columna '${column.headerName}'.` });
                validRow = false;
                break;
            }
        }

        // Si datePay viene vacío pero date tiene valor, usar la fecha de factura
        if (!factura.datePay && factura.date) {
            factura.datePay = factura.date;
        }

        // Añadir factura si pasó todas las validaciones
        if (validRow) {
            // Asegurarse que todos los campos requeridos estén presentes (aunque ya se validó)
            const completeFactura = factura as Factura;
            data.push(completeFactura);
        }
    }

    if (errors.length > 0) {
        generalError = `Se encontraron errores en ${errors.length} fila(s) del CSV. Revisa los detalles en la tabla.`;
    }

    return { data, errors, generalError };
}