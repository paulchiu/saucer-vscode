import { Position, DocumentSymbol, executeCommand } from './vscode'
import { getContext } from './context'

function findSymbolAtPosition(
  symbols: DocumentSymbol[] | undefined,
  position: Position
): DocumentSymbol | undefined {
  if (!symbols) {
    return undefined
  }

  for (const symbol of symbols) {
    if (symbol.range.contains(position)) {
      const childSymbol = symbol.children?.length
        ? findSymbolAtPosition(symbol.children, position)
        : undefined

      return childSymbol ?? symbol
    }
  }
  return undefined
}

function getSymbolPath(
  symbol: DocumentSymbol,
  allSymbols: DocumentSymbol[] | undefined,
  path: string = ''
): string {
  if (!symbol) {
    return path
  }

  const currentPath = path ? `${symbol.name}.${path}` : symbol.name
  const parent = findParentSymbol(symbol, allSymbols)

  return parent ? getSymbolPath(parent, allSymbols, currentPath) : currentPath
}

function findParentSymbol(
  childSymbol: DocumentSymbol,
  symbols: DocumentSymbol[] | undefined
): DocumentSymbol | null {
  if (!symbols) {
    return null
  }

  for (const symbol of symbols) {
    if (symbol.children?.some(s => s === childSymbol)) {
      return symbol
    }

    if (symbol.children?.length) {
      const parent = findParentSymbol(childSymbol, symbol.children)
      if (parent) {
        return parent
      }
    }
  }
  return null
}

export async function getSymbol(): Promise<string | undefined> {
  const { document, editor } = getContext()
  const tsSymbols = await executeCommand<DocumentSymbol[]>(
    'vscode.executeDocumentSymbolProvider',
    document.uri
  )
  const symbolAtCursor = findSymbolAtPosition(
    tsSymbols,
    editor.selection.active
  )
  const symbolPath = symbolAtCursor
    ? getSymbolPath(symbolAtCursor, tsSymbols)
    : undefined

  return symbolPath
}
