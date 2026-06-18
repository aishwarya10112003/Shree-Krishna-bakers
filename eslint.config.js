import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', '**/dist/**', 'backend']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    plugins: { react },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      // Mark identifiers used only inside JSX (e.g. <motion.div>) as "used".
      'react/jsx-uses-vars': 'error',
      // Context files legitimately export a Provider + a hook together.
      'react-refresh/only-export-components': 'warn',
    },
  },
  {
    // Node-context config files (vite.config.js, etc.) — allow `process` etc.
    files: ['**/*.config.js'],
    languageOptions: { globals: globals.node },
  },
])
