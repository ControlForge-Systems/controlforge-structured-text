/**
 * Shared extension path accessor.
 * Extracted from server.ts to avoid importing the LSP connection in non-server contexts (e.g. tests).
 */

let extensionPath: string | undefined;

export function getExtensionPath(): string | undefined {
    return extensionPath;
}

export function setExtensionPath(path: string | undefined): void {
    extensionPath = path;
}
