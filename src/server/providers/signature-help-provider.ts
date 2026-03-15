import * as fs from 'fs';
import * as path from 'path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import {
    ParameterInformation,
    Position,
    SignatureHelp,
    SignatureInformation
} from 'vscode-languageserver';
import { STParameter, STSymbolKind } from '../../shared/types';
import { WorkspaceIndexer } from '../workspace-indexer';
import { getExtensionPath } from '../extension-path';

interface ParameterDefinition {
    name: string;
    dataType: string;
    direction: 'INPUT' | 'OUTPUT' | 'IN_OUT' | 'VAR_INPUT' | 'VAR_OUTPUT' | 'VAR_IN_OUT';
    description?: string;
}

interface SignatureDefinition {
    name: string;
    label: string;
    documentation?: string;
    parameters: ParameterDefinition[];
}

interface CallContext {
    calleeName: string;
    activeParameter: number;
}

const STANDARD_FUNCTION_SIGNATURES: Map<string, SignatureDefinition> = new Map([
    ['ABS', { name: 'ABS', label: 'ABS(IN: ANY_NUM): ANY_NUM', documentation: 'Absolute value of IN.', parameters: [{ name: 'IN', dataType: 'ANY_NUM', direction: 'INPUT', description: 'Input value' }] }],
    ['SQRT', { name: 'SQRT', label: 'SQRT(IN: ANY_REAL): ANY_REAL', documentation: 'Square root of IN.', parameters: [{ name: 'IN', dataType: 'ANY_REAL', direction: 'INPUT', description: 'Input value' }] }],
    ['LN', { name: 'LN', label: 'LN(IN: ANY_REAL): ANY_REAL', documentation: 'Natural logarithm of IN.', parameters: [{ name: 'IN', dataType: 'ANY_REAL', direction: 'INPUT', description: 'Input value' }] }],
    ['LOG', { name: 'LOG', label: 'LOG(IN: ANY_REAL): ANY_REAL', documentation: 'Base-10 logarithm of IN.', parameters: [{ name: 'IN', dataType: 'ANY_REAL', direction: 'INPUT', description: 'Input value' }] }],
    ['EXP', { name: 'EXP', label: 'EXP(IN: ANY_REAL): ANY_REAL', documentation: 'e raised to power IN.', parameters: [{ name: 'IN', dataType: 'ANY_REAL', direction: 'INPUT', description: 'Input value' }] }],
    ['SIN', { name: 'SIN', label: 'SIN(IN: ANY_REAL): ANY_REAL', documentation: 'Sine of IN in radians.', parameters: [{ name: 'IN', dataType: 'ANY_REAL', direction: 'INPUT', description: 'Input angle in radians' }] }],
    ['COS', { name: 'COS', label: 'COS(IN: ANY_REAL): ANY_REAL', documentation: 'Cosine of IN in radians.', parameters: [{ name: 'IN', dataType: 'ANY_REAL', direction: 'INPUT', description: 'Input angle in radians' }] }],
    ['TAN', { name: 'TAN', label: 'TAN(IN: ANY_REAL): ANY_REAL', documentation: 'Tangent of IN in radians.', parameters: [{ name: 'IN', dataType: 'ANY_REAL', direction: 'INPUT', description: 'Input angle in radians' }] }],
    ['ASIN', { name: 'ASIN', label: 'ASIN(IN: ANY_REAL): ANY_REAL', documentation: 'Arc-sine of IN.', parameters: [{ name: 'IN', dataType: 'ANY_REAL', direction: 'INPUT', description: 'Input value' }] }],
    ['ACOS', { name: 'ACOS', label: 'ACOS(IN: ANY_REAL): ANY_REAL', documentation: 'Arc-cosine of IN.', parameters: [{ name: 'IN', dataType: 'ANY_REAL', direction: 'INPUT', description: 'Input value' }] }],
    ['ATAN', { name: 'ATAN', label: 'ATAN(IN: ANY_REAL): ANY_REAL', documentation: 'Arc-tangent of IN.', parameters: [{ name: 'IN', dataType: 'ANY_REAL', direction: 'INPUT', description: 'Input value' }] }],
    ['TRUNC', { name: 'TRUNC', label: 'TRUNC(IN: ANY_REAL): ANY_INT', documentation: 'Truncates IN toward zero.', parameters: [{ name: 'IN', dataType: 'ANY_REAL', direction: 'INPUT', description: 'Input value' }] }],
    ['ROUND', { name: 'ROUND', label: 'ROUND(IN: ANY_REAL): ANY_INT', documentation: 'Rounds IN to nearest integer.', parameters: [{ name: 'IN', dataType: 'ANY_REAL', direction: 'INPUT', description: 'Input value' }] }],
    ['CEIL', { name: 'CEIL', label: 'CEIL(IN: ANY_REAL): ANY_INT', documentation: 'Smallest integer >= IN.', parameters: [{ name: 'IN', dataType: 'ANY_REAL', direction: 'INPUT', description: 'Input value' }] }],
    ['FLOOR', { name: 'FLOOR', label: 'FLOOR(IN: ANY_REAL): ANY_INT', documentation: 'Largest integer <= IN.', parameters: [{ name: 'IN', dataType: 'ANY_REAL', direction: 'INPUT', description: 'Input value' }] }],
    ['MIN', {
        name: 'MIN',
        label: 'MIN(IN1: ANY_MAGNITUDE; IN2: ANY_MAGNITUDE): ANY_MAGNITUDE',
        documentation: 'Returns smaller of IN1 and IN2.',
        parameters: [
            { name: 'IN1', dataType: 'ANY_MAGNITUDE', direction: 'INPUT', description: 'First input' },
            { name: 'IN2', dataType: 'ANY_MAGNITUDE', direction: 'INPUT', description: 'Second input' }
        ]
    }],
    ['MAX', {
        name: 'MAX',
        label: 'MAX(IN1: ANY_MAGNITUDE; IN2: ANY_MAGNITUDE): ANY_MAGNITUDE',
        documentation: 'Returns larger of IN1 and IN2.',
        parameters: [
            { name: 'IN1', dataType: 'ANY_MAGNITUDE', direction: 'INPUT', description: 'First input' },
            { name: 'IN2', dataType: 'ANY_MAGNITUDE', direction: 'INPUT', description: 'Second input' }
        ]
    }],
    ['LIMIT', {
        name: 'LIMIT',
        label: 'LIMIT(MN: ANY_MAGNITUDE; IN: ANY_MAGNITUDE; MX: ANY_MAGNITUDE): ANY_MAGNITUDE',
        documentation: 'Clamps IN between MN and MX.',
        parameters: [
            { name: 'MN', dataType: 'ANY_MAGNITUDE', direction: 'INPUT', description: 'Minimum bound' },
            { name: 'IN', dataType: 'ANY_MAGNITUDE', direction: 'INPUT', description: 'Input value' },
            { name: 'MX', dataType: 'ANY_MAGNITUDE', direction: 'INPUT', description: 'Maximum bound' }
        ]
    }],
    ['LEN', { name: 'LEN', label: 'LEN(IN: STRING): INT', documentation: 'Returns string length.', parameters: [{ name: 'IN', dataType: 'STRING', direction: 'INPUT', description: 'Input string' }] }]
]);

