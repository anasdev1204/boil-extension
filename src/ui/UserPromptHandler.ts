import * as vscode from 'vscode';

export type PromptResponse = 'yes' | 'no' | 'acceptAll' | 'timeout';

export class UserPromptHandler {
    private static readonly TIMEOUT_MS = 5000; 

    async promptToSaveCommand(command: string): Promise<PromptResponse> {
        const options: vscode.MessageItem[] = [
            { title: 'Yes', isCloseAffordance: false },
            { title: 'No', isCloseAffordance: false },
            { title: 'Accept All', isCloseAffordance: false }
        ];

        const timeoutPromise = new Promise<PromptResponse>((resolve) => {
            setTimeout(() => resolve('timeout'), UserPromptHandler.TIMEOUT_MS);
        });

        const promptPromise = vscode.window.showInformationMessage(
            `Save command: "${command}"?`,
            ...options
        ).then((selection): PromptResponse => {
            if (!selection) return 'timeout';
            
            switch (selection.title) {
                case 'Yes':
                    return 'yes';
                case 'No':
                    return 'no';
                case 'Accept All':
                    return 'acceptAll';
                default:
                    return 'timeout';
            }
        });

        return Promise.race([promptPromise, timeoutPromise]);
    }
}