/**
 * Structured Text syntax validation utilities
 */

export interface ValidationResult {
    errorCount: number;
    errors: ValidationError[];
}

export interface ValidationError {
    line: number;
    message: string;
    type: 'parentheses' | 'syntax' | 'other';
}

/**
 * Validates structured text content for basic syntax errors
 */
export function validateStructuredText(text: string): ValidationResult {
    // Per IEC 61131-3, comments should be ignored. Strip them before validation.
    // Block comments (*...*) can be multi-line, so remove them first.
    const textWithoutBlockComments = text.replace(/\(\*[^]*?\*\)/g, '');
    const lines = textWithoutBlockComments.split('\n');
    const errors: ValidationError[] = [];

    lines.forEach((line, index) => {
        // Now, strip single-line comments //
        const cleanLine = line.replace(/\/\/.*/, '');

        // Check for unmatched parentheses
        const openParens = (cleanLine.match(/\(/g) || []).length;
        const closeParens = (cleanLine.match(/\)/g) || []).length;

        if (openParens !== closeParens) {
            errors.push({
                line: index + 1,
                message: `Unmatched parentheses: ${openParens} open, ${closeParens} close`,
                type: 'parentheses'
            });
        }

        // Check for unclosed string literals
        const singleQuotes = (cleanLine.match(/'/g) || []).length;
        const doubleQuotes = (cleanLine.match(/"/g) || []).length;

        if (singleQuotes % 2 !== 0) {
            errors.push({
                line: index + 1,
                message: 'Unclosed single quote string literal',
                type: 'syntax'
            });
        }

        if (doubleQuotes % 2 !== 0) {
            errors.push({
                line: index + 1,
                message: 'Unclosed double quote string literal',
                type: 'syntax'
            });
        }
    });

    return {
        errorCount: errors.length,
        errors
    };
}

/**
 * Checks if a file extension is a supported Structured Text file
 */
export function isSupportedStructuredTextFile(fileName: string): boolean {
    const supportedExtensions = ['.st', '.iecst'];
    return supportedExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
}

/**
 * Formats validation errors into a human-readable message
 */
export function formatValidationMessage(result: ValidationResult): string {
    if (result.errorCount === 0) {
        return '✅ No basic syntax errors found!';
    }

    if (result.errorCount === 1) {
        return `⚠️ Found 1 potential syntax issue.`;
    }

    return `⚠️ Found ${result.errorCount} potential syntax issues.`;
}
