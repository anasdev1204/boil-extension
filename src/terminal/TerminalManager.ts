import * as vscode from 'vscode';
import { CommandTracker } from '@/tracking/CommandTracker';
import { TrackedTerminal } from '@/terminal/TrackedTerminal';

/** 
 * Manages a single tracked terminal.
 * Handles lifecycle (create, close) and save/discard prompts.
 */
export class TerminalManager {
    private currentTerminal: vscode.Terminal | null = null;
    private trackedTerminal: TrackedTerminal | null = null;
    private closeListener?: vscode.Disposable;

    constructor(
        private context: vscode.ExtensionContext,
        private commandTracker: CommandTracker
    ) {
    }

    createTrackedTerminal(): void {
        if (this.currentTerminal) {
            vscode.window.showWarningMessage('A tracked terminal is already running.');
            this.currentTerminal.show();
            return;
        }

        this.trackedTerminal = new TrackedTerminal(this.commandTracker);
        const terminal = this.trackedTerminal.create();
        this.currentTerminal = terminal;

        terminal.show();

        this.closeListener = vscode.window.onDidCloseTerminal(async (closed) => {
            if (closed === this.currentTerminal) {
                this.currentTerminal = null;
                this.trackedTerminal = null;

                const choice = await vscode.window.showInformationMessage(
                    'Save this recording before closing?',
                    'Save',
                    'Discard'
                );
                if (choice === 'Save') {
                    await this.commandTracker.saveCurrentRecording();
                } else if (choice === 'Discard') {
                    this.commandTracker.discardCurrentRecording();
                }
                this.commandTracker.onTerminalClose.fire();
                this.closeListener?.dispose();
            }
        });

        const config = vscode.workspace.getConfiguration('terminal');
        const shellPath = this.getShellPath(config);
        this.printWelcomeMessage(terminal, shellPath);

        setTimeout(() => {
            this.trackedTerminal?.attach();
        }, 1000);
    }

    closeTrackedTerminal(): void {
        if (this.currentTerminal) {
            try {
                this.currentTerminal.dispose();
            } catch (err) {
                vscode.window.showErrorMessage(`Failed to close terminal: ${err}`);
            }
        } else {
            vscode.window.showInformationMessage('No tracked terminal to close.');
        }
    }

    private printWelcomeMessage(terminal: vscode.Terminal, shellPath: string) {
        if (shellPath.includes('powershell') || shellPath.includes('pwsh')) {
            terminal.sendText('Write-Host $env:WELCOME_MESSAGE -ForegroundColor Cyan');
        } else if (process.platform === 'win32') {
            terminal.sendText('echo %WELCOME_MESSAGE%');
        } else {
            terminal.sendText('echo "$WELCOME_MESSAGE"');
        }
    }

    private getShellPath(config: vscode.WorkspaceConfiguration): string {
        const platform = process.platform;
        if (platform === 'win32') {
            return config.get('integrated.shell.windows', '').toLowerCase();
        } else if (platform === 'darwin') {
            return config.get('integrated.shell.osx', '').toLowerCase();
        } else {
            return config.get('integrated.shell.linux', '').toLowerCase();
        }
    }
}
