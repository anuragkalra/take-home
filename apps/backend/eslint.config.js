import { baseConfig } from '@anvara/eslint-config';

export default [
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {
      // Backend-specific rules
      'no-console': 'off', // Allow console in backend
    },
  },
];
