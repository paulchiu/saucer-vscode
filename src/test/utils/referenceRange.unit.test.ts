import { describe, it, expect } from 'vitest'
import * as referenceRange from '../../utils/referenceRange'
import { Selection } from '../../utils/vscode'

describe('utils/referenceRange', () => {
  describe('fromSelection', () => {
    const sut = referenceRange.fromSelection

    it('should convert cursor position to cursor reference range', () => {
      const mockSelection = {
        isEmpty: true,
        active: { line: 5 },
        start: { line: 5 },
        end: { line: 5 },
      } as Selection

      const result = sut(mockSelection)

      expect(result).toEqual({
        kind: 'cursor',
        line: 6,
      })
    })

    it('should convert non-empty selection to selection reference range', () => {
      const mockSelection = {
        isEmpty: false,
        active: { line: 10 },
        start: { line: 8 },
        end: { line: 12 },
      } as Selection

      const result = sut(mockSelection)

      expect(result).toEqual({
        kind: 'selection',
        startLine: 9,
        endLine: 13,
      })
    })

    it('should handle single-line selection correctly', () => {
      const mockSelection = {
        isEmpty: false,
        active: { line: 3 },
        start: { line: 3 },
        end: { line: 3 },
      } as Selection

      const result = sut(mockSelection)

      expect(result).toEqual({
        kind: 'selection',
        startLine: 4,
        endLine: 4,
      })
    })

    it.each`
      selectionLine | expectedLine
      ${0}          | ${1}
      ${9}          | ${10}
      ${99}         | ${100}
    `(
      'should convert line $selectionLine to 1-indexed line $expectedLine',
      ({ selectionLine, expectedLine }) => {
        const mockSelection = {
          isEmpty: true,
          active: { line: selectionLine },
          start: { line: selectionLine },
          end: { line: selectionLine },
        } as Selection

        const result = sut(mockSelection)

        expect(result.kind).toBe('cursor')
        if (result.kind === 'cursor') {
          expect(result.line).toBe(expectedLine)
        }
      }
    )
  })
})