export class SignatureHelpProvider {
    private standardFBSignatures: Map<string, SignatureDefinition> = new Map();

    constructor() {
        this.standardFBSignatures = this.loadStandardFBSignatures();
    }

    public provideSignatureHelp(
        document: TextDocument,
        position: Position,
        workspaceIndexer: WorkspaceIndexer
    ): SignatureHelp | null {
        const callContext = this.getCallContext(document, position);
        if (!callContext) {
            return null;
        }

        const signature = this.resolveSignature(callContext.calleeName, workspaceIndexer);
        if (!signature || signature.parameters.length === 0) {
            return null;
        }

        return {
            signatures: [this.toLspSignature(signature)],
            activeSignature: 0,
            activeParameter: Math.min(callContext.activeParameter, signature.parameters.length - 1)
        };
    }

    private resolveSignature(calleeName: string, workspaceIndexer: WorkspaceIndexer): SignatureDefinition | null {
        this.ensureStandardFBSignaturesLoaded();
        const upperName = calleeName.toUpperCase();

        const standardFn = STANDARD_FUNCTION_SIGNATURES.get(upperName);
        if (standardFn) {
            return standardFn;
        }

        const customFunction = this.findCustomFunctionSignature(calleeName, workspaceIndexer);
        if (customFunction) {
            return customFunction;
        }

        const fbType = this.resolveFunctionBlockType(calleeName, workspaceIndexer);
        if (!fbType) {
            return null;
        }

        const standardFB = this.standardFBSignatures.get(fbType.toUpperCase());
        if (standardFB) {
            return standardFB;
        }

        return this.findCustomFunctionBlockSignature(fbType, workspaceIndexer);
    }

