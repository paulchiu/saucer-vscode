import { getConfig as getExtensionConfig } from './vscode'

export type Config = {
  includeRelativePath: boolean
  linkSource: boolean
  cursorRefType: string
  selectionRefType: string
}

export function getConfig(): Config {
  const config = getExtensionConfig()
  const includeRelativePath = config.get<boolean>('includeRelativePath', true)
  const linkSource = config.get<boolean>('linkSource', true)
  const cursorRefType = config.get<string>('cursorReferenceType', 'Ask')
  const selectionRefType = config.get<string>('selectionReferenceType', 'Ask')

  return {
    includeRelativePath,
    linkSource,
    cursorRefType,
    selectionRefType,
  }
}
