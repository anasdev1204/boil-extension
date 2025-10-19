import * as vscode from 'vscode';
import { TerminalManager } from '@/terminal/TerminalManager';
import { CommandTracker } from '@/tracking/CommandTracker';

export function activate(context: vscode.ExtensionContext) {
    console.log('Terminal Tracker extension is now active!');

    const commandTracker = new CommandTracker(context);
    const terminalManager = new TerminalManager(context, commandTracker);

    const openTrackedTerminal = vscode.commands.registerCommand(
        'boil-extension.openTrackedTerminal',
        () => terminalManager.createTrackedTerminal()
    );

    const viewHistory = vscode.commands.registerCommand(
        'boil-extension.viewHistory',
        () => commandTracker.showHistory()
    );

    context.subscriptions.push(openTrackedTerminal, viewHistory);
}

export function deactivate() {
	console.log("Extension deactivated succesfully")
}