    private ensureStandardFBSignaturesLoaded(): void {
        if (this.standardFBSignatures.size > 0) {
            return;
        }
        this.standardFBSignatures = this.loadStandardFBSignatures();
    }

    private resolveFunctionBlockType(calleeName: string, workspaceIndexer: WorkspaceIndexer): string | null {
        const allSymbols = workspaceIndexer.getAllSymbols();
        const normalized = calleeName.toLowerCase();

        const instance = allSymbols.find(symbol =>
            symbol.name.toLowerCase() === normalized &&
            (symbol.kind === STSymbolKind.FunctionBlockInstance || symbol.kind === STSymbolKind.Variable) &&
            !!symbol.dataType
        );
        if (instance?.dataType) {
            return instance.dataType;
        }

        const directFB = allSymbols.find(symbol =>
            symbol.kind === STSymbolKind.FunctionBlock && symbol.name.toLowerCase() === normalized
        );
        if (directFB) {
            return directFB.name;
        }

        return null;
    }

    private findCustomFunctionSignature(calleeName: string, workspaceIndexer: WorkspaceIndexer): SignatureDefinition | null {
        const allSymbols = workspaceIndexer.getAllSymbols();
        const normalized = calleeName.toLowerCase();

        const functionSymbol = allSymbols.find(symbol =>
            symbol.kind === STSymbolKind.Function && symbol.name.toLowerCase() === normalized
        );
        if (!functionSymbol) {
            return null;
        }

        return this.buildSignatureFromParameters(
            functionSymbol.name,
            functionSymbol.parameters ?? [],
            functionSymbol.returnType,
            functionSymbol.description
        );
    }

    private findCustomFunctionBlockSignature(fbType: string, workspaceIndexer: WorkspaceIndexer): SignatureDefinition | null {
        const allSymbols = workspaceIndexer.getAllSymbols();
        const normalized = fbType.toLowerCase();

        const fbSymbol = allSymbols.find(symbol =>
            symbol.kind === STSymbolKind.FunctionBlock && symbol.name.toLowerCase() === normalized
        );
        if (!fbSymbol) {
            return null;
        }

        return this.buildSignatureFromParameters(
            fbSymbol.name,
            (fbSymbol.parameters ?? []).filter(param => param.direction === 'INPUT' || param.direction === 'IN_OUT'),
            undefined,
            fbSymbol.description
        );
    }

    private buildSignatureFromParameters(
        name: string,
        parameters: STParameter[],
        returnType?: string,
        documentation?: string
    ): SignatureDefinition {
        const signatureParameters: ParameterDefinition[] = parameters.map(parameter => ({
            name: parameter.name,
            dataType: parameter.dataType,
            direction: parameter.direction,
            description: parameter.defaultValue ? `Default: ${parameter.defaultValue}` : undefined
        }));

        const paramsLabel = signatureParameters.map(param => `${param.name}: ${param.dataType}`).join('; ');
        const returnSuffix = returnType ? `: ${returnType}` : '';

        return {
            name,
            label: `${name}(${paramsLabel})${returnSuffix}`,
            documentation,
            parameters: signatureParameters
        };
    }

    private toLspSignature(signature: SignatureDefinition): SignatureInformation {
        const parameterInfos: ParameterInformation[] = signature.parameters.map(parameter => {
            const parameterText = `${parameter.name}: ${parameter.dataType}`;
            const start = signature.label.indexOf(parameterText);
            const info: ParameterInformation = start >= 0
                ? { label: [start, start + parameterText.length] as [number, number] }
                : { label: parameterText };

            if (parameter.description) {
                info.documentation = `${parameter.direction}: ${parameter.description}`;
            }

            return info;
        });

        return {
            label: signature.label,
            documentation: signature.documentation,
            parameters: parameterInfos
        };
    }

