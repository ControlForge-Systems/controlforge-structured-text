/**
 * Function Block Documentation Handler
 * Provides detailed documentation for function blocks and their members
 */

import * as vscode from 'vscode';
import { getFunctionBlockDescription, getMemberDescription } from './server/providers/enhanced-descriptions';

/**
 * Register function block documentation commands
 */
export function registerFBDocumentationCommands(context: vscode.ExtensionContext) {
    // Command to show function block documentation
    context.subscriptions.push(
        vscode.commands.registerCommand('controlforge-structured-text.showFBDocumentation',
            async (args: { fbType: string }) => {
                if (!args || !args.fbType) return;

                const fbType = args.fbType;
                const content = getFunctionBlockDescription(fbType);

                if (content) {
                    // Create a markdown preview panel
                    const panel = vscode.window.createWebviewPanel(
                        'fbDocumentation',
                        `${fbType} Documentation`,
                        vscode.ViewColumn.Beside,
                        { enableScripts: false }
                    );

                    panel.webview.html = getWebviewContent(fbType, content);
                } else {
                    vscode.window.showInformationMessage(`No detailed documentation available for ${fbType}`);
                }
            }
        )
    );

    // Command to show function block member documentation
    context.subscriptions.push(
        vscode.commands.registerCommand('controlforge-structured-text.showFBMemberDocumentation',
            async (args: { fbType: string, memberName: string }) => {
                if (!args || !args.fbType || !args.memberName) return;

                const fbType = args.fbType;
                const memberName = args.memberName;

                // Try to get specific member description
                let content = getMemberDescription(fbType, memberName);

                if (!content) {
                    // Fallback to generic message
                    content = `# ${memberName}\n\n${memberName} is a member of the ${fbType} function block.\n\nFor details, see the [${fbType} documentation](command:controlforge-structured-text.showFBDocumentation?${encodeURIComponent(JSON.stringify({ fbType }))}).`;
                }

                // Create a markdown preview panel
                const panel = vscode.window.createWebviewPanel(
                    'fbMemberDocumentation',
                    `${fbType}.${memberName} Documentation`,
                    vscode.ViewColumn.Beside,
                    { enableScripts: false }
                );

                panel.webview.html = getWebviewContent(`${fbType}.${memberName}`, content);
            }
        )
    );
}

/**
 * Generate HTML content for the webview
 */
function getWebviewContent(title: string, markdownContent: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} Documentation</title>
    <style>
        body {
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
            color: var(--vscode-editor-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            line-height: 1.6;
        }
        h1 { 
            color: var(--vscode-titleBar-activeForeground);
            border-bottom: 1px solid var(--vscode-widget-shadow);
            padding-bottom: 10px;
        }
        h2 {
            color: var(--vscode-editor-foreground);
            margin-top: 20px;
        }
        pre {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 16px;
            border-radius: 4px;
            overflow: auto;
        }
        code {
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
        }
        .markdown-body {
            max-width: 800px;
            margin: 0 auto;
        }
    </style>
</head>
<body>
    <div class="markdown-body">
        ${markdownToHtml(markdownContent)}
    </div>
</body>
</html>`;
}

/**
 * Convert markdown to HTML (simple version)
 */
function markdownToHtml(markdown: string): string {
    // Simple markdown to HTML conversion
    // For a real extension, consider using a proper markdown library
    let html = markdown
        // Code blocks with language
        .replace(/```(\w+)\n([\s\S]*?)\n```/g, '<pre><code class="language-$1">$2</code></pre>')
        // Code blocks without language
        .replace(/```\n([\s\S]*?)\n```/g, '<pre><code>$1</code></pre>')
        // Headers
        .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
        .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
        .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Inline code
        .replace(/`(.*?)`/g, '<code>$1</code>')
        // Lists
        .replace(/^- (.*?)$/gm, '<li>$1</li>')
        // Line breaks
        .replace(/\n\n/g, '<br /><br />')
        // Horizontal rules
        .replace(/^---$/gm, '<hr />');

    return html;
}
