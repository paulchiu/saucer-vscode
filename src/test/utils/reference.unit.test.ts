import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getReference, toSourceLink, Reference } from '../../utils/reference'
import { getContext } from '../../utils/context'
import { getReferenceType, ReferenceType } from '../../utils/referenceType'
import { fromSelection } from '../../utils/referenceRange'
import { toProviderLineFragment } from '../../utils/line'
import { RemoteInfo } from '../../utils/git'

// Mock dependencies
vi.mock('../../utils/context', () => ({
  getContext: vi.fn(),
}))

vi.mock('../../utils/referenceType', () => ({
  getReferenceType: vi.fn(),
}))

vi.mock('../../utils/referenceRange', () => ({
  fromSelection: vi.fn(),
}))

vi.mock('../../utils/line', () => ({
  toProviderLineFragment: vi.fn(),
}))

describe('utils/reference', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('getReference', () => {
    const sut = getReference
    const mockConfig = {
      includeRelativePath: true,
      linkSource: true,
      cursorRefType: 'Symbol',
      selectionRefType: 'Ask',
    }

    it('should return reference with cursor type when range kind is cursor', async () => {
      const mockEditor = { selection: { active: { line: 1, character: 5 } } }
      const mockDocument = {
        uri: {
          fsPath: '/workspace/project/file.ts',
          path: '/workspace/project/file.ts',
        },
      }
      const mockFolder = { uri: { fsPath: '/workspace/project' } }

      vi.mocked(getContext).mockReturnValue({
        editor: mockEditor,
        document: mockDocument,
        folder: mockFolder,
      } as any)

      const mockRange = { kind: 'cursor', line: 1 }
      vi.mocked(fromSelection).mockReturnValue(mockRange as any)
      vi.mocked(getReferenceType).mockResolvedValue('symbol' as ReferenceType)

      const result = await sut(mockConfig)

      expect(result).toEqual({
        type: 'symbol',
        range: mockRange,
        workspacePath: '/workspace/project',
        relativePath: 'file.ts',
        fileName: 'file.ts',
      })
      expect(getReferenceType).toHaveBeenCalledWith(mockConfig.cursorRefType)
    })

    it('should return reference with selection type when range kind is selection', async () => {
      const mockEditor = { selection: { active: { line: 1, character: 5 } } }
      const mockDocument = {
        uri: {
          fsPath: '/workspace/project/file.ts',
          path: '/workspace/project/file.ts',
        },
      }
      const mockFolder = { uri: { fsPath: '/workspace/project' } }

      vi.mocked(getContext).mockReturnValue({
        editor: mockEditor,
        document: mockDocument,
        folder: mockFolder,
      } as any)

      const mockRange = { kind: 'selection', startLine: 1, endLine: 3 }
      vi.mocked(fromSelection).mockReturnValue(mockRange as any)
      vi.mocked(getReferenceType).mockResolvedValue('filename' as ReferenceType)

      const result = await sut(mockConfig)

      expect(result).toEqual({
        type: 'filename',
        range: mockRange,
        workspacePath: '/workspace/project',
        relativePath: 'file.ts',
        fileName: 'file.ts',
      })
      expect(getReferenceType).toHaveBeenCalledWith(mockConfig.selectionRefType)
    })

    it('should use document path when folder is undefined', async () => {
      const mockEditor = { selection: { active: { line: 1, character: 5 } } }
      const mockDocument = {
        uri: {
          fsPath: '/workspace/project/file.ts',
          path: '/workspace/project/file.ts',
        },
      }

      vi.mocked(getContext).mockReturnValue({
        editor: mockEditor,
        document: mockDocument,
        folder: undefined,
      } as any)

      const mockRange = { kind: 'cursor', line: 1 }
      vi.mocked(fromSelection).mockReturnValue(mockRange as any)
      vi.mocked(getReferenceType).mockResolvedValue('symbol' as ReferenceType)

      const result = await sut(mockConfig)

      expect(result).toEqual({
        type: 'symbol',
        range: mockRange,
        workspacePath: undefined,
        relativePath: '/workspace/project/file.ts',
        fileName: 'file.ts',
      })
    })
  })

  describe('toSourceLink', () => {
    const sut = toSourceLink

    const mockReference: Reference = {
      type: 'Symbol',
      range: { kind: 'cursor', line: 10 },
      workspacePath: '/workspace/project',
      relativePath: 'src/utils/file.ts',
      fileName: 'file.ts',
    }

    const mockBranch = 'main'

    beforeEach(() => {
      vi.mocked(toProviderLineFragment).mockReturnValue('#L10')
    })

    it.each`
      provider       | url                                  | expectedLink
      ${'github'}    | ${'https://github.com/user/repo'}    | ${'[GitHub](https://github.com/user/repo/blob/main/src/utils/file.ts#L10)'}
      ${'gitlab'}    | ${'https://gitlab.com/user/repo'}    | ${'[GitLab](https://gitlab.com/user/repo/-/blob/main/src/utils/file.ts#L10)'}
      ${'bitbucket'} | ${'https://bitbucket.org/user/repo'} | ${'[Bitbucket](https://bitbucket.org/user/repo/src/main/src/utils/file.ts#L10)'}
      ${'generic'}   | ${'https://example.com/repo'}        | ${'[source](https://example.com/repo)'}
      ${'unknown'}   | ${'https://unknown.com/repo'}        | ${undefined}
    `(
      'should return correct link for $provider provider',
      ({ provider, url, expectedLink }) => {
        const remoteInfo: RemoteInfo = { provider, url } as RemoteInfo

        const result = sut(remoteInfo, mockBranch, mockReference)

        expect(result).toBe(expectedLink)
      }
    )

    it('should return correct link for Azure DevOps', () => {
      const remoteInfo: RemoteInfo = {
        provider: 'azure',
        url: 'https://dev.azure.com/organization/project',
      } as RemoteInfo

      const result = sut(remoteInfo, mockBranch, mockReference)

      expect(result).toBe(
        '[Azure DevOps](https://dev.azure.com/organization/project/_git/project?path=src%2Futils%2Ffile.ts&version=GBmain#L10)'
      )
    })

    it('should return undefined for Azure DevOps with invalid URL format', () => {
      const remoteInfo: RemoteInfo = {
        provider: 'azure',
        url: 'https://invalid-azure-url.com',
      } as RemoteInfo

      const result = sut(remoteInfo, mockBranch, mockReference)

      expect(result).toBeUndefined()
    })
  })
})
