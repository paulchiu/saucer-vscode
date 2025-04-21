import { match } from 'ts-pattern'
import { RemoteInfo } from './git'
import { GitProvider } from './git'
import { Reference } from './reference'
import { ReferenceRange } from './referenceRange'

function toProviderCursorLine(
  provider: GitProvider,
  line: number
): string {
  return match(provider)
    .with('github', () => `#L${line}`)
    .with('gitlab', () => `#L${line}`)
    .with('bitbucket', () => `#lines-${line}`)
    .with('azure', () => `&line=${line}&lineEnd=${line}`)
    .with('generic', () => '')
    .exhaustive()
}

function toProviderSelectionLines(
  provider: GitProvider,
  startLine: number,
  endLine: number
): string {
  return match(provider)
    .with('github', () => `#L${startLine}-L${endLine}`)
    .with('gitlab', () => `#L${startLine}-${endLine}`)
    .with('bitbucket', () => `#lines-${startLine}:${endLine}`)
    .with('azure', () => `&line=${startLine}&lineEnd=${endLine}`)
    .with('generic', () => '')
    .exhaustive()
}

export function toProviderLineFragment(
  remoteInfo: RemoteInfo,
  reference: Reference
): string {
  if (remoteInfo.provider === 'unknown') {
    return ''
  }

  return match(reference.range)
    .with({ kind: 'cursor' }, r =>
      toProviderCursorLine(remoteInfo.provider, r.line)
    )
    .with({ kind: 'selection' }, r =>
      toProviderSelectionLines(remoteInfo.provider, r.startLine, r.endLine)
    )
    .exhaustive()
}

export function toReferenceLineFragment(range: ReferenceRange): string {
  return match(range)
    .with({ kind: 'cursor' }, r => r.line.toString())
    .with({ kind: 'selection' }, r => `${r.startLine}-${r.endLine}`)
    .exhaustive()
}
