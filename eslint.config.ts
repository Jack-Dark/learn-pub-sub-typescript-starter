import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import stylistic from '@stylistic/eslint-plugin';
import unusedImports from 'eslint-plugin-unused-imports';
import eslint from '@eslint/js';

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
  [
    {
      files: ['**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}'],
      plugins: {
        '@stylistic': stylistic,
        js,
        'unused-imports': unusedImports,
      },
      extends: ['js/recommended', 'airbnb', 'airbnb-typescript'],
      languageOptions: { globals: globals.browser },
      rules: {
        'no-case-declarations': 'off',
        // ESLint built-in stylistic rules:
        // Add `@stylistic/` prefix
        semi: 'error',
        '@typescript-eslint/semi': 'error',
        '@stylistic/semi': 'error',
        '@stylistic/comma-dangle': ['error', 'always-multiline'],
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'unused-imports/no-unused-imports': 'error',
        'unused-imports/no-unused-vars': [
          'warn',
          {
            vars: 'all',
            varsIgnorePattern: '^_',
            args: 'after-used',
            argsIgnorePattern: '^_',
          },
        ],
      },
    },
    tseslint.configs.recommended,
  ],
);
