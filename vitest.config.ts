import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: [path.resolve(__dirname, './src/test/**/*.unit.test.ts')],
    exclude: [path.resolve(__dirname, './src/test/stubs/**/*.ts')],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        './node_modules/**/*.ts',
        '**/*.config.{js,ts,mjs}',
        'esbuild.js',
        'tsconfig.json',
        '.vscode-test/**',
        '.vscode-test.mjs',
      ],
      skipFull: true,
      all: true,
      allowExternal: false,
    },
  },
})
