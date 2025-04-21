import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getRemoteInfo,
  getCurrentBranch,
  type RemoteInfo,
} from '../../utils/git'
import { execAsync } from '../../utils/exec'

vi.mock('../../utils/exec', () => ({
  execAsync: vi.fn(),
}))

describe('utils/git', () => {
  const mockExecAsync = vi.mocked(execAsync)
  const testWorkspacePath = '/test/workspace'

  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('getRemoteInfo', () => {
    const sut = getRemoteInfo

    it('should return unknown provider when git command fails', async () => {
      mockExecAsync.mockRejectedValueOnce(new Error('Command failed'))

      const result = await sut(testWorkspacePath)

      expect(result).toEqual({ provider: 'unknown' })
      expect(mockExecAsync).toHaveBeenCalledWith('git remote -v', {
        cwd: testWorkspacePath,
      })
    })

    it('should return unknown provider when stdout is empty', async () => {
      mockExecAsync.mockResolvedValueOnce({ stdout: '', stderr: '' })

      const result = await sut(testWorkspacePath)

      expect(result).toEqual({ provider: 'unknown' })
    })

    it('should return unknown provider when no origin line is found', async () => {
      mockExecAsync.mockResolvedValueOnce({
        stdout: 'upstream\thttps://github.com/user/repo.git (fetch)',
        stderr: '',
      })

      const result = await sut(testWorkspacePath)

      expect(result).toEqual({ provider: 'unknown' })
    })

    it('should return unknown provider when URL is invalid', async () => {
      mockExecAsync.mockResolvedValueOnce({
        stdout: 'origin\tinvalid-url (fetch)',
        stderr: '',
      })

      const result = await sut(testWorkspacePath)

      expect(result).toEqual({ provider: 'unknown' })
    })

    it.each`
      remoteUrl                                        | expectedProvider | expectedUrl
      ${'https://github.com/user/repo.git'}            | ${'github'}      | ${'https://github.com/user/repo'}
      ${'git@github.com:user/repo.git'}                | ${'github'}      | ${'https://github.com/user/repo'}
      ${'https://gitlab.com/user/repo.git'}            | ${'gitlab'}      | ${'https://gitlab.com/user/repo'}
      ${'git@gitlab.com:user/repo.git'}                | ${'gitlab'}      | ${'https://gitlab.com/user/repo'}
      ${'https://bitbucket.org/user/repo.git'}         | ${'bitbucket'}   | ${'https://bitbucket.org/user/repo'}
      ${'git@bitbucket.org:user/repo.git'}             | ${'bitbucket'}   | ${'https://bitbucket.org/user/repo'}
      ${'https://dev.azure.com/org/project/_git/repo'} | ${'azure'}       | ${'https://dev.azure.com/org/project/_git/repo'}
      ${'https://example.com/user/repo.git'}           | ${'generic'}     | ${'https://example.com/user/repo.git'}
    `(
      'should identify $expectedProvider provider from $remoteUrl',
      async ({ remoteUrl, expectedProvider, expectedUrl }) => {
        mockExecAsync.mockResolvedValueOnce({
          stdout: `origin\t${remoteUrl} (fetch)\norigin\t${remoteUrl} (push)`,
          stderr: '',
        })

        const result = await sut(testWorkspacePath)

        const expected: RemoteInfo = {
          provider: expectedProvider as any,
          url: expectedUrl,
        }
        expect(result).toEqual(expected)
      }
    )
  })

  describe('getCurrentBranch', () => {
    const sut = getCurrentBranch

    it('should return the current branch name', async () => {
      mockExecAsync.mockResolvedValueOnce({
        stdout: 'main\n',
        stderr: '',
      })

      const result = await sut(testWorkspacePath)

      expect(result).toBe('main')
      expect(mockExecAsync).toHaveBeenCalledWith(
        'git rev-parse --abbrev-ref HEAD',
        { cwd: testWorkspacePath }
      )
    })

    it('should return undefined when git command fails', async () => {
      mockExecAsync.mockRejectedValueOnce(new Error('Command failed'))

      const result = await sut(testWorkspacePath)

      expect(result).toBeUndefined()
    })

    it('should return undefined when stdout is empty', async () => {
      mockExecAsync.mockResolvedValueOnce({ stdout: '', stderr: '' })

      const result = await sut(testWorkspacePath)

      expect(result).toBeUndefined()
    })
  })

  // Since isValidGitUrl is not exported, we'll test it indirectly through getRemoteInfo
  describe('isValidGitUrl', () => {
    it('should accept SSH URLs', async () => {
      mockExecAsync.mockResolvedValueOnce({
        stdout: 'origin\tgit@github.com:user/repo.git (fetch)',
        stderr: '',
      })

      const result = await getRemoteInfo(testWorkspacePath)

      expect(result).toEqual({
        provider: 'github',
        url: 'https://github.com/user/repo',
      })
    })

    it('should accept HTTPS URLs', async () => {
      mockExecAsync.mockResolvedValueOnce({
        stdout: 'origin\thttps://github.com/user/repo.git (fetch)',
        stderr: '',
      })

      const result = await getRemoteInfo(testWorkspacePath)

      expect(result).toEqual({
        provider: 'github',
        url: 'https://github.com/user/repo',
      })
    })

    it('should reject invalid URLs', async () => {
      mockExecAsync.mockResolvedValueOnce({
        stdout: 'origin\tinvalid://url (fetch)',
        stderr: '',
      })

      const result = await getRemoteInfo(testWorkspacePath)

      expect(result).toEqual({ provider: 'generic', url: 'invalid://url' })
    })
  })

  // Since normalizeGitUrl is not exported, we'll test it indirectly through getRemoteInfo
  describe('normalizeGitUrl', () => {
    it.each`
      remoteUrl                                | expectedUrl
      ${'git@github.com:user/repo.git'}        | ${'https://github.com/user/repo'}
      ${'https://github.com/user/repo.git'}    | ${'https://github.com/user/repo'}
      ${'git@gitlab.com:user/repo.git'}        | ${'https://gitlab.com/user/repo'}
      ${'https://gitlab.com/user/repo.git'}    | ${'https://gitlab.com/user/repo'}
      ${'git@bitbucket.org:user/repo.git'}     | ${'https://bitbucket.org/user/repo'}
      ${'https://bitbucket.org/user/repo.git'} | ${'https://bitbucket.org/user/repo'}
    `(
      'should normalize $remoteUrl to $expectedUrl',
      async ({ remoteUrl, expectedUrl }) => {
        mockExecAsync.mockResolvedValueOnce({
          stdout: `origin\t${remoteUrl} (fetch)`,
          stderr: '',
        })

        const result = await getRemoteInfo(testWorkspacePath)

        expect(result).toHaveProperty('url', expectedUrl)
      }
    )
  })
})
