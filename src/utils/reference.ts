import { match } from 'ts-pattern'
import path, { basename } from 'path'
import { Config } from './config'
import { getContext } from './context'
import { fromSelection, ReferenceRange } from './referenceRange'
import { getReferenceType, ReferenceType } from './referenceType'
import { RemoteInfo, getGitContext } from './git'
import { toProviderLineFragment } from './line'
import { buildAzureSourceUrl } from './azure'

export type Reference = {
  type: ReferenceType
  range: ReferenceRange
  workspacePath: string
  relativePath: string
  fileName: string
  gitRoot?: string
  pathFromGitRoot?: string
}

export async function getReference(
  config: Config
): Promise<Reference | undefined> {
  const { editor, document, folder } = getContext()

  // Selection
  const selection = editor.selection
  const range = fromSelection(selection)

  // Path calculations
  const workspacePath = folder?.uri.fsPath
  const relativePath = folder
    ? path.relative(folder.uri.fsPath, document.uri.fsPath)
    : document.uri.path
  const fileName = basename(relativePath)

  // Git context for enhanced path calculation
  let gitRoot: string | undefined
  let pathFromGitRoot: string | undefined

  if (config.useGitRoot && workspacePath) {
    try {
      const gitContext = await getGitContext(workspacePath)
      gitRoot = gitContext.gitRoot

      if (gitRoot) {
        const absoluteFilePath = path.resolve(
          folder?.uri.fsPath || '',
          relativePath
        )
        pathFromGitRoot = path.relative(gitRoot, absoluteFilePath)
        pathFromGitRoot = pathFromGitRoot.replace(/\\/g, '/')
      }
    } catch (_error) {
      // Git operations failed, continue with workspace-relative paths
    }
  }

  // Type
  const type = await match(range)
    .with({ kind: 'cursor' }, () => getReferenceType(config.cursorRefType))
    .with({ kind: 'selection' }, () =>
      getReferenceType(config.selectionRefType)
    )
    .exhaustive()

  if (type === undefined) {
    return undefined
  }

  return {
    type,
    range,
    workspacePath,
    relativePath,
    fileName,
    gitRoot,
    pathFromGitRoot,
  }
}

export function toSourceLink(
  remoteInfo: RemoteInfo,
  branch: string,
  reference: Reference
): string | undefined {
  const lineFragment = toProviderLineFragment(remoteInfo, reference)
  const referencePath = reference.pathFromGitRoot || reference.relativePath

  return match(remoteInfo)
    .with(
      { provider: 'github' },
      ({ url }) =>
        `[GitHub](${url}/blob/${branch}/${referencePath}${lineFragment})`
    )
    .with(
      { provider: 'gitlab' },
      ({ url }) =>
        `[GitLab](${url}/-/blob/${branch}/${referencePath}${lineFragment})`
    )
    .with(
      { provider: 'bitbucket' },
      ({ url }) =>
        `[Bitbucket](${url}/src/${branch}/${referencePath}${lineFragment})`
    )
    .with({ provider: 'azure' }, ({ url }) => {
      const formattedUrl = buildAzureSourceUrl(
        url,
        branch,
        referencePath,
        lineFragment
      )
      return formattedUrl ? `[Azure DevOps](${formattedUrl})` : undefined
    })
    .with({ provider: 'generic' }, ({ url }) => `[source](${url})`)
    .with({ provider: 'unknown' }, () => undefined)
    .exhaustive()
}
