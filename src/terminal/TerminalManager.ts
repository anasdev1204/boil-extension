import * as vscode from 'vscode';
import { CommandTracker } from '@/tracking/CommandTracker';
import { TrackedTerminal } from '@/terminal/TrackedTerminal';

/** 
 * Class to manage terminals. It creates new terminals
 * and keeps track of their state (open or closed).
*/
export class TerminalManager {
    private trackedTerminals: Map<vscode.Terminal, TrackedTerminal> = new Map();
    
    constructor(
        private context: vscode.ExtensionContext,
        private commandTracker: CommandTracker
    ) {
        this.setupTerminalListeners();
    }

    createTrackedTerminal(): void {
        const trackedTerminal = new TrackedTerminal(this.commandTracker);
        const terminal = trackedTerminal.create();
        
        terminal.show();
        
        const config = vscode.workspace.getConfiguration('terminal');
        const shellPath = this.getShellPath(config);
        this.printWelcomeMessage(terminal, shellPath);
        
        setTimeout(() => {
            trackedTerminal.attach();
        }, 1000);
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

    private setupTerminalListeners(): void {
        vscode.window.onDidCloseTerminal((terminal) => {
            const trackedTerminal = this.trackedTerminals.get(terminal);
            
            if (trackedTerminal) {
                trackedTerminal.onTerminalClosed();
                this.trackedTerminals.delete(terminal);
            }
        });
    }
}