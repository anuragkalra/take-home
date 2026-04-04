import { reactConfig } from '@anvara/eslint-config';

export default [
  ...reactConfig,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-undef': 'off',
    },
  },
];
