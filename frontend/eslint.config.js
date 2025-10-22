// Minimal ESLint Flat Config for this project
// Enables basic TypeScript and React Native linting with recommended rules

import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'off',
    },
    ignores: ["**/.expo/**", "**/__generated__/**", "**/node_modules/**"],
  },
  // React Native specific rules
  {
    files: ["**/*.tsx", "**/*.ts"],
    rules: {
      "react/no-unescaped-entities": "error",
      "react/jsx-no-leaked-render": "error",
    },
  },
];