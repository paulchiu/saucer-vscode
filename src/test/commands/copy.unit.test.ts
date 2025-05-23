import { describe, it, expect, vi, beforeEach } from 'vitest'
import { copy } from '../../commands/copy'
import { getConfig } from '../../utils/config'
import { getReference } from '../../utils/reference'
import { getSymbol } from '../../utils/symbol'
import {
  copyToClipboard,
  showError,
  showInfo,
  showWarn,
} from '../../utils/vscode'

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

vi.mock('../../utils/vscode', () => ({
  copyToClipboard: vi.fn(),
  showError: vi.fn(),
  showInfo: vi.fn(),
  showWarn: vi.fn(),
}))

describe('commands/copy', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('copy', () => {
    const mockConfig = {
      includeRelativePath: true,
      linkSource: false,
      cursorRefType: 'Symbol',
      selectionRefType: 'Filename',
    }

    beforeEach(() => {
      vi.mocked(getConfig).mockReturnValue(mockConfig)
    })

    it('should copy reference and show success message when reference is generated', async () => {
      const mockReference = {
        type: 'Symbol' as const,
        range: { kind: 'cursor' as const, line: 10 },
        workspacePath: '/workspace/project',
        relativePath: 'src/file.ts',
        fileName: 'file.ts',
      }

      vi.mocked(getReference).mockResolvedValue(mockReference)
      vi.mocked(getSymbol).mockResolvedValue('functionName')

      await copy()

      expect(copyToClipboard).toHaveBeenCalledWith('`functionName`')
      expect(showInfo).toHaveBeenCalledWith('Reference copied')
      expect(showWarn).not.toHaveBeenCalled()
      expect(showError).not.toHaveBeenCalled()
    })

    it('should show warning when reference is undefined (user dismissed prompt)', async () => {
      vi.mocked(getReference).mockResolvedValue(undefined)

      await copy()

      expect(copyToClipboard).not.toHaveBeenCalled()
      expect(showWarn).toHaveBeenCalledWith('No identifiable reference to copy')
      expect(showInfo).not.toHaveBeenCalled()
      expect(showError).not.toHaveBeenCalled()
    })

    it('should show error message when an exception occurs', async () => {
      const error = new Error('Test error')
      vi.mocked(getReference).mockRejectedValue(error)

      await copy()

      expect(copyToClipboard).not.toHaveBeenCalled()
      expect(showError).toHaveBeenCalledWith(
        'Failed to copy reference: Test error'
      )
      expect(showInfo).not.toHaveBeenCalled()
      expect(showWarn).not.toHaveBeenCalled()
    })
  })
})
