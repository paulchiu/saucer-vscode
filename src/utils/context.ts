import { getFolder } from './document'
import { Document, Editor, Folder, getActiveEditor } from './vscode'

export type Context = {
  editor: Editor
  document: Document
  folder: Folder
}

export function getContext(): Context {
  const editor = getActiveEditor()

  if (!editor) {
    throw new Error('No active editor')
  }

  const document = editor.document
  const folder = getFolder(document)

  if (!folder) {
    throw new Error('File is not part of a workspace')
  }

  return {
    editor,
    document,
    folder,
  }
}
