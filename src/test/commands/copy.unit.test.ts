import { describe, it, expect, vi, beforeEach } from 'vitest'
import { copy } from '../../commands/copy'
import { getConfig } from '../../utils/config'
import { getReference, toSourceLink } from '../../utils/reference'
import { getRemoteInfo, getCurrentBranch } from '../../utils/git'
import { getSymbol } from '../../utils/symbol'
import { toReferenceLineFragment } from '../../utils/line'
import {
  copyToClipboard,
  showError,
  showInfo,
  showWarn,
} from '../../utils/vscode'
import { surround } from '../../utils/string'

// Mock all dependencies
vi.mock('../../utils/config', () => ({
  getConfig: vi.fn(),
}))

vi.mock('../../utils/reference', () => ({
  getReference: vi.fn(),
  toSourceLink: vi.fn(),
}))

vi.mock('../../utils/git', () => ({
  getRemoteInfo: vi.fn(),
  getCurrentBranch: vi.fn(),
}))

vi.mock('../../utils/symbol', () => ({
  getSymbol: vi.fn(),
}))

vi.mock('../../utils/line', () => ({
  toReferenceLineFragment: vi.fn(),
}))

vi.mock('../../utils/vscode', () => ({
  copyToClipboard: vi.fn(),
  showError: vi.fn(),
  showInfo: vi.fn(),
  showWarn: vi.fn(),
}))

vi.mock('../../utils/string', () => ({
  surround: vi.fn(),
}))

describe('commands/copy', () => {
  describe('copy', () => {
    const mockConfig = {
      includeRelativePath: true,
      linkSource: true,
      cursorRefType: 'Symbol',
      selectionRefType: 'Filename',
    }

    const mockReference = {
      type: 'Symbol',
      range: { kind: 'cursor', line: 10 },
      workspacePath: '/workspace/project',
      relativePath: 'src/utils/file.ts',
      fileName: 'file.ts',
    }

    beforeEach(() => {
      vi.resetAllMocks()
      vi.mocked(getConfig).mockReturnValue(mockConfig as any)
      vi.mocked(toReferenceLineFragment).mockReturnValue('10')
      vi.mocked(surround).mockImplementation(
        (str, char) => `${char}${str}${char}`
      )
      vi.mocked(toSourceLink).mockReturnValue(
        '[GitHub](https://github.com/user/repo/blob/main/src/utils/file.ts)'
      )
    })

    it('should copy reference to clipboard and show success message when reference is available', async () => {
      vi.mocked(getReference).mockResolvedValue(mockReference as any)
      vi.mocked(getRemoteInfo).mockResolvedValue({
        provider: 'github',
        url: 'https://github.com/user/repo',
      } as any)
      vi.mocked(getCurrentBranch).mockResolvedValue('main')
      vi.mocked(getSymbol).mockResolvedValue('TestClass.method')

      await copy()

      expect(copyToClipboard).toHaveBeenCalledWith(
        '`TestClass.method` ([GitHub](https://github.com/user/repo/blob/main/src/utils/file.ts))'
      )
      expect(showInfo).toHaveBeenCalledWith('Reference copied')
      expect(showWarn).not.toHaveBeenCalled()
      expect(showError).not.toHaveBeenCalled()
    })

    it('should return silently when user cancels (reference is null)', async () => {
      vi.mocked(getReference).mockResolvedValue(undefined)

      await copy()

      expect(copyToClipboard).not.toHaveBeenCalled()
      expect(showInfo).not.toHaveBeenCalled()
      expect(showWarn).not.toHaveBeenCalled()
      expect(showError).not.toHaveBeenCalled()
    })

    it('should return silently when no reference is available (reference is undefined)', async () => {
      vi.mocked(getReference).mockResolvedValue(undefined)

      await copy()

      expect(copyToClipboard).not.toHaveBeenCalled()
      expect(showInfo).not.toHaveBeenCalled()
      expect(showWarn).not.toHaveBeenCalled()
      expect(showError).not.toHaveBeenCalled()
    })

    it('should handle errors and show error message', async () => {
      const error = new Error('Test error')
      vi.mocked(getReference).mockRejectedValue(error)

      await copy()

      expect(copyToClipboard).not.toHaveBeenCalled()
      expect(showInfo).not.toHaveBeenCalled()
      expect(showWarn).not.toHaveBeenCalled()
      expect(showError).toHaveBeenCalledWith(
        'Failed to copy reference: Test error'
      )
    })

    it('should generate filename reference when type is Filename (with line) and includeRelativePath is true', async () => {
      const filenameReference = {
        ...mockReference,
        type: 'Filename (with line)',
      }
      vi.mocked(getReference).mockResolvedValue(filenameReference as any)
      vi.mocked(getRemoteInfo).mockResolvedValue({
        provider: 'github',
        url: 'https://github.com/user/repo',
      } as any)
      vi.mocked(getCurrentBranch).mockResolvedValue('main')

      await copy()

      expect(copyToClipboard).toHaveBeenCalledWith(
        '`src/utils/file.ts:10` ([GitHub](https://github.com/user/repo/blob/main/src/utils/file.ts))'
      )
      expect(showInfo).toHaveBeenCalledWith('Reference copied')
    })

    it('should generate filename reference without relative path when includeRelativePath is false', async () => {
      const configWithoutRelativePath = {
        ...mockConfig,
        includeRelativePath: false,
      }
      const filenameReference = {
        ...mockReference,
        type: 'Filename (with line)',
      }
      vi.mocked(getConfig).mockReturnValue(configWithoutRelativePath as any)
      vi.mocked(getReference).mockResolvedValue(filenameReference as any)
      vi.mocked(getRemoteInfo).mockResolvedValue({
        provider: 'github',
        url: 'https://github.com/user/repo',
      } as any)
      vi.mocked(getCurrentBranch).mockResolvedValue('main')

      await copy()

      expect(copyToClipboard).toHaveBeenCalledWith(
        '`file.ts:10` ([GitHub](https://github.com/user/repo/blob/main/src/utils/file.ts))'
      )
      expect(showInfo).toHaveBeenCalledWith('Reference copied')
    })

    it('should generate filename reference without line numbers when type is Filename (no line) and includeRelativePath is true', async () => {
      const filenameNoLineReference = {
        ...mockReference,
        type: 'Filename (no line)',
      }
      vi.mocked(getReference).mockResolvedValue(filenameNoLineReference as any)
      vi.mocked(getRemoteInfo).mockResolvedValue({
        provider: 'github',
        url: 'https://github.com/user/repo',
      } as any)
      vi.mocked(getCurrentBranch).mockResolvedValue('main')

      await copy()

      expect(copyToClipboard).toHaveBeenCalledWith(
        '`src/utils/file.ts` ([GitHub](https://github.com/user/repo/blob/main/src/utils/file.ts))'
      )
      expect(showInfo).toHaveBeenCalledWith('Reference copied')
    })

    it('should generate filename reference without line numbers and without relative path when type is Filename (no line) and includeRelativePath is false', async () => {
      const configWithoutRelativePath = {
        ...mockConfig,
        includeRelativePath: false,
      }
      const filenameNoLineReference = {
        ...mockReference,
        type: 'Filename (no line)',
      }
      vi.mocked(getConfig).mockReturnValue(configWithoutRelativePath as any)
      vi.mocked(getReference).mockResolvedValue(filenameNoLineReference as any)
      vi.mocked(getRemoteInfo).mockResolvedValue({
        provider: 'github',
        url: 'https://github.com/user/repo',
      } as any)
      vi.mocked(getCurrentBranch).mockResolvedValue('main')

      await copy()

      expect(copyToClipboard).toHaveBeenCalledWith(
        '`file.ts` ([GitHub](https://github.com/user/repo/blob/main/src/utils/file.ts))'
      )
      expect(showInfo).toHaveBeenCalledWith('Reference copied')
    })

    it('should handle backward compatibility for old Filename type by treating it as Filename (with line)', async () => {
      const backwardCompatReference = {
        ...mockReference,
        type: 'Filename (with line)', // This is what getReferenceType should return for old 'Filename'
      }
      vi.mocked(getReference).mockResolvedValue(backwardCompatReference as any)
      vi.mocked(getRemoteInfo).mockResolvedValue({
        provider: 'github',
        url: 'https://github.com/user/repo',
      } as any)
      vi.mocked(getCurrentBranch).mockResolvedValue('main')

      await copy()

      expect(copyToClipboard).toHaveBeenCalledWith(
        '`src/utils/file.ts:10` ([GitHub](https://github.com/user/repo/blob/main/src/utils/file.ts))'
      )
      expect(showInfo).toHaveBeenCalledWith('Reference copied')
    })

    it('should generate reference without source link when linkSource is false', async () => {
      const configWithoutLinkSource = {
        ...mockConfig,
        linkSource: false,
      }
      vi.mocked(getConfig).mockReturnValue(configWithoutLinkSource as any)
      vi.mocked(getReference).mockResolvedValue(mockReference as any)
      vi.mocked(getSymbol).mockResolvedValue('TestClass.method')

      await copy()

      expect(copyToClipboard).toHaveBeenCalledWith('`TestClass.method`')
      expect(showInfo).toHaveBeenCalledWith('Reference copied')
    })

    it('should handle empty symbol and generate reference without code string', async () => {
      vi.mocked(getReference).mockResolvedValue(mockReference as any)
      vi.mocked(getRemoteInfo).mockResolvedValue({
        provider: 'github',
        url: 'https://github.com/user/repo',
      } as any)
      vi.mocked(getCurrentBranch).mockResolvedValue('main')
      vi.mocked(getSymbol).mockResolvedValue('')
      vi.mocked(surround).mockImplementation((str, char) =>
        str ? `${char}${str}${char}` : ''
      )

      await copy()

      expect(copyToClipboard).toHaveBeenCalledWith(
        '([GitHub](https://github.com/user/repo/blob/main/src/utils/file.ts))'
      )
      expect(showInfo).toHaveBeenCalledWith('Reference copied')
    })

    it('should show warning when getCopyContent returns empty string', async () => {
      // Mock getCopyContent to return empty string which is falsy but not null
      vi.mocked(getReference).mockResolvedValue(mockReference as any)
      vi.mocked(getRemoteInfo).mockResolvedValue({
        provider: 'github',
        url: 'https://github.com/user/repo',
      } as any)
      vi.mocked(getCurrentBranch).mockResolvedValue('main')
      vi.mocked(getSymbol).mockResolvedValue('')
      vi.mocked(toSourceLink).mockReturnValue('')
      vi.mocked(surround).mockImplementation((str, char) =>
        str ? `${char}${str}${char}` : ''
      )

      await copy()

      expect(copyToClipboard).not.toHaveBeenCalled()
      expect(showInfo).not.toHaveBeenCalled()
      expect(showWarn).toHaveBeenCalledWith('No identifiable reference to copy')
      expect(showError).not.toHaveBeenCalled()
    })
  })
})
