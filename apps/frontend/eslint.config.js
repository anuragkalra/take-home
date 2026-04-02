import { reactConfig } from '@anvara/eslint-config';

export default [
  ...reactConfig,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // Frontend-specific rules
    },
  },
];
