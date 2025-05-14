// app.config.ts
export default defineAppConfig({
    // Fechas para validación de facturas (Formato YYYY-MM-DD)
    // Estas fechas son inclusivas.
    invoiceDateRange: {
        startDate: '01/10/2024',
        endDate: '30/09/2025'
    },
    template: {
        maxRows: 13,
        fields: {
            internalNum: (index: number) => `Nº.${index + 1}`,
            proyect: (index: number) => `Proyecto-Actividad.${index + 1}.0`,
            concept: (index: number) => `Concepto-Actividad.${index + 1}`,
            nif: (index: number) => `NIF-Proveedor.${index + 1}`,
            num: (index: number) => `Nº Factura.0.${index + 1}`,
            date: (index: number) => `Fecha Factura.${index + 1}`,
            datePay: (index: number) => `Fecha Pago.${index + 1}`,
            cost: (index: number) => `Importe Factura.${index + 1}`,
            justify: (index: number) => `Cantidad Justificada.${index + 1}`,
            subtotalCheck: "Totales.0",
            totalCheck: "Totales.1",
            totalNum: "Cantidad Justificada.14",
        }
    },
    // Puedes añadir más configuraciones globales aquí
    ui: {
        // Configuraciones específicas de Nuxt UI si las necesitas
    },
    // --- Configuración de la Plantilla PDF (Anexo III) ---
    // !! REVISAR Y AJUSTAR ESTOS NOMBRES SEGÚN EL PDF REAL !!
    pdfTemplate: {
        maxRowsPerPage: 13, // Número máximo de facturas por página
        fields: {
            // Función para generar nombres de campo por fila (índice basado en 0)
            internalNum: (index: number) => `Nº.${index + 1}`,
            proyect: (index: number) => `Proyecto-Actividad.${index + 1}.0`,
            concept: (index: number) => `Concepto-Actividad.${index + 1}`,
            num: (index: number) => `Nº Factura.0.${index + 1}`,
            nif: (index: number) => `NIF-Proveedor.${index + 1}`,
            date: (index: number) => `Fecha Factura.${index + 1}`,
            datePay: (index: number) => `Fecha Pago.${index + 1}`, // Ojo: No existe en Factura, usar date?
            cost: (index: number) => `Importe Factura.${index + 1}`,
            justify: (index: number) => `Cantidad Justificada.${index + 1}`,
            // Campos de totales y checkboxes
            subtotalCheck: 'Totales.0', // Nombre del checkbox de subtotal
            totalCheck: 'Totales.1',       // Nombre del checkbox de total
            subtotalNum: 'Cantidad Justificada.14',  // Nombre del campo de texto para subtotal
            totalNum: 'Cantidad Justificada.15',        // Nombre del campo de texto para total general
            // Campos fijos
            entityName: 'Apellidos y nombre_1',
            entityNif: 'DNINIFNIE_1',
            deputyName: 'Apellidos y nombre_2',
            deputyNif: 'DNINIFNIE_2',
            day: 'Día',
            month: 'Mes',
            year: 'Año',

        }
    }
}) 