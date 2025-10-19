import * as vscode from 'vscode';
import { CommandTracker } from '@/tracking/CommandTracker';
import { UserPromptHandler } from '@/ui/UserPromptHandler';

/**
 * Attachs to a terminal and keeps listening to 
 * the inputed commands and their execution state.
 */
export class ShellExecutionListener {
    private disposables: vscode.Disposable[] = [];
    private currentTerminal: vscode.Terminal | null = null;
    private promptHandler: UserPromptHandler;
    private autoAcceptAll: boolean = false;

    constructor(private commandTracker: CommandTracker) {
        this.promptHandler = new UserPromptHandler();
    }

    attachToTerminal(terminal: vscode.Terminal): void {
        this.currentTerminal = terminal;

        const startListener = vscode.window.onDidStartTerminalShellExecution(
            async (e) => {
                if (e.terminal === this.currentTerminal) {
                    await this.onCommandStart(e);
                }
            }
        );

        const endListener = vscode.window.onDidEndTerminalShellExecution(
            async (e) => {
                if (e.terminal === this.currentTerminal) {
                    await this.onCommandEnd(e);
                }
            }
        );

        this.disposables.push(startListener, endListener);
    }

    private async onCommandStart(
        event: vscode.TerminalShellExecutionStartEvent
    ): Promise<void> {
        const command = event.execution.commandLine.value;
        console.log(`Command started: ${command}`);
        
        this.commandTracker.registerCommandStart(command, event.execution);
    }

    private async onCommandEnd(
        event: vscode.TerminalShellExecutionEndEvent
    ): Promise<void> {
        const execution = event.execution;
        const command = execution.commandLine.value;
        const exitCode = event.exitCode;
        const success = exitCode === 0;

        console.log(`Command ended: ${command} (exit code: ${exitCode})`);

        if (!success) {
            vscode.window.showWarningMessage(
                `Command failed (exit code ${exitCode}). Not recorded.`
            );
            return;
        }

        
        if (this.autoAcceptAll) {
            this.commandTracker.addCommand(command, true);
            return;
        }

        const response = await this.promptHandler.promptToSaveCommand(command);

        switch (response) {
            case 'yes':
                this.commandTracker.addCommand(command, true);
                break;
            case 'acceptAll':
                this.autoAcceptAll = true;
                this.commandTracker.addCommand(command, true);
                vscode.window.showInformationMessage(
                    'Auto-accepting all successful commands'
                );
                break;
            case 'no':
                this.commandTracker.addCommand(command, false);
                break;
            case 'timeout':
                this.commandTracker.addCommand(command, true);
                break;
        }
    }

    onTerminalClosed(): void {
        this.commandTracker.printAndClearHistory();
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}