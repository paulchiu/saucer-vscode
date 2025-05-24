import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getReferenceType } from '../../utils/referenceType'
import { showQuickPick } from '../../utils/vscode'

vi.mock('../../utils/vscode', () => ({
  showQuickPick: vi.fn(),
}))

describe('utils/referenceType', () => {
  describe('getReferenceType', () => {
    const sut = getReferenceType

    beforeEach(() => {
      vi.resetAllMocks()
    })

    it.each`
      configType    | expected
      ${'Symbol'}   | ${'Symbol'}
      ${'Filename'} | ${'Filename'}
    `(
      'should return reference type when configType=$configType matches',
      async ({ configType, expected }) => {
        const result = await sut(configType)
        expect(result).toEqual(expected)
      }
    )

    it.each`
      configType   | userChoice    | expected
      ${undefined} | ${'Symbol'}   | ${'Symbol'}
      ${'Invalid'} | ${'Filename'} | ${'Filename'}
      ${null}      | ${'Symbol'}   | ${'Symbol'}
    `(
      'should prompt user when configType=$configType is invalid and return userChoice=$userChoice',
      async ({ configType, userChoice, expected }) => {
        vi.mocked(showQuickPick).mockResolvedValueOnce(userChoice)

        const result = await sut(configType)

        expect(showQuickPick).toHaveBeenCalledWith(['Symbol', 'Filename'], {
          placeHolder: 'Select reference type',
        })
        expect(result).toEqual(expected)
      }
    )

    it('should handle recursive calls if user makes invalid selection then valid one', async () => {
      vi.mocked(showQuickPick)
        .mockResolvedValueOnce('Invalid' as any)
        .mockResolvedValueOnce('Symbol' as any)

      const result = await sut(undefined)

      expect(showQuickPick).toHaveBeenCalledTimes(2)
      expect(result).toEqual('Symbol')
    })

    it('should return undefined when user cancels quick pick', async () => {
      vi.mocked(showQuickPick).mockResolvedValueOnce(undefined)

      const result = await sut(undefined)

      expect(showQuickPick).toHaveBeenCalledWith(['Symbol', 'Filename'], {
        placeHolder: 'Select reference type',
      })
      expect(result).toBeUndefined()
    })
  })
})
