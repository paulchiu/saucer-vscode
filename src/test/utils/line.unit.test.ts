import { describe, it, expect } from 'vitest'
import {
  toProviderLineFragment,
  toReferenceLineFragment,
} from '../../utils/line'
import { RemoteInfo } from '../../utils/git'
import { Reference } from '../../utils/reference'
import { ReferenceRange } from '../../utils/referenceRange'

describe('utils/line', () => {
  describe('toProviderLineFragment', () => {
    it('returns empty string for unknown provider', () => {
      const remoteInfo = { provider: 'unknown' } satisfies RemoteInfo
      const reference = {
        range: { kind: 'cursor', line: 10 } as ReferenceRange,
      } as Reference

      const result = toProviderLineFragment(remoteInfo, reference)

      expect(result).toBe('')
    })

    describe.each`
      provider       | cursorLine | expectedCursorResult
      ${'github'}    | ${42}      | ${'#L42'}
      ${'gitlab'}    | ${42}      | ${'#L42'}
      ${'bitbucket'} | ${42}      | ${'#lines-42'}
      ${'azure'}     | ${42}      | ${'&line=42&lineEnd=43'}
      ${'generic'}   | ${42}      | ${''}
    `(
      'cursor line formatting for $provider',
      ({ provider, cursorLine, expectedCursorResult }) => {
        it(`formats cursor line ${cursorLine} correctly`, () => {
          const remoteInfo = { provider } satisfies RemoteInfo
          const reference = {
            range: { kind: 'cursor', line: cursorLine },
          } as Reference

          const result = toProviderLineFragment(remoteInfo, reference)

          expect(result).toBe(expectedCursorResult)
        })
      }
    )

    describe.each`
      provider       | startLine | endLine | expectedSelectionResult
      ${'github'}    | ${10}     | ${20}   | ${'#L10-L20'}
      ${'gitlab'}    | ${10}     | ${20}   | ${'#L10-20'}
      ${'bitbucket'} | ${10}     | ${20}   | ${'#lines-10:20'}
      ${'azure'}     | ${10}     | ${20}   | ${'&line=10&lineEnd=21'}
      ${'generic'}   | ${10}     | ${20}   | ${''}
    `(
      'selection line formatting for $provider',
      ({ provider, startLine, endLine, expectedSelectionResult }) => {
        it(`formats selection from line ${startLine} to ${endLine} correctly`, () => {
          const remoteInfo = { provider } satisfies RemoteInfo
          const reference = {
            range: {
              kind: 'selection',
              startLine,
              endLine,
            },
          } as Reference

          const result = toProviderLineFragment(remoteInfo, reference)

          expect(result).toBe(expectedSelectionResult)
        })
      }
    )
  })

  describe('toReferenceLineFragment', () => {
    it('formats cursor range correctly', () => {
      const range: ReferenceRange = { kind: 'cursor', line: 42 }

      const result = toReferenceLineFragment(range)

      expect(result).toBe('42')
    })

    it('formats selection range correctly', () => {
      const range: ReferenceRange = {
        kind: 'selection',
        startLine: 10,
        endLine: 20,
      }

      const result = toReferenceLineFragment(range)

      expect(result).toBe('10-20')
    })

    describe.each`
      kind           | line    | startLine | endLine | expectedResult
      ${'cursor'}    | ${1}    | ${null}   | ${null} | ${'1'}
      ${'cursor'}    | ${42}   | ${null}   | ${null} | ${'42'}
      ${'selection'} | ${null} | ${5}      | ${10}   | ${'5-10'}
      ${'selection'} | ${null} | ${100}    | ${200}  | ${'100-200'}
    `(
      'different range formats',
      ({ kind, line, startLine, endLine, expectedResult }) => {
        it(`formats ${kind} range correctly`, () => {
          const range: ReferenceRange =
            kind === 'cursor' ? { kind, line } : { kind, startLine, endLine }

          const result = toReferenceLineFragment(range)

          expect(result).toBe(expectedResult)
        })
      }
    )
  })
})
