import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { PDFDict, PDFDocument, PDFName, PDFNull, PDFRef } from 'pdf-lib';
import { flattenPdfForm, removeInvalidPdfAnnotations } from '../app/utils/pdfUtils.ts';
import { getInvoiceKey, getInvoicePdfFiles, loadPdf, mergePdfFiles } from '../app/utils/fileUtils.ts';
import { parseCsvContent, selectInvoicesForGeneration } from '../app/utils/csvUtils.ts';

const templateUrl = new URL('../public/Anexo III.pdf', import.meta.url);

test('carga un PDF adjunto con el motor importado bajo demanda', async () => {
    const bytes = await readFile(templateUrl);
    const file = new File([bytes], 'factura001.pdf', { type: 'application/pdf' });

    const doc = await loadPdf(file);

    assert.equal(doc.getPageCount(), 1);
    assert.ok(doc.getForm().getFields().length > 0);
});

test('mantiene el mensaje de error al cargar un PDF adjunto inválido', async (t) => {
    t.mock.method(console, 'error', () => {});
    const file = new File(['No es un PDF'], 'factura001.pdf', { type: 'application/pdf' });

    await assert.rejects(loadPdf(file), {
        message: 'No se pudo cargar factura001.pdf. Puede estar corrupto, protegido con contraseña o tener un formato no soportado.'
    });
});

const makePdfFile = async (name: string, pageWidths: number[]) => {
    const doc = await PDFDocument.create();
    for (const width of pageWidths) doc.addPage([width, 400]);
    const bytes = await doc.save();
    return new File([bytes.buffer as ArrayBuffer], name, { type: 'application/pdf' });
};

test('incluye las facturas no justificables elegidas y añade los PDF extra al final', async () => {
    const parsed = parseCsvContent([
        'Nº orden;Nº factura;Fecha;Actividad;Concepto;Total Factura;Gasto Justificable',
        '1;A1;10/10/2025;Ocio;Pan;10;10',
        '2;A2;10/10/2025;Ocio;Leche;20;0',
        '3;A3;10/10/2025;Ocio;Agua;30;'
    ].join('\n'), new Date(2025, 9, 1).getTime(), new Date(2026, 8, 30).getTime(), '01/10/2025', '30/09/2026');
    const found = new Map([
        [getInvoiceKey(parsed.data[2]!), await makePdfFile('factura003.pdf', [303])],
        [getInvoiceKey(parsed.data[0]!), await makePdfFile('factura001.pdf', [101])],
        [getInvoiceKey(parsed.data[1]!), await makePdfFile('factura002.pdf', [202])]
    ]);
    const extras = [await makePdfFile('Documento extra.pdf', [404, 405]), await makePdfFile('Otro documento.pdf', [506])];
    const progress: number[] = [];

    const selected = selectInvoicesForGeneration(parsed.data, true);
    const files = getInvoicePdfFiles(selected, found);
    assert.deepEqual(files.map(file => file.name), ['factura001.pdf', 'factura002.pdf', 'factura003.pdf']);
    const merged = await mergePdfFiles(files, extras, value => progress.push(value));
    const saved = await PDFDocument.load(await merged.doc.save());
    assert.deepEqual(saved.getPages().map(page => page.getWidth()), [101, 202, 303, 404, 405, 506]);
    assert.equal(merged.invoices, 3);
    assert.equal(merged.extras, 2);
    assert.deepEqual(merged.errors, []);
    assert.equal(progress.at(-1), 95);
    assert.ok(progress.every((value, index) => index === 0 || value >= progress[index - 1]!));

    const defaultFiles = getInvoicePdfFiles(selectInvoicesForGeneration(parsed.data), found);
    const defaultMerged = await mergePdfFiles(defaultFiles, []);
    assert.deepEqual(defaultMerged.doc.getPages().map(page => page.getWidth()), [101]);
    assert.equal(defaultMerged.extras, 0);
});

test('omite PDF extra inválidos sin perder los documentos válidos ni cambiar su orden', async (t) => {
    t.mock.method(console, 'error', () => {});
    const merged = await mergePdfFiles([await makePdfFile('factura001.pdf', [101])], [
        new File(['No es un PDF'], 'Corrupto.pdf', { type: 'application/pdf' }),
        await makePdfFile('Válido.pdf', [202, 203])
    ]);
    assert.deepEqual(merged.doc.getPages().map(page => page.getWidth()), [101, 202, 203]);
    assert.equal(merged.invoices, 1);
    assert.equal(merged.extras, 1);
    assert.equal(merged.errors.length, 1);
    assert.match(merged.errors[0]!, /Corrupto.pdf/);
});

test('puede unir PDF extra aunque no se encuentre ninguna factura', async () => {
    const merged = await mergePdfFiles([], [await makePdfFile('Justificante.pdf', [101, 102])]);
    assert.equal(merged.invoices, 0);
    assert.equal(merged.extras, 1);
    assert.equal(merged.doc.getPageCount(), 2);
    assert.deepEqual(merged.errors, []);
});