    private getCallContext(document: TextDocument, position: Position): CallContext | null {
        const text = document.getText();
        const cursorOffset = document.offsetAt(position);

        let depth = 0;
        let commaCount = 0;

        for (let i = cursorOffset - 1; i >= 0; i--) {
            const char = text[i];

            if (char === ')') {
                depth += 1;
                continue;
            }

            if (char === '(') {
                if (depth === 0) {
                    const calleeName = this.extractCalleeName(text, i);
                    if (!calleeName) {
                        return null;
                    }
                    return { calleeName, activeParameter: commaCount };
                }
                depth -= 1;
                continue;
            }

            if (char === ',' && depth === 0) {
                commaCount += 1;
                continue;
            }

            if (char === ';' && depth === 0) {
                return null;
            }
        }

        return null;
    }

    private extractCalleeName(text: string, openParenOffset: number): string | null {
        let end = openParenOffset - 1;
        while (end >= 0 && /\s/.test(text[end])) {
            end--;
        }
        if (end < 0) {
            return null;
        }

        let start = end;
        while (start >= 0 && /[A-Za-z0-9_]/.test(text[start])) {
            start--;
        }

        const calleeName = text.slice(start + 1, end + 1);
        return /^[A-Za-z_][A-Za-z0-9_]*$/.test(calleeName) ? calleeName : null;
    }

    private loadStandardFBSignatures(): Map<string, SignatureDefinition> {
        const signatures = new Map<string, SignatureDefinition>();
        const definitionsDir = this.resolveDefinitionsDir();
        if (!definitionsDir || !fs.existsSync(definitionsDir)) {
            return signatures;
        }

        const files = fs.readdirSync(definitionsDir).filter(name => name.toLowerCase().endsWith('.st'));
        files.forEach(file => {
            const fullPath = path.join(definitionsDir, file);
            const parsed = this.parseFBSignatureFromFile(fullPath);
            if (parsed) {
                signatures.set(parsed.name.toUpperCase(), parsed);
            }
        });

        return signatures;
    }

    private resolveDefinitionsDir(): string | null {
        const extensionPath = getExtensionPath();
        if (extensionPath) {
            return path.join(extensionPath, 'iec61131-definitions');
        }

        return path.join(process.cwd(), 'iec61131-definitions');
    }

    private parseFBSignatureFromFile(filePath: string): SignatureDefinition | null {
        let content: string;
        try {
            content = fs.readFileSync(filePath, 'utf8');
        } catch {
            return null;
        }

        const lines = content.split(/\r?\n/);
        const name = this.parseFunctionBlockName(lines);
        if (!name) {
            return null;
        }

        const parameters = this.parseInputParameters(lines);
        if (parameters.length === 0) {
            return null;
        }

        const paramsLabel = parameters.map(param => `${param.name}: ${param.dataType}`).join('; ');
        return {
            name,
            label: `${name}(${paramsLabel})`,
            documentation: 'Standard IEC 61131-3 Function Block',
            parameters
        };
    }

    private parseFunctionBlockName(lines: string[]): string | null {
        for (const line of lines) {
            const match = line.match(/^\s*FUNCTION_BLOCK\s+([A-Za-z_][A-Za-z0-9_]*)\s*$/i);
            if (match) {
                return match[1];
            }
        }
        return null;
    }

    private parseInputParameters(lines: string[]): ParameterDefinition[] {
        const parameters: ParameterDefinition[] = [];
        let inInputSection = false;

        for (const line of lines) {
            const trimmed = line.trim();

            if (!inInputSection) {
                if (/^VAR_INPUT\b/i.test(trimmed) || /^VAR_IN_OUT\b/i.test(trimmed)) {
                    inInputSection = true;
                }
                continue;
            }

            if (/^END_VAR\b/i.test(trimmed)) {
                inInputSection = false;
                continue;
            }

            const variableMatch = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([^;]+);\s*(?:\/\/\s*(.*))?$/);
            if (!variableMatch) {
                continue;
            }

            parameters.push({
                name: variableMatch[1],
                dataType: variableMatch[2].trim(),
                direction: 'VAR_INPUT',
                description: variableMatch[3]?.trim()
            });
        }

        return parameters;
    }
}
