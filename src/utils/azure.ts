export type AzureUrlInfo = {
  org: string
  project: string
}

export function parseAzureUrl(url: string): AzureUrlInfo | undefined {
  const match = url.match(/https:\/\/dev\.azure\.com\/([^\/]+)\/([^\/]+)/)
  if (!match) {
    return undefined
  }

  const [, org, project] = match
  return { org, project }
}

export function buildAzureSourceUrl(
  url: string,
  branch: string,
  relativePath: string,
  lineFragment: string
): string | undefined {
  const parsed = parseAzureUrl(url)
  if (!parsed) {
    return undefined
  }

  const { org, project } = parsed
  return `https://dev.azure.com/${org}/${project}/_git/${project}?path=${encodeURIComponent(
    relativePath
  )}&version=GB${branch}${lineFragment}`
}
