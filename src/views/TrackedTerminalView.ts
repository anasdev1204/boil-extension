import * as vscode from 'vscode';
import { CommandTracker } from '@/tracking/CommandTracker';
import { getNonce } from '@/utils';

export class TerminalTrackerView implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;

    constructor(private readonly context: vscode.ExtensionContext, private readonly commandTracker: CommandTracker) {}

    resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
        };

        webviewView.webview.html = this.getHtml();

        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'startRecording':
                    vscode.commands.executeCommand('boil-extension.openTrackedTerminal');
                    break;
                case 'stopRecording':
                    vscode.commands.executeCommand('boil-extension.closeTrackedTerminal');
                    break;
            }
        });
        
        this.commandTracker.onDidUpdate(() => {
            this.updateView();
        });

        this.commandTracker.onTerminalClose.event(() => {
            this.stopRecording();
        });

        this.initView();
    }

    private initView() {
        if (this._view) {
            const saved = this.commandTracker.getSaved();
            console.log("Saved", saved);
            this._view.webview.postMessage({
                type: 'stop',
                data: saved
            });
        }
    }

    private updateView() {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'update',
                data: this.commandTracker.getHistory(),
            });
        }
    }

    private stopRecording() {
        console.log("Recording stopping");
        if (this._view) {
            console.log(this.commandTracker.getSaved());
            this._view.webview.postMessage({
                type: 'stop',
                data: this.commandTracker.getSaved(),
            });
        }
    }

    private getHtml(): string {
        const nonce = getNonce();

        return /* html */`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        background-color: var(--vscode-sideBar-background);
                        color: var(--vscode-foreground);
                        margin: 0;
                        padding: 0;
                        display: flex;
                        flex-direction: column;
                        height: 100vh;
                    }
                    header {
                        padding: 10px;
                        border-bottom: 1px solid var(--vscode-panel-border);
                    }
                    button {
                        width: 100%;
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        border-radius: 4px;
                        padding: 8px;
                        margin: 0px;
                        font-size: 13px;
                        cursor: pointer;
                    }
                    button:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                    #recordings {
                        flex: 1;
                        overflow-y: auto;
                        padding: 10px;
                    }
                    .record-item {
                        background: var(--vscode-list-hoverBackground);
                        padding: 6px;
                        margin-bottom: 6px;
                        border-radius: 4px;
                        font-size: 12px;
                        cursor: pointer;
                    }
                    .placeholder {
                        opacity: 0.6;
                        font-style: italic;
                        padding: 20px;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div style="display: flex; flex-direction: column; width: 100%;">
                    <p style="
                        margin: 0;
                        padding: 10px;
                        font-size: 12px;
                        color: var(--vscode-foreground);
                        line-height: 1.4;
                    ">
                        Record your boilerplate with a tracked terminal and workspace watcher.
                    </p>
                    <header>
                        <button id="recordBtn" style="width: 100%;">Record boilerplate</button>
                    </header>
                </div>
                <div id="recordings" class="placeholder">No saved recordings yet.</div>

                <script nonce="${nonce}">
                    const vscode = acquireVsCodeApi();
                    const button = document.getElementById('recordBtn');
                    const container = document.getElementById('recordings');
                    let recording = false;

                    button.addEventListener('click', () => {
                        if (!recording) {
                            recording = true;
                            button.textContent = 'Stop recording';
                            container.innerHTML = '<div class="placeholder">Recording in progress...</div>';
                            vscode.postMessage({ command: 'startRecording' });
                        } else {
                            recording = false;
                            button.textContent = 'Record boilerplate';
                            vscode.postMessage({ command: 'stopRecording' });
                        }
                    });

                    window.addEventListener('message', (event) => {
                        const { type, data } = event.data;
                        if (type === 'update') {
                            if (data.length !== 0) {
                                container.innerHTML = data.map(item =>
                                    \`<div class=\"record-item\">\${item.label}</div>\`
                                ).join('');
                            }
                        } else if (type === 'stop') {
                            button.textContent = 'Record boilerplate';
                            container.innerHTML = data.map(item =>
                                \`<div class=\"record-item\">\${item.name}</div>\`
                            ).join('');
                        }
                    });
                </script>
            </body>
            </html>
        `;
    }

}
