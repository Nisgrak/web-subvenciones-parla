export interface Factura {
    number: string;
    providerNumber: string;
    date: string; // Mantenido como string dd/MM/yyyy después de la validación
    activity: string;
    concept: string;
    nif: string;
    income: number | undefined;
    expense: number | undefined;
    total: number | undefined;
    grantExpense: number | undefined; // Usado actualmente para 'projectExpense' en Anexo III
} 