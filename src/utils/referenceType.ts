import { showQuickPick } from './vscode'

const REFERENCE_TYPES = ['Symbol', 'Filename'] as const
const REFERENCE_TYPE_PLACEHOLDER = 'Select reference type'

export type ReferenceType = (typeof REFERENCE_TYPES)[number]

function isReferenceType(type?: string): type is ReferenceType {
  if (!type) {
    return false
  }

  const assumedType = type as ReferenceType
  return REFERENCE_TYPES.includes(assumedType)
}

export async function getReferenceType(
  configType: string | undefined
): Promise<ReferenceType> {
  if (isReferenceType(configType)) {
    return configType
  } else {
    const userChoice = await showQuickPick(REFERENCE_TYPES, {
      placeHolder: REFERENCE_TYPE_PLACEHOLDER,
    })

    return getReferenceType(userChoice)
  }
}
