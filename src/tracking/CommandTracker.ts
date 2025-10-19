import * as vscode from 'vscode';

interface CommandRecord {
    command: string;
    timestamp: Date;
    saved: boolean;
}

/**
 * Keeps track of the commands and keeps a history of them
 */
export class CommandTracker {
    private commands: CommandRecord[] = [];
    private pendingExecutions: Map<
        vscode.TerminalShellExecution,
        string
    > = new Map();

    constructor(private context: vscode.ExtensionContext) {}

    registerCommandStart(
        command: string,
        execution: vscode.TerminalShellExecution
    ): void {
        this.pendingExecutions.set(execution, command);
    }

    addCommand(command: string, saved: boolean): void {
        const record: CommandRecord = {
            command,
            timestamp: new Date(),
            saved
        };

        this.commands.push(record);
        console.log(`Command ${saved ? 'saved' : 'skipped'}: ${command}`);
    }

    getSavedCommands(): CommandRecord[] {
        return this.commands.filter(c => c.saved);
    }

    getAllCommands(): CommandRecord[] {
        return [...this.commands];
    }

    printAndClearHistory(): void {
        const savedCommands = this.getSavedCommands();

        if (savedCommands.length === 0) {
            console.log('No commands were saved.');
            vscode.window.showInformationMessage(
                'Terminal closed. No commands were saved.'
            );
            return;
        }

        console.log('\n========================================');
        console.log('SAVED COMMAND HISTORY');
        console.log('========================================');
        
        savedCommands.forEach((record, index) => {
            const timeStr = record.timestamp.toLocaleTimeString();
            console.log(`${index + 1}. [${timeStr}] ${record.command}`);
        });
        
        console.log('========================================\n');

        vscode.window.showInformationMessage(
            `Process successful! ${savedCommands.length} command(s) saved.`
        );

        this.commands = [];
    }

    showHistory(): void {
        const savedCommands = this.getSavedCommands();

        if (savedCommands.length === 0) {
            vscode.window.showInformationMessage('No commands in history.');
            return;
        }

        const items = savedCommands.map((record, index) => ({
            label: record.command,
            description: record.timestamp.toLocaleString(),
            detail: `Command #${index + 1}`
        }));

        vscode.window.showQuickPick(items, {
            placeHolder: 'Command History',
            title: 'Saved Commands'
        });
    }
}