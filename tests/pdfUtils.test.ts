import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { PDFDict, PDFDocument, PDFName, PDFNull, PDFRef } from 'pdf-lib';
import { flattenPdfForm, removeInvalidPdfAnnotations } from '../app/utils/pdfUtils.ts';
import { loadPdf } from '../app/utils/fileUtils.ts';

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
