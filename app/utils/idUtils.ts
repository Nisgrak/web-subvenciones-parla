const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';
const CIF_CONTROL_LETTERS = 'JABCDEFGHI';

/**
 * Quita espacios, puntos y guiones y pasa a mayúsculas ("g-1234567.4" -> "G12345674").
 */
export const normalizeId = (value: string): string => value.toUpperCase().replace(/[\s.-]/g, '');

/**
 * Comprueba la letra de control de un DNI (12345678Z) o NIE (X1234567L).
 */
export function isValidDniNie(value: string): boolean {
    const match = /^([XYZ]?)(\d{7,8})([A-Z])$/.exec(normalizeId(value));
    if (!match) return false;

    const [, prefix = '', digits = '', letter] = match;
    if (digits.length !== (prefix ? 7 : 8)) return false;

    const number = Number(`${prefix ? 'XYZ'.indexOf(prefix) : ''}${digits}`);
    return DNI_LETTERS[number % 23] === letter;
}

/**
 * Comprueba el dígito o letra de control de un CIF (G12345674).
 */
export function isValidCif(value: string): boolean {
    const match = /^([ABCDEFGHJNPQRSUVW])(\d{7})([0-9A-J])$/.exec(normalizeId(value));
    if (!match) return false;

    const [, , digits = '', control] = match;
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
        let n = Number(digits[i]);
        // Las posiciones impares (1ª, 3ª, 5ª, 7ª) se multiplican por 2 y se suman sus cifras
        if (i % 2 === 0) {
            n *= 2;
            n = Math.floor(n / 10) + (n % 10);
        }
        sum += n;
    }

    const controlDigit = (10 - (sum % 10)) % 10;
    return control === String(controlDigit) || control === CIF_CONTROL_LETTERS[controlDigit];
}
