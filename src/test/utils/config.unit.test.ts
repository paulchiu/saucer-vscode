import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getConfig } from '../../utils/config'
import * as vscode from '../../utils/vscode'
import { WorkspaceConfiguration } from 'vscode'

vi.mock('../../utils/vscode', () => ({
  getConfig: vi.fn(),
}))

describe('getConfig', () => {
  const sut = getConfig
  const mockGetConfig = vi.mocked(vscode.getConfig)
  let mockVscodeConfig: { get: <T>(key: string, defaultValue?: T) => T }

  beforeEach(() => {
    vi.resetAllMocks()
    mockVscodeConfig = {
      get: vi.fn().mockImplementation((_, defaultValue) => defaultValue),
    }
    mockGetConfig.mockReturnValue(
      mockVscodeConfig as unknown as WorkspaceConfiguration
    )
  })

  it('should return default config values when none are set', () => {
    const result = sut()

    expect(mockGetConfig).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      includeRelativePath: true,
      linkSource: true,
      cursorRefType: 'Ask',
      selectionRefType: 'Ask',
      useGitRoot: true,
    })
  })

  it('should return custom config values when set', () => {
    const customConfig = {
      get: vi.fn().mockImplementation((key: string, defaultValue: any) => {
        const values: Record<string, any> = {
          includeRelativePath: false,
          linkSource: false,
          cursorReferenceType: 'Line',
          selectionReferenceType: 'Range',
          useGitRoot: false,
        }
        return values[key] ?? defaultValue
      }),
    }
    mockGetConfig.mockReturnValue(
      customConfig as unknown as WorkspaceConfiguration
    )

    const result = sut()

    expect(mockGetConfig).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      includeRelativePath: false,
      linkSource: false,
      cursorRefType: 'Line',
      selectionRefType: 'Range',
      useGitRoot: false,
    })
  })

  it('should handle mixed custom and default values', () => {
    const mixedConfig = {
      get: vi.fn().mockImplementation((key: string, defaultValue: any) => {
        const values: Record<string, any> = {
          includeRelativePath: false,
          selectionReferenceType: 'Range',
        }
        return values[key] ?? defaultValue
      }),
    }
    mockGetConfig.mockReturnValue(
      mixedConfig as unknown as WorkspaceConfiguration
    )

    const result = sut()

    expect(mockGetConfig).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      includeRelativePath: false,
      linkSource: true,
      cursorRefType: 'Ask',
      selectionRefType: 'Range',
      useGitRoot: true,
    })
  })

  it('should return useGitRoot as false when explicitly set', () => {
    const disabledGitRootConfig = {
      get: vi.fn().mockImplementation((key: string, defaultValue: any) => {
        const values: Record<string, any> = {
          useGitRoot: false,
        }
        return values[key] ?? defaultValue
      }),
    }
    mockGetConfig.mockReturnValue(
      disabledGitRootConfig as unknown as WorkspaceConfiguration
    )

    const result = sut()

    expect(mockGetConfig).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      includeRelativePath: true,
      linkSource: true,
      cursorRefType: 'Ask',
      selectionRefType: 'Ask',
      useGitRoot: false,
    })
  })
})
