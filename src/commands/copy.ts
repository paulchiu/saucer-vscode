import { getConfig } from '../utils/config'
import { getRemoteInfo, getCurrentBranch } from '../utils/git'
import { getReference, toSourceLink } from '../utils/reference'
import { match, P } from 'ts-pattern'
import { getSymbol } from '../utils/symbol'
import { toReferenceLineFragment } from '../utils/line'
import { copyToClipboard, showError, showInfo, showWarn } from '../utils/vscode'
import { surround } from '../utils/string'

export async function copy(): Promise<void> {
  try {
    const reference = await getCopyContent()

    if (reference) {
      await copyToClipboard(reference)
      showInfo('Reference copied')
    } else if (reference === null) {
      // User canceled, don't show any message
      return
    } else {
      showWarn('No identifiable reference to copy')
    }
  } catch (error) {
    showError(`Failed to copy reference: ${(error as Error).message}`)
  }
}

async function getCopyContent(): Promise<string | null> {
  const config = getConfig()
  const reference = await getReference(config)

  if (!reference) {
    return null
  }

  const source = await match(config.linkSource)
    .with(true, async () => {
      const remoteInfo = await getRemoteInfo(reference.workspacePath)
      const branch = (await getCurrentBranch(reference.workspacePath)) ?? ''
      return toSourceLink(remoteInfo, branch, reference)
    })
    .with(false, () => '')
    .exhaustive()
  const parenthesisSource = source ? `(${source})` : ''

  const lines = toReferenceLineFragment(reference.range)

  const referenceString =
    (await match([reference.type, config.includeRelativePath])
      .with(['Symbol', P.any], () => getSymbol())
      .with(
        ['Filename (with line)', true],
        () => `${reference.relativePath}:${lines}`
      )
      .with(
        ['Filename (with line)', false],
        () => `${reference.fileName}:${lines}`
      )
      .with(['Filename (no line)', true], () => reference.relativePath)
      .with(['Filename (no line)', false], () => reference.fileName)
      .exhaustive()) ?? ''

  const codeString = referenceString ? surround(referenceString, '`') : ''

  return [codeString, parenthesisSource].filter(Boolean).join(' ')
}
