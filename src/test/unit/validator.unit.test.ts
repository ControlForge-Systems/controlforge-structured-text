import * as assert from 'assert';
import {
    validateStructuredText,
    formatValidationMessage,
    isSupportedStructuredTextFile,
    ValidationResult,
    ValidationError
} from '../../validator';

suite('Validator Unit Tests', () => {

    suite('validateStructuredText', () => {
        test('should return no errors for valid code', () => {
            const validCode = `PROGRAM Main
    VAR
        counter : INT := 0;
    END_VAR
    
    counter := counter + 1;
END_PROGRAM`;

            const result = validateStructuredText(validCode);

            assert.strictEqual(result.errorCount, 0);
            assert.strictEqual(result.errors.length, 0);
        });

        test('should detect unmatched opening parentheses', () => {
            const invalidCode = `IF (condition1 AND (condition2`;

            const result = validateStructuredText(invalidCode);

            assert.strictEqual(result.errorCount, 1);
            assert.strictEqual(result.errors[0].type, 'parentheses');
            assert.strictEqual(result.errors[0].line, 1);
            assert.ok(result.errors[0].message.includes('Unmatched parentheses'));
        });

        test('should detect unmatched closing parentheses', () => {
            const invalidCode = `IF condition1 AND condition2)`;

            const result = validateStructuredText(invalidCode);

            assert.strictEqual(result.errorCount, 1);
            assert.strictEqual(result.errors[0].type, 'parentheses');
        });

        test('should detect unclosed single quote strings', () => {
            const invalidCode = `message := 'Hello World`;

            const result = validateStructuredText(invalidCode);

            assert.strictEqual(result.errorCount, 1);
            assert.strictEqual(result.errors[0].type, 'syntax');
            assert.ok(result.errors[0].message.includes('single quote'));
        });

        test('should detect unclosed double quote strings', () => {
            const invalidCode = `message := "Hello World`;

            const result = validateStructuredText(invalidCode);

            assert.strictEqual(result.errorCount, 1);
            assert.strictEqual(result.errors[0].type, 'syntax');
            assert.ok(result.errors[0].message.includes('double quote'));
        });

        test('should handle multiple errors on different lines', () => {
            const invalidCode = `IF (condition1
message := 'unclosed string
another := (unmatched`;

            const result = validateStructuredText(invalidCode);

            assert.strictEqual(result.errorCount, 3);
            assert.strictEqual(result.errors.length, 3);

            // Check that errors are on different lines
            const lines = result.errors.map((e: ValidationError) => e.line);
            assert.ok(lines.includes(1));
            assert.ok(lines.includes(2));
            assert.ok(lines.includes(3));
        });

        test('should handle empty string', () => {
            const result = validateStructuredText('');

            assert.strictEqual(result.errorCount, 0);
            assert.strictEqual(result.errors.length, 0);
        });

        test('should handle string with only whitespace', () => {
            const result = validateStructuredText('   \n\t\n   ');

            assert.strictEqual(result.errorCount, 0);
            assert.strictEqual(result.errors.length, 0);
        });
    });

    suite('formatValidationMessage', () => {
        test('should format message for no errors', () => {
            const result: ValidationResult = { errorCount: 0, errors: [] };

            const message = formatValidationMessage(result);

            assert.strictEqual(message, '✅ No basic syntax errors found!');
        });

        test('should format message for single error', () => {
            const result: ValidationResult = {
                errorCount: 1,
                errors: [{ line: 1, message: 'Test error', type: 'syntax' }]
            };

            const message = formatValidationMessage(result);

            assert.strictEqual(message, '⚠️ Found 1 potential syntax issue.');
        });

        test('should format message for multiple errors', () => {
            const result: ValidationResult = {
                errorCount: 3,
                errors: [
                    { line: 1, message: 'Error 1', type: 'syntax' },
                    { line: 2, message: 'Error 2', type: 'parentheses' },
                    { line: 3, message: 'Error 3', type: 'syntax' }
                ]
            };

            const message = formatValidationMessage(result);

            assert.strictEqual(message, '⚠️ Found 3 potential syntax issues.');
        });
    });

    suite('isSupportedStructuredTextFile', () => {
        test('should return true for .st files', () => {
            assert.strictEqual(isSupportedStructuredTextFile('program.st'), true);
            assert.strictEqual(isSupportedStructuredTextFile('main.ST'), true);
            assert.strictEqual(isSupportedStructuredTextFile('/path/to/file.st'), true);
        });

        test('should return true for .iecst files', () => {
            assert.strictEqual(isSupportedStructuredTextFile('program.iecst'), true);
            assert.strictEqual(isSupportedStructuredTextFile('main.IECST'), true);
            assert.strictEqual(isSupportedStructuredTextFile('/path/to/file.iecst'), true);
        });

        test('should return false for unsupported files', () => {
            assert.strictEqual(isSupportedStructuredTextFile('program.txt'), false);
            assert.strictEqual(isSupportedStructuredTextFile('program.js'), false);
            assert.strictEqual(isSupportedStructuredTextFile('program'), false);
            assert.strictEqual(isSupportedStructuredTextFile(''), false);
        });

        test('should handle files without extensions', () => {
            assert.strictEqual(isSupportedStructuredTextFile('README'), false);
            assert.strictEqual(isSupportedStructuredTextFile('Makefile'), false);
        });
    });
});
