import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSymbol } from '../../utils/symbol'
import { Context, getContext } from '../../utils/context'
import { executeCommand } from '../../utils/vscode'
import { DocumentSymbol, Range, Position } from '../stubs/vscode'

vi.mock('../../utils/context', () => ({
  getContext: vi.fn(),
}))
vi.mock('../../utils/vscode', () => ({
  executeCommand: vi.fn(),
}))

describe('utils/symbol', () => {
  describe('getSymbol', () => {
    const sut = getSymbol

    beforeEach(() => {
      vi.resetAllMocks()
    })

    it('should return undefined if no symbols found', async () => {
      vi.mocked(getContext).mockImplementationOnce(
        () =>
          ({
            editor: { selection: { active: {} } },
            document: { uri: 'file:///test.ts' },
            folder: {},
          }) as unknown as Context
      )
      vi.mocked(executeCommand).mockResolvedValueOnce([])

      const result = await sut()
      expect(result).toBeUndefined()
    })

    it('should return symbol path when symbol is found', async () => {
      // Create a realistic cursor position
      const cursorPosition = new Position(5, 10)

      // Create realistic document URI
      const documentUri = { scheme: 'file', path: '/test/example.ts' }

      // Mock context with realistic editor and document
      vi.mocked(getContext).mockImplementationOnce(
        () =>
          ({
            editor: {
              selection: {
                active: cursorPosition,
              },
            },
            document: {
              uri: documentUri,
            },
            folder: { uri: { scheme: 'file', path: '/test' } },
          }) as unknown as Context
      )

      // Create realistic document symbols hierarchy
      const classSymbol = new DocumentSymbol(
        'TestClass',
        'Class',
        0, // SymbolKind.Class
        new Range(new Position(2, 0), new Position(20, 1)),
        new Range(new Position(2, 6), new Position(2, 15))
      )

      const methodSymbol = new DocumentSymbol(
        'testMethod',
        'Method',
        1, // SymbolKind.Method
        new Range(new Position(4, 2), new Position(6, 3)),
        new Range(new Position(4, 2), new Position(4, 12))
      )

      // Add method as child of class
      classSymbol.children = [methodSymbol]

      // Mock executeCommand to return our symbols
      vi.mocked(executeCommand).mockImplementation(async (command, ...args) => {
        if (
          command === 'vscode.executeDocumentSymbolProvider' &&
          args[0] === documentUri
        ) {
          return [classSymbol]
        }
        return []
      })

      const result = await sut()
      expect(result).toBe('TestClass.testMethod')
    })

    it('should return symbol name when symbol has no parent', async () => {
      const cursorPosition = new Position(1, 5) // Position within the top-level symbol
      const documentUri = { scheme: 'file', path: '/test/no-parent.ts' }

      vi.mocked(getContext).mockImplementationOnce(
        () =>
          ({
            editor: {
              selection: {
                active: cursorPosition,
              },
            },
            document: {
              uri: documentUri,
            },
            folder: { uri: { scheme: 'file', path: '/test' } },
          }) as unknown as Context
      )

      const topLevelSymbol = new DocumentSymbol(
        'topLevelFunction',
        'Function',
        2, // SymbolKind.Function
        new Range(new Position(0, 0), new Position(10, 1)), // Cursor (1,5) is within this range
        new Range(new Position(0, 9), new Position(0, 23))
      )

      vi.mocked(executeCommand).mockImplementation(async (command, ...args) => {
        if (
          command === 'vscode.executeDocumentSymbolProvider' &&
          args[0] === documentUri
        ) {
          return [topLevelSymbol]
        }
        return []
      })

      const result = await sut()
      expect(result).toBe('topLevelFunction')
    })
  })
})
