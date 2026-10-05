import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isValidCif, isValidDniNie } from '../app/utils/idUtils.ts';

test('valida DNI y NIE por su letra de control', () => {
    assert.ok(isValidDniNie('12345678Z'));
    assert.ok(isValidDniNie('12.345.678-z'));
    assert.ok(isValidDniNie('X1234567L'));
    assert.ok(!isValidDniNie('12345678A'));
    assert.ok(!isValidDniNie('1234567Z'));
    assert.ok(!isValidDniNie('X12345678L'));
});

test('valida CIF con dígito o letra de control', () => {
    assert.ok(isValidCif('B83409177'));
    assert.ok(isValidCif('G12345674'));
    assert.ok(isValidCif('G1234567D'));
    assert.ok(isValidCif('g-1234567-4'));
    assert.ok(!isValidCif('G12345678'));
    assert.ok(!isValidCif('12345678Z'));
});
