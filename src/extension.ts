import * as vscode from 'vscode';
import { TerminalManager } from '@/terminal/TerminalManager';
import { CommandTracker } from '@/tracking/CommandTracker';
import { TerminalTrackerView } from './views/TrackedTerminalView';

export function activate(context: vscode.ExtensionContext) {
    console.log('Terminal Tracker extension is now active!');

    const commandTracker = new CommandTracker(context);
    const terminalManager = new TerminalManager(context, commandTracker);

    const openTrackedTerminal = vscode.commands.registerCommand(
        'boil-extension.openTrackedTerminal',
        () => terminalManager.createTrackedTerminal()
    );

    const closeTrackedTerminal = vscode.commands.registerCommand(
        'boil-extension.closeTrackedTerminal',
        () => terminalManager.closeTrackedTerminal()
    );

    const viewHistory = vscode.commands.registerCommand(
        'boil-extension.viewHistory',
        () => commandTracker.showHistory()
    );

    const trackerViewProvider = new TerminalTrackerView(context, commandTracker);
    const trackerView = vscode.window.registerWebviewViewProvider("boilView", trackerViewProvider, {
        webviewOptions: {
            retainContextWhenHidden: true
        }
    });

    context.subscriptions.push(openTrackedTerminal, closeTrackedTerminal, viewHistory, trackerView);
}

export function deactivate() {
	console.log("Extension deactivated succesfully");
}
