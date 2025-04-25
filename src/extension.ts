import * as vscode from 'vscode'
import { registerCommand } from './utils/vscode'
import { copy } from './commands/copy'

export function activate(context: vscode.ExtensionContext): void {
  let copyReferenceDisposable = registerCommand('saucer.copy', async () => {
    await copy()
  })

  context.subscriptions.push(copyReferenceDisposable)
}

export function deactivate(): void {}
