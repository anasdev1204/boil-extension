import * as vscode from 'vscode';

interface CommandRecord {
    command: string;
    timestamp: Date;
    saved: boolean;
}

type History = {
    label: string;
    description: string;
    detail: string;
}

/**
 * Keeps track of the commands and keeps a history of them
 */
export class CommandTracker {
    private commands: CommandRecord[] = [];
    private saved: { name: string; commands: CommandRecord[] }[] = [];
    private pendingExecutions: Map<
        vscode.TerminalShellExecution,
        string
    > = new Map();

    private _onDidUpdate = new vscode.EventEmitter<void>();
    public readonly onDidUpdate = this._onDidUpdate.event;

    public onTerminalClose = new vscode.EventEmitter<void>();

    constructor(private context: vscode.ExtensionContext) {
        this.saved = context.globalState.get('savedRecordings', []);
    }

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
        this._onDidUpdate.fire();
        console.log(`Command ${saved ? 'saved' : 'skipped'}: ${command}`);
    }

    getSavedCommands(): CommandRecord[] {
        return this.commands.filter(c => c.saved);
    }

    getAllCommands(): CommandRecord[] {
        return [...this.commands];
    }

    getHistory(): History[] {
        const savedCommands = this.getSavedCommands();

        if (savedCommands.length === 0) {
            vscode.window.showInformationMessage('No commands in history.');
            return [];
        }

        return savedCommands.map((record, index) => ({
            label: record.command,
            description: record.timestamp.toLocaleString(),
            detail: `Command #${index + 1}`
        }));
    }

    getSaved() {
        return this.saved;
    }

    showHistory(): void {
        const history = this.getHistory();

        vscode.window.showQuickPick(history, {
            placeHolder: 'Command History',
            title: 'Saved Commands'
        });
    }

    async saveCurrentRecording() {
        if (this.commands.length === 0) {
            vscode.window.showInformationMessage('No commands to save.');
            return;
        }
        const name = await vscode.window.showInputBox({ prompt: 'Enter a name for this recording' });
        if (!name) {
            return;
        };

        this.saved.push({ name, commands: [...this.commands] });
        this.commands = [];
        await this.context.globalState.update('savedRecordings', this.saved);
        vscode.window.showInformationMessage(`Saved "${name}"`);
    }

    discardCurrentRecording() {
        this.commands = [];
        vscode.window.showInformationMessage('Recoreded commands discarded.');
        this._onDidUpdate.fire();
    }
}