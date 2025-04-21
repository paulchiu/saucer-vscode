import { Selection } from './vscode'

export type ReferenceRange =
  | { kind: 'cursor'; line: number }
  | { kind: 'selection'; startLine: number; endLine: number }

export function fromSelection(selection: Selection): ReferenceRange {
  if (selection.isEmpty) {
    return {
      kind: 'cursor',
      line: selection.active.line + 1,
    }
  } else {
    return {
      kind: 'selection',
      startLine: selection.start.line + 1,
      endLine: selection.end.line + 1,
    }
  }
}
