/**
 * Alinea los campos de las 13 filas de facturas de `public/Anexo III.pdf` con
 * las líneas impresas de la tabla.
 *
 * La plantilla oficial separa los campos 15,71 pt, pero las filas dibujadas
 * miden 14,73 pt: el texto baja ~1 pt por fila y pisa la línea inferior.
 * El script es idempotente: fija cada rectángulo a partir de las líneas medidas.
 *
 * Uso: pnpm template:anexo
 */
import { readFile, writeFile } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';

const TEMPLATE_PATH = new URL('../public/Anexo III.pdf', import.meta.url);

// Coordenada Y (pt) de cada línea horizontal de la tabla, de arriba abajo, medidas
// sobre la plantilla 2026. La tabla dibuja 14 filas pero solo hay campos para 13:
// la plantilla original los repartía en el alto de las 14 y por eso se descuadraban.
const ROW_LINES = [366.18, 351.42, 336.78, 322.02, 307.26, 292.5, 277.86, 263.1, 248.46, 233.7, 219.06, 204.3, 189.66, 174.9, 160.02];
const MAX_ROWS = 13;
// Separación entre el campo y las líneas de la fila (pt).
const PADDING = 0.8;

// Nombres de los campos de la fila `row` (1-based).
const rowFieldNames = (row: number): string[] => [
    `Nº.${row}`,
    `Proyecto-Actividad.${row}.0`,
    `Concepto-Actividad.${row}`,
    `NIF-Proveedor.${row}`,
    `Nº Factura.0.${row}`,
    `Fecha Factura.${row}`,
    `Fecha Pago.${row}`,
    `Importe Factura.${row}`,
    `Cantidad Justificada.${row}`,
    `Cantidad Válida.${row + 1}`,
];

const doc = await PDFDocument.load(await readFile(TEMPLATE_PATH));
const form = doc.getForm();
let moved = 0;

for (let row = 1; row <= MAX_ROWS; row++) {
    const top = ROW_LINES[row - 1]!;
    const bottom = ROW_LINES[row]!;

    for (const name of rowFieldNames(row)) {
        const field = form.getFieldMaybe(name);
        if (!field) {
            console.warn(`Campo no encontrado: ${name}`);
            continue;
        }
        for (const widget of field.acroField.getWidgets()) {
            const { x, width } = widget.getRectangle();
            widget.setRectangle({ x, width, y: bottom + PADDING, height: top - bottom - 2 * PADDING });
            moved++;
        }
    }
}

// No regenerar apariencias: solo cambian los rectángulos. La web rellena y aplana los campos.
await writeFile(TEMPLATE_PATH, await doc.save({ updateFieldAppearances: false }));
console.log(`Alineados ${moved} campos en ${MAX_ROWS} filas.`);
