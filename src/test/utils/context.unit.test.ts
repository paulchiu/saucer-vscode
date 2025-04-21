import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getContext } from '../../utils/context'
import * as vscode from '../../utils/vscode'
import * as document from '../../utils/document'
import { Editor, Document, Folder } from '../../utils/vscode'

vi.mock('../../utils/vscode', () => ({
  getActiveEditor: vi.fn(),
}))

vi.mock('../../utils/document', () => ({
  getFolder: vi.fn(),
}))

describe('getContext', () => {
  const sut = getContext
  const mockGetActiveEditor = vi.mocked(vscode.getActiveEditor)
  const mockGetFolder = vi.mocked(document.getFolder)
  let mockEditor: Editor
  let mockDocument: Document
  let mockFolder: Folder

  beforeEach(() => {
    vi.resetAllMocks()

    mockDocument = { uri: { fsPath: '/path/to/file.ts' } } as Document
    mockFolder = { uri: { fsPath: '/path/to' } } as Folder
    mockEditor = { document: mockDocument } as Editor

    mockGetActiveEditor.mockReturnValue(mockEditor)
    mockGetFolder.mockReturnValue(mockFolder)
  })

  it('should return context with editor, document and folder', () => {
    const result = sut()

    expect(mockGetActiveEditor).toHaveBeenCalledTimes(1)
    expect(mockGetFolder).toHaveBeenCalledWith(mockDocument)
    expect(result).toEqual({
      editor: mockEditor,
      document: mockDocument,
      folder: mockFolder,
    })
  })

  it('should throw error when no active editor is available', () => {
    mockGetActiveEditor.mockReturnValue(undefined)

    expect(() => sut()).toThrow('No active editor')
    expect(mockGetActiveEditor).toHaveBeenCalledTimes(1)
    expect(mockGetFolder).not.toHaveBeenCalled()
  })

  it('should throw error when file is not part of a workspace', () => {
    mockGetFolder.mockReturnValue(undefined)

    expect(() => sut()).toThrow('File is not part of a workspace')
    expect(mockGetActiveEditor).toHaveBeenCalledTimes(1)
    expect(mockGetFolder).toHaveBeenCalledWith(mockDocument)
  })
})
