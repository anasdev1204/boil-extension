import * as vscode from 'vscode';
import { CommandTracker } from '@/tracking/CommandTracker';
import { ShellExecutionListener } from '@/terminal/ShellExecutionListener';
import { terminalWelcomeMessage } from '@/utils';
/** 
 * Tracked extension terminal to keep listening and
 * registering user commands and their execution state. 
 */
export class TrackedTerminal {
    private terminal: vscode.Terminal | null = null;
    private executionListener: ShellExecutionListener;

    constructor(private commandTracker: CommandTracker) {
        this.executionListener = new ShellExecutionListener(commandTracker);
    }

    create(): vscode.Terminal {
        this.terminal = vscode.window.createTerminal({
            iconPath: new vscode.ThemeIcon('coffee'),
            color: new vscode.ThemeColor('terminal.ansiCyan'),
            env: { 
                "WELCOME_MESSAGE": terminalWelcomeMessage 
            }
        });

        return this.terminal;
    }

    attach(): vscode.Terminal | null {
        if (!this.terminal) {
            return null
        }

        this.executionListener.attachToTerminal(this.terminal);
        return this.terminal;
    }

    onTerminalClosed(): void {
        this.executionListener.onTerminalClosed();
    }
}