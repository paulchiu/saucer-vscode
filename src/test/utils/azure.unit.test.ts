import { describe, it, expect } from 'vitest'
import { parseAzureUrl, buildAzureSourceUrl } from '../../utils/azure'

describe('parseAzureUrl', () => {
  const sut = parseAzureUrl

  it('should parse valid Azure DevOps URL', () => {
    const url = 'https://dev.azure.com/myorg/myproject'
    const result = sut(url)

    expect(result).toEqual({
      org: 'myorg',
      project: 'myproject',
    })
  })

  it('should parse Azure DevOps URL with trailing slash', () => {
    const url = 'https://dev.azure.com/myorg/myproject/'
    const result = sut(url)

    expect(result).toEqual({
      org: 'myorg',
      project: 'myproject',
    })
  })

  it('should parse Azure DevOps URL with additional path segments', () => {
    const url = 'https://dev.azure.com/myorg/myproject/_git/repo'
    const result = sut(url)

    expect(result).toEqual({
      org: 'myorg',
      project: 'myproject',
    })
  })

  it('should return undefined for invalid URL format', () => {
    const url = 'https://github.com/owner/repo'
    const result = sut(url)

    expect(result).toBeUndefined()
  })

  it('should return undefined for malformed Azure URL', () => {
    const url = 'https://dev.azure.com/myorg'
    const result = sut(url)

    expect(result).toBeUndefined()
  })

  it('should return undefined for non-HTTPS URL', () => {
    const url = 'http://dev.azure.com/myorg/myproject'
    const result = sut(url)

    expect(result).toBeUndefined()
  })
})

describe('buildAzureSourceUrl', () => {
  const sut = buildAzureSourceUrl

  it('should build Azure source URL with line fragment', () => {
    const url = 'https://dev.azure.com/myorg/myproject'
    const branch = 'main'
    const relativePath = 'src/file.ts'
    const lineFragment = '#L10'

    const result = sut(url, branch, relativePath, lineFragment)

    expect(result).toBe(
      'https://dev.azure.com/myorg/myproject/_git/myproject?path=src%2Ffile.ts&version=GBmain#L10'
    )
  })

  it('should build Azure source URL without line fragment', () => {
    const url = 'https://dev.azure.com/myorg/myproject'
    const branch = 'develop'
    const relativePath = 'README.md'
    const lineFragment = ''

    const result = sut(url, branch, relativePath, lineFragment)

    expect(result).toBe(
      'https://dev.azure.com/myorg/myproject/_git/myproject?path=README.md&version=GBdevelop'
    )
  })

  it('should encode special characters in relative path', () => {
    const url = 'https://dev.azure.com/myorg/myproject'
    const branch = 'main'
    const relativePath = 'src/components/my component.tsx'
    const lineFragment = '#L5-L10'

    const result = sut(url, branch, relativePath, lineFragment)

    expect(result).toBe(
      'https://dev.azure.com/myorg/myproject/_git/myproject?path=src%2Fcomponents%2Fmy%20component.tsx&version=GBmain#L5-L10'
    )
  })

  it('should return undefined for invalid Azure URL', () => {
    const url = 'https://github.com/owner/repo'
    const branch = 'main'
    const relativePath = 'src/file.ts'
    const lineFragment = '#L10'

    const result = sut(url, branch, relativePath, lineFragment)

    expect(result).toBeUndefined()
  })

  it('should handle URL with additional path segments', () => {
    const url = 'https://dev.azure.com/myorg/myproject/_git/repo'
    const branch = 'feature/branch'
    const relativePath = 'docs/api.md'
    const lineFragment = '#L1'

    const result = sut(url, branch, relativePath, lineFragment)

    expect(result).toBe(
      'https://dev.azure.com/myorg/myproject/_git/myproject?path=docs%2Fapi.md&version=GBfeature/branch#L1'
    )
  })
})
