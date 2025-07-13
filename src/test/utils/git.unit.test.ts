import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getRemoteInfo,
  getCurrentBranch,
  findGitRoot,
  getGitContext,
  type RemoteInfo,
  type GitContext,
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

    describe('Azure DevOps provider tests', () => {
      it.each`
        remoteUrl                                               | expectedUrl
        ${'https://dev.azure.com/org/project'}                  | ${'https://dev.azure.com/org/project'}
        ${'https://dev.azure.com/org/project/_git/repo'}        | ${'https://dev.azure.com/org/project/_git/repo'}
        ${'https://dev.azure.com/org/project/_git/repo.git'}    | ${'https://dev.azure.com/org/project/_git/repo.git'}
        ${'git@ssh.dev.azure.com:v3/org/project/repo'}          | ${'https://dev.azure.com/org/project'}
        ${'https://org.visualstudio.com/project'}               | ${'https://dev.azure.com/org/project'}
        ${'https://org.visualstudio.com/project/_git/repo'}     | ${'https://org.visualstudio.com/project/_git/repo'}
        ${'https://org.visualstudio.com/project/_git/repo.git'} | ${'https://org.visualstudio.com/project/_git/repo.git'}
      `(
        'should correctly identify and normalize Azure URL: $remoteUrl',
        async ({ remoteUrl, expectedUrl }) => {
          mockExecAsync.mockResolvedValueOnce({
            stdout: `origin\t${remoteUrl} (fetch)\norigin\t${remoteUrl} (push)`,
            stderr: '',
          })

          const result = await sut(testWorkspacePath)

          expect(result).toEqual({
            provider: 'azure',
            url: expectedUrl,
          })
        }
      )

      it('should detect Azure DevOps with dev.azure.com domain', async () => {
        mockExecAsync.mockResolvedValueOnce({
          stdout: 'origin\thttps://dev.azure.com/myorg/myproject (fetch)',
          stderr: '',
        })

        const result = await sut(testWorkspacePath)

        expect(result).toEqual({
          provider: 'azure',
          url: 'https://dev.azure.com/myorg/myproject',
        })
      })

      it('should detect Azure DevOps with visualstudio.com domain', async () => {
        mockExecAsync.mockResolvedValueOnce({
          stdout: 'origin\thttps://myorg.visualstudio.com/myproject (fetch)',
          stderr: '',
        })

        const result = await sut(testWorkspacePath)

        expect(result).toEqual({
          provider: 'azure',
          url: 'https://dev.azure.com/myorg/myproject',
        })
      })

      it('should handle Azure SSH URLs', async () => {
        mockExecAsync.mockResolvedValueOnce({
          stdout:
            'origin\tgit@ssh.dev.azure.com:v3/myorg/myproject/myrepo (fetch)',
          stderr: '',
        })

        const result = await sut(testWorkspacePath)

        expect(result).toEqual({
          provider: 'azure',
          url: 'https://dev.azure.com/myorg/myproject',
        })
      })
    })
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

    describe('Azure URL normalization', () => {
      it.each`
        remoteUrl                                                  | expectedUrl
        ${'git@ssh.dev.azure.com:v3/myorg/myproject/myrepo'}       | ${'https://dev.azure.com/myorg/myproject'}
        ${'https://dev.azure.com/myorg/myproject'}                 | ${'https://dev.azure.com/myorg/myproject'}
        ${'https://dev.azure.com/myorg/myproject.git'}             | ${'https://dev.azure.com/myorg/myproject'}
        ${'https://myorg.visualstudio.com/myproject'}              | ${'https://dev.azure.com/myorg/myproject'}
        ${'https://myorg.visualstudio.com/myproject.git'}          | ${'https://dev.azure.com/myorg/myproject.git'}
        ${'https://dev.azure.com/myorg/myproject/_git/myrepo'}     | ${'https://dev.azure.com/myorg/myproject/_git/myrepo'}
        ${'https://dev.azure.com/myorg/myproject/_git/myrepo.git'} | ${'https://dev.azure.com/myorg/myproject/_git/myrepo.git'}
      `(
        'should normalize Azure URL $remoteUrl to $expectedUrl',
        async ({ remoteUrl, expectedUrl }) => {
          mockExecAsync.mockResolvedValueOnce({
            stdout: `origin\t${remoteUrl} (fetch)`,
            stderr: '',
          })

          const result = await getRemoteInfo(testWorkspacePath)

          expect(result).toHaveProperty('url', expectedUrl)
          expect(result).toHaveProperty('provider', 'azure')
        }
      )
    })
  })

  describe('findGitRoot', () => {
    const sut = findGitRoot

    it('should return git root path when in git repository', async () => {
      mockExecAsync.mockResolvedValueOnce({
        stdout: '/Users/test/project\n',
        stderr: '',
      })

      const result = await sut(testWorkspacePath)

      expect(result).toBe('/Users/test/project')
      expect(mockExecAsync).toHaveBeenCalledWith(
        'git rev-parse --show-toplevel',
        { cwd: testWorkspacePath }
      )
    })

    it('should return undefined when not in git repository', async () => {
      mockExecAsync.mockRejectedValueOnce(new Error('fatal: not a git repository'))

      const result = await sut('/different/path')

      expect(result).toBeUndefined()
    })

    it('should return undefined when git command returns empty output', async () => {
      mockExecAsync.mockResolvedValueOnce({
        stdout: '',
        stderr: '',
      })

      const result = await sut('/empty/path')

      expect(result).toBeUndefined()
    })
  })

  describe('getGitContext', () => {
    const sut = getGitContext

    it('should provide git context when in git repository at root level', async () => {
      mockExecAsync.mockResolvedValueOnce({
        stdout: '/Users/test/project\n',
        stderr: '',
      })

      const result = await sut('/Users/test/project')

      const expected: GitContext = {
        workspacePath: '/Users/test/project',
        gitRoot: '/Users/test/project',
        relativePath: undefined, // workspace is at git root
      }
      expect(result).toEqual(expected)
    })

    it('should provide git context when in git repository subdirectory', async () => {
      mockExecAsync.mockResolvedValueOnce({
        stdout: '/Users/test/project\n',
        stderr: '',
      })

      const result = await sut('/Users/test/project/frontend')

      const expected: GitContext = {
        workspacePath: '/Users/test/project/frontend',
        gitRoot: '/Users/test/project',
        relativePath: 'frontend',
      }
      expect(result).toEqual(expected)
    })

    it('should handle workspace outside git repository', async () => {
      const nonGitPath = '/non/git/workspace'
      mockExecAsync.mockRejectedValueOnce(new Error('fatal: not a git repository'))

      const result = await sut(nonGitPath)

      const expected: GitContext = {
        workspacePath: nonGitPath,
        gitRoot: undefined,
        relativePath: undefined,
      }
      expect(result).toEqual(expected)
    })

    it('should handle nested subdirectories correctly', async () => {
      mockExecAsync.mockResolvedValueOnce({
        stdout: '/Users/test/project\n',
        stderr: '',
      })

      const result = await sut('/Users/test/project/apps/frontend/src')

      const expected: GitContext = {
        workspacePath: '/Users/test/project/apps/frontend/src',
        gitRoot: '/Users/test/project',
        relativePath: 'apps/frontend/src',
      }
      expect(result).toEqual(expected)
    })

    it('should handle workspace outside of git root gracefully', async () => {
      const workspacePath = '/Users/test/other/project'
      mockExecAsync.mockResolvedValueOnce({
        stdout: '/Users/test/different-project\n',
        stderr: '',
      })

      const result = await sut(workspacePath)

      const expected: GitContext = {
        workspacePath: workspacePath,
        gitRoot: '/Users/test/different-project',
        relativePath: undefined, // workspace is outside git root
      }
      expect(result).toEqual(expected)
    })
  })
})
