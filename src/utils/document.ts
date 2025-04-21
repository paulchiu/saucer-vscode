import { getWorkspaceFolder, Document } from './vscode'

export const getFolder = (d: Document) => getWorkspaceFolder(d.uri)
