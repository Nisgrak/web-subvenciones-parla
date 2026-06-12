export interface Factura {
    number: string;
    providerNumber: string;
    date: string; // Mantenido como string dd/MM/yyyy después de la validación
    datePay?: string; // Opcional: fecha de pago en formato dd/MM/yyyy
    activity: string;
    concept: string;
    income: number | undefined;
    expense: number | undefined;
    total: number | undefined;
    grantExpense: number | undefined; // Usado actualmente para 'projectExpense' en Anexo III
} 