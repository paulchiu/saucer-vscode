import * as vscode from 'vscode'

export type Document = vscode.TextDocument
export type Editor = vscode.TextEditor
export type Selection = vscode.Selection
export type Folder = vscode.WorkspaceFolder
export type Position = vscode.Position
export type DocumentSymbol = vscode.DocumentSymbol

export const showQuickPick = vscode.window.showQuickPick

export const getActiveEditor = () => vscode.window.activeTextEditor

export const showInfo = vscode.window.showInformationMessage

export const showWarn = vscode.window.showWarningMessage

export const showError = vscode.window.showErrorMessage

export const copyToClipboard = vscode.env.clipboard.writeText

export const getWorkspaceFolder = vscode.workspace.getWorkspaceFolder

export const executeCommand = vscode.commands.executeCommand

export const registerCommand = vscode.commands.registerCommand

export const getConfig = () => vscode.workspace.getConfiguration('saucer')
