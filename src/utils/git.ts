import { match } from 'ts-pattern'
import { execAsync } from './exec'

export type GitProvider =
  | 'github'
  | 'gitlab'
  | 'bitbucket'
  | 'azure'
  | 'generic'

export type RemoteInfo =
  | {
      provider: GitProvider
      url: string
    }
  | { provider: 'unknown' }

function isValidGitUrl(url: string): boolean {
  // Handle SSH URLs (git@github.com:user/repo.git)
  if (url.startsWith('git@')) {
    return true // SSH URLs are valid for our purposes
  }

  // For HTTP/HTTPS URLs, validate with URL class
  try {
    new URL(url)
    return true
  } catch (_error) {
    return false
  }
}

export async function getRemoteInfo(
  workspacePath: string
): Promise<RemoteInfo> {
  try {
    const { stdout } = await execAsync('git remote -v', { cwd: workspacePath })
    if (!stdout) {
      return { provider: 'unknown' }
    }

    const originLine = stdout
      .split('\n')
      .find(line => line.startsWith('origin') && line.includes('(fetch)'))
    if (!originLine) {
      return { provider: 'unknown' }
    }

    const urlMatch = originLine.match(/origin\s+([^\s]+)/)
    if (!urlMatch?.[1]) {
      return { provider: 'unknown' }
    }

    const rawUrl = urlMatch[1]
    if (!isValidGitUrl(rawUrl)) {
      return { provider: 'unknown' }
    }

    return determineProvider(rawUrl)
  } catch {
    return { provider: 'unknown' }
  }
}

function determineProvider(rawUrl: string): RemoteInfo {
  return match(rawUrl)
    .returnType<RemoteInfo>()
    .when(
      url => url.includes('github.com'),
      url => ({
        url: normalizeGitUrl(url, 'github'),
        provider: 'github',
      })
    )
    .when(
      url => url.includes('gitlab.com'),
      url => ({
        url: normalizeGitUrl(url, 'gitlab'),
        provider: 'gitlab',
      })
    )
    .when(
      url => url.includes('bitbucket.org'),
      url => ({
        url: normalizeGitUrl(url, 'bitbucket'),
        provider: 'bitbucket',
      })
    )
    .when(
      url => url.includes('dev.azure.com') || url.includes('visualstudio.com'),
      url => ({
        url,
        provider: 'azure',
      })
    )
    .otherwise(url => ({
      url,
      provider: 'generic',
    }))
}

export async function getCurrentBranch(
  workspacePath: string
): Promise<string | undefined> {
  try {
    const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', {
      cwd: workspacePath,
    })
    return stdout.trim() || undefined
  } catch {
    return undefined
  }
}

function normalizeGitUrl(
  url: string,
  provider: 'github' | 'gitlab' | 'bitbucket'
): string {
  const patterns = {
    github: {
      ssh: /^git@(github\.com):(.+)$/,
      https: /^https:\/\/github\.com\/(.+)$/,
    },
    gitlab: {
      ssh: /^git@(gitlab\.com):(.+)$/,
      https: /^https:\/\/gitlab\.com\/(.+)$/,
    },
    bitbucket: {
      ssh: /^git@(bitbucket\.org):(.+)$/,
      https: /^https:\/\/bitbucket\.org\/(.+)$/,
    },
  }

  // SSH format
  const sshMatch = url.match(patterns[provider].ssh)
  if (sshMatch) {
    const host = sshMatch[1]
    const repo = sshMatch[2].replace(/\.git$/, '')
    return `https://${host}/${repo}`
  }

  // HTTPS format
  const httpsMatch = url.match(patterns[provider].https)
  if (httpsMatch) {
    return url.replace(/\.git$/, '')
  }

  return url
}
