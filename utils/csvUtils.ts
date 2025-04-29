import type { Factura } from '~/types';
import { parse, getTime, isValid } from 'date-fns';

/**
 * Opciones para definir cómo parsear cada columna del CSV.
 */
interface ColumnOptions {
    name: keyof Factura;
    parse?: (value: string) => number | string | undefined;
    required?: boolean; // Añadir si es requerido para validar
    isDate?: boolean; // Marcar si es el campo de fecha
    discardEmpty?: boolean; // Si es true, no se guarda el campo si está vacío
}

/**
 * Convierte un string (potencialmente con símbolo € y coma decimal) a número.
 */
export function convertFloat(input: string): number | undefined {
    const cleanedInput = input.replace(/\s*€/g, "").replace(/,/g, ".");
    // Devolver undefined si está vacío después de limpiar, para que no se guarde NaN
    if (cleanedInput.trim() === "") return undefined;
    const result = parseFloat(cleanedInput);
    return isNaN(result) ? undefined : result; // Devolver undefined si no es un número válido
}

/**
 * Definición de las columnas esperadas en el archivo CSV.
 */
export const csvColumns: ColumnOptions[] = [
    { name: "number", required: true },
    { name: "providerNumber", required: true },
    { name: "date", required: true, isDate: true },
    { name: "activity", required: true },
    { name: "concept", required: true },
    { name: "nif", required: false },
    { name: "expense", parse: convertFloat, required: true }, // Total factura
    { name: "grantExpense", parse: convertFloat, required: false, discardEmpty: true } // Gasto justificable
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

    // Leer y limpiar los nombres de la cabecera REAL del archivo
    const headerNames = lines[0].split(';').map(h => h.trim().replace(/^"|"$/g, ''));

    // Validar si el número de columnas en la cabecera coincide con lo esperado
    if (headerNames.length !== csvColumns.length) {
        return {
            data,
            errors: [{ line: 1, message: `Número de columnas en cabecera (${headerNames.length}) no coincide con lo esperado (${csvColumns.length}).` }],
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
                else if (line[j + 1] === ';' || j + 1 === line.length) { inQuotes = false; continue; } // Fin de campo entrecomillado, cambiado delimitador a ;
                else { currentField += char; } // Quote inside field (technically invalid CSV, but try to handle)
            } else if (char === ';' && !inQuotes) {
                values.push(currentField.trim()); currentField = '';
            } else {
                currentField += char;
            }
        }
        values.push(currentField.trim());

        if (values.length !== csvColumns.length) {
            // Usar los nombres de cabecera en el mensaje si están disponibles
            const expectedCols = headerNames.join(', ');
            errors.push({ line: i + 1, message: `Número columnas incorrecto (${values.length} encontrado, ${csvColumns.length} esperado: ${expectedCols}).` });
            continue;
        }

        const factura: Partial<Factura> = {};
        let validRow = true;
        let rawDateValue = '';

        for (let k = 0; k < csvColumns.length; k++) {
            const column = csvColumns[k];
            const rawValue = values[k];
            // Obtener el nombre de la cabecera para usar en errores
            const headerName = headerNames[k] || column.name; // Usar nombre interno como fallback

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

            if (column.isDate) rawDateValue = rawValue;

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

        // Si hubo errores de parseo o tipo en las columnas, saltar validación de fecha y final
        if (!validRow) continue;

        // Validar fecha (solo si la fila era válida hasta ahora)
        if (rawDateValue) {
            try {
                let formattedDate = rawDateValue;
                // Añadir cero inicial si falta para días < 10
                if (formattedDate.match(/^\d\//)) formattedDate = `0${formattedDate}`;
                // Añadir cero inicial si falta para meses < 10 (después del /)
                if (formattedDate.match(/^\d{2}\/\d\//)) {
                    const parts = formattedDate.split('/');
                    formattedDate = `${parts[0]}/0${parts[1]}/${parts[2]}`;
                }

                const invoiceDate = parse(formattedDate, 'dd/MM/yyyy', new Date());
                if (!isValid(invoiceDate)) throw new Error(`Formato inválido.`);

                const invoiceTimestamp = getTime(invoiceDate);
                if (invoiceTimestamp < startDateTimestamp || invoiceTimestamp > endDateTimestamp) {
                    throw new Error(`Fuera rango (${configStartDateString} - ${configEndDateString}).`);
                }
                factura.date = formattedDate;
            } catch (dateError: unknown) {
                const dateHeaderName = headerNames[csvColumns.findIndex(c => c.isDate)] || 'date';
                errors.push({ line: i + 1, message: `Error en columna '${dateHeaderName}' (valor: '${rawDateValue}') - ${(dateError instanceof Error) ? dateError.message : 'Inválida'}` });
                validRow = false;
            }
        } else if (csvColumns.find(c => c.isDate)?.required) {
            const dateHeaderName = headerNames[csvColumns.findIndex(c => c.isDate)] || 'date';
            errors.push({ line: i + 1, message: `Falta valor requerido en columna '${dateHeaderName}'.` });
            validRow = false;
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