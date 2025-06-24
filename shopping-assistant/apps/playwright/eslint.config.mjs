import { concat, ecma, playwright, style, typescript } from '@vue-storefront/eslint-config';
import gitignore from 'eslint-config-flat-gitignore';

export default concat(
  gitignore(),
  ecma(),
  typescript(
    {
      files: '**/*.ts',
    },
    {
      files: ['setup/**/*.ts'],
      rules: {
        '@typescript-eslint/no-unused-expressions': 'off',
      },
    },
    {
      files: ['**/*.ts'],
      rules: {
        '@typescript-eslint/explicit-member-accessibility': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-empty-object-type': 'off',
        '@typescript-eslint/no-magic-numbers': 'off',
      },
    },
  ),
  style(),
  playwright({
    files: ['**/*.test.ts', 'sf-modules/**/*.test.ts'],
  }),
);
