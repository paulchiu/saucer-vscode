import { match } from 'ts-pattern'
import path, { basename } from 'path'
import { Config } from './config'
import { getContext } from './context'
import { fromSelection, ReferenceRange } from './referenceRange'
import { getReferenceType, ReferenceType } from './referenceType'
import { RemoteInfo } from './git'
import { toProviderLineFragment } from './line'

export type Reference = {
  type: ReferenceType
  range: ReferenceRange
  workspacePath: string
  relativePath: string
  fileName: string
}

export async function getReference(
  config: Config
): Promise<Reference | undefined> {
  const { editor, document, folder } = getContext()

  // Selection
  const selection = editor.selection
  const range = fromSelection(selection)

  // Path
  const workspacePath = folder?.uri.fsPath
  const relativePath = folder
    ? path.relative(folder.uri.fsPath, document.uri.fsPath)
    : document.uri.path
  const fileName = basename(relativePath)

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
  }
}

export function toSourceLink(
  remoteInfo: RemoteInfo,
  branch: string,
  reference: Reference
): string | undefined {
  const lineFragment = toProviderLineFragment(remoteInfo, reference)

  return match(remoteInfo)
    .with(
      { provider: 'github' },
      ({ url }) =>
        `[GitHub](${url}/blob/${branch}/${reference.relativePath}${lineFragment})`
    )
    .with(
      { provider: 'gitlab' },
      ({ url }) =>
        `[GitLab](${url}/-/blob/${branch}/${reference.relativePath}${lineFragment})`
    )
    .with(
      { provider: 'bitbucket' },
      ({ url }) =>
        `[Bitbucket](${url}/src/${branch}/${reference.relativePath}${lineFragment})`
    )
    .with({ provider: 'azure' }, ({ url }) => {
      const match = url.match(/https:\/\/dev\.azure\.com\/([^\/]+)\/([^\/]+)/)
      if (!match) {
        return undefined
      }

      const [, org, project] = match
      const formattedUrl = `https://dev.azure.com/${org}/${project}/_git/${project}?path=${encodeURIComponent(
        reference.relativePath
      )}&version=GB${branch}${lineFragment}`
      return `[Azure DevOps](${formattedUrl})`
    })
    .with({ provider: 'generic' }, ({ url }) => `[source](${url})`)
    .with({ provider: 'unknown' }, () => undefined)
    .exhaustive()
}
