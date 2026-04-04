import { reactConfig } from '@anvara/eslint-config';

export default [
  ...reactConfig,
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      globals: {
        process: 'readonly',
      },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // TypeScript's compiler handles undefined references; ESLint's no-undef
      // doesn't understand TS type references (React.ReactNode, RequestInit, etc.)
      'no-undef': 'off',
    },
  },
];
