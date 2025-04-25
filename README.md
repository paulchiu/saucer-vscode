# Saucer

A VS Code extension that provides IntelliJ WebStorm-like copy reference functionality<sup>1</sup>. Easily copy Markdown style code references with source links for sharing.

1: Tested with TypeScript but should work with other languages where VS Code symbol detection works

## Features

- Copy symbol references in various formats
- Automatically include source code links to GitHub, GitLab, Bitbucket, or Azure DevOps
- Reference format options (symbol, line, defaults to ask)
- Context menu integration
- Keyboard shortcuts

## Usage

1. Place your cursor on a TypeScript symbol or select a few lines of code
2. Right-click and select "Copy Reference" or use the keyboard shortcut (`Alt+Shift+C` on Windows/Linux, `Opt+Shift+C` on macOS)
3. Choose a reference format when prompted:
   - **Symbol**: Copies the symbol path; i.e. `Class.method`
   - **Filename**: Copies the file name with line reference; i.e. `foo.ts:10`

The copied reference includes a link to the source code repository when configured and available.

## Examples

### Symbol References

When you place your cursor on a symbol and copy a reference:

```md
`getSymbol` ([GitHub](https://....))
```

With relative path enabled:

```md
`src/utils/symbol.ts:getSymbol` ([GitHub](https://....))
```

### Line References

When you place your cursor on a specific line:

```md
`git.ts:42` ([GitLab](https://....))
```

### Selection References

When you select multiple lines:

```md
`referenceRange.ts:10-20` ([Bitbucket](https://....))
```

### Different Git Providers

When source link is enabled (default) appropriate links are generated on your working repository:

- GitHub: `([GitHub](https://github.com/user/repo/blob/[branch]/src/utils/[file]#L[number]))`
- GitLab: `([GitLab](https://gitlab.com/user/repo/-/blob/[branch]/src/utils/[file]#L[number]))`
- Bitbucket: `([Bitbucket](https://bitbucket.org/user/repo/src/[branch]/src/utils/[file]#lines-[numbers]))`
- Azure DevOps: `([Azure DevOps](https://dev.azure.com/organization/project/_git/project?path=src%2Futils%2Fvscode.ts&version=GB[branch]&line=[number]&lineEnd=[number]))`

## Extension Settings

This extension contributes the following settings:

- `saucer.includeRelativePath`: Include relative file path in references (default: `true`)
  - When `true`, references include the path, i.e. `src/foo.ts:10`
  - When `false`, references include the only the filename, i.e. `foo.ts:10`
- `saucer.linkSource`: Include source code links when available (default: `true`)
  - When `true`, appends source link as described in 'Different Git Providers' section and formats the reference in Markdown.
  - When `false`, just returns the reference in plaintext.
- `saucer.cursorReferenceType`: Default reference type for cursor position (default: `Ask`)
- `saucer.selectionReferenceType`: Default reference type for selections (default: `Ask`)

## Requirements

- VS Code 1.99.0 or higher

## Installation

1. Open VS Code
2. Go to Extensions view (Ctrl+Shift+X)
3. Search for "Saucer"
4. Click Install

## Keyboard Shortcuts

- Windows/Linux: `Alt+Shift+C`
- macOS: `Alt+Shift+C`

## Supported Git Providers

- [GitHub](https://github.com)
- [GitLab](https://gitlab.com)
- [Bitbucket](https://bitbucket.org)
- [Azure DevOps](https://dev.azure.com)
- Generic Git repositories (fallback option, limited functionality)

## License

MIT
