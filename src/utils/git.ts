import { match } from 'ts-pattern'
import { execAsync } from './exec'
import * as path from 'path'

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

export type GitContext = {
  gitRoot?: string
  workspacePath: string
  relativePath?: string
}

export async function findGitRoot(
  startPath: string
): Promise<string | undefined> {
  try {
    const { stdout } = await execAsync('git rev-parse --show-toplevel', {
      cwd: startPath,
    })

    const gitRoot = stdout.trim()
    return gitRoot || undefined
  } catch (_error) {
    return undefined
  }
}

export async function getGitContext(
  workspacePath: string
): Promise<GitContext> {
  const gitRoot = await findGitRoot(workspacePath)

  const context: GitContext = {
    workspacePath,
    gitRoot,
  }

  if (gitRoot && workspacePath) {
    try {
      const relativePath = path.relative(gitRoot, workspacePath)
      // Only set relativePath if workspace is actually within git root
      if (relativePath && !relativePath.startsWith('..')) {
        context.relativePath = relativePath === '.' ? undefined : relativePath
      }
    } catch (_error) {
      // Path calculation failed, leave relativePath undefined
    }
  }

  return context
}

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
        url: normalizeGitUrl(url, 'azure'),
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
  provider: 'github' | 'gitlab' | 'bitbucket' | 'azure'
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
    azure: {
      ssh: /^git@ssh\.dev\.azure\.com:v3\/([^\/]+)\/([^\/]+)\/([^\/]+)$/,
      https: /^https:\/\/dev\.azure\.com\/([^\/]+)\/([^\/]+)$/,
      legacy: /^https:\/\/([^\.]+)\.visualstudio\.com\/([^\/]+)$/,
    },
  }

  if (provider === 'azure') {
    // Handle SSH format: git@ssh.dev.azure.com:v3/org/project/repo
    const sshMatch = url.match(patterns.azure.ssh)
    if (sshMatch) {
      const [, org, project] = sshMatch
      return `https://dev.azure.com/${org}/${project}`
    }

    // Handle HTTPS format: https://dev.azure.com/org/project
    const httpsMatch = url.match(patterns.azure.https)
    if (httpsMatch) {
      return url.replace(/\.git$/, '')
    }

    // Handle legacy visualstudio.com format: https://org.visualstudio.com/project
    const legacyMatch = url.match(patterns.azure.legacy)
    if (legacyMatch) {
      const [, org, project] = legacyMatch
      return `https://dev.azure.com/${org}/${project}`
    }

    return url
  }

  // SSH format for other providers
  const sshMatch = url.match(patterns[provider].ssh)
  if (sshMatch) {
    const host = sshMatch[1]
    const repo = sshMatch[2].replace(/\.git$/, '')
    return `https://${host}/${repo}`
  }

  // HTTPS format for other providers
  const httpsMatch = url.match(patterns[provider].https)
  if (httpsMatch) {
    return url.replace(/\.git$/, '')
  }

  return url
}
