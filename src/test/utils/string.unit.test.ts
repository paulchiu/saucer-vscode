import { describe, it, expect } from 'vitest'
import { surround } from '../../utils/string'

describe('utils/string', () => {
  describe('surround', () => {
    const sut = surround

    it.each`
      str        | char     | expected
      ${'test'}  | ${'*'}   | ${'*test*'}
      ${'hello'} | ${'#'}   | ${'#hello#'}
      ${''}      | ${'@'}   | ${'@@'}
      ${'world'} | ${''}    | ${'world'}
      ${'a'}     | ${'xyz'} | ${'xyzaxyz'}
    `(
      'should surround "$str" with "$char" to get "$expected"',
      ({ str, char, expected }) => {
        expect(sut(str, char)).toBe(expected)
      }
    )
  })
})