test('si todos los PDF fallan no informa de documentos incluidos', async (t) => {
    t.mock.method(console, 'error', () => {});
    const merged = await mergePdfFiles([], [new File(['No es un PDF'], 'Corrupto.pdf')]);
    assert.equal(merged.doc.getPageCount(), 0);
    assert.equal(merged.invoices, 0);
    assert.equal(merged.extras, 0);
    assert.equal(merged.errors.length, 1);
});

const assertValidAnnotations = (doc: PDFDocument) => {
    for (const page of doc.getPages()) {
        for (const ref of page.node.Annots()?.asArray() ?? []) {
            const annotation = doc.context.lookup(ref);
            assert.ok(annotation instanceof PDFDict, `Anotación inválida: ${ref}`);
            assert.ok(annotation.get(PDFName.of('Subtype')) instanceof PDFName);
        }
    }
};

test('aplana la plantilla real sin referencias a widgets eliminados', async () => {
    const doc = await PDFDocument.load(await readFile(templateUrl));
    const page = doc.getPage(0);
    const form = doc.getForm();
    const widgetCount = form.getFields().reduce((count, field) => count + field.acroField.getWidgets().length, 0);
    const linkRef = page.node.Annots()!.asArray().find(ref => {
        const annotation = doc.context.lookup(ref);
        return annotation instanceof PDFDict && annotation.get(PDFName.of('Subtype')) === PDFName.of('Link');
    });
    assert.ok(linkRef, 'Debe conservarse el enlace de privacidad de la plantilla');
    form.getTextField('Apellidos y nombre_1').setText('Entidad de prueba');
    form.getCheckBox('Totales.1').check();

    flattenPdfForm(form);

    assert.equal(form.getFields().length, 0);
    assert.deepEqual(page.node.Annots()!.asArray(), [linkRef]);
    assertValidAnnotations(doc);
    const xObjects = page.node.Resources()!.lookup(PDFName.of('XObject'), PDFDict);
    const flattenedWidgets = xObjects.keys().filter(key => key.toString().startsWith('/FlatWidget'));
    assert.equal(flattenedWidgets.length, widgetCount, 'Todas las apariencias deben permanecer como contenido de página');
    assert.equal(removeInvalidPdfAnnotations(doc), 0, 'La limpieza debe ser idempotente');
});

test('copia y guarda cuatro páginas del Anexo sin anotaciones inválidas', async () => {
    const templateBytes = await readFile(templateUrl);
    const result = await PDFDocument.create();

    for (let index = 0; index < 4; index++) {
        const source = await PDFDocument.load(templateBytes);
        const form = source.getForm();
        form.getTextField('Apellidos y nombre_1').setText(`Entidad ${index + 1}`);
        flattenPdfForm(form);
        const [page] = await result.copyPages(source, [0]);
        assert.ok(page);
        result.addPage(page);
    }

    const saved = await PDFDocument.load(await result.save());
    assert.equal(saved.getPageCount(), 4);
    assert.equal(saved.getForm().getFields().length, 0);
    assertValidAnnotations(saved);
    for (const page of saved.getPages()) {
        assert.equal(page.node.Annots()!.size(), 1, 'Solo debe quedar el enlace de privacidad');
    }
});

test('limpia referencias inexistentes y null sin alterar anotaciones válidas ni contenido', async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage();
    page.drawText('Contenido que debe conservarse');
    const contents = page.node.Contents();
    const appearance = doc.context.register(doc.context.flateStream('q Q', {
        Type: 'XObject',
        Subtype: 'Form',
        BBox: [0, 0, 10, 10]
    }));
    const stamp = doc.context.register(doc.context.obj({
        Type: 'Annot',
        Subtype: 'Stamp',
        Rect: [0, 0, 10, 10],
        AP: { N: appearance }
    }));
    const link = doc.context.register(doc.context.obj({
        Type: 'Annot',
        Subtype: 'Link',
        Rect: [10, 10, 20, 20],
        A: { S: 'URI', URI: 'https://example.com' }
    }));
    page.node.set(PDFName.of('Annots'), doc.context.obj([
        PDFNull, stamp, PDFRef.of(999999), link, PDFNull
    ]));

    assert.equal(removeInvalidPdfAnnotations(doc), 3);
    assert.deepEqual(page.node.Annots()!.asArray(), [stamp, link]);
    assert.equal(page.node.Contents(), contents);
    assert.ok(doc.context.lookup(appearance));
    assertValidAnnotations(await PDFDocument.load(await doc.save()));
    assert.equal(removeInvalidPdfAnnotations(doc), 0);
});

test('retira /Annots si no queda ninguna anotación y tolera páginas sin anotaciones', async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage();
    const emptyPage = doc.addPage();
    page.node.set(PDFName.of('Annots'), doc.context.obj([PDFNull, PDFRef.of(999999)]));

    assert.equal(removeInvalidPdfAnnotations(doc), 2);
    assert.equal(page.node.Annots(), undefined);
    assert.equal(emptyPage.node.Annots(), undefined);
    assert.equal(removeInvalidPdfAnnotations(doc), 0);
});
