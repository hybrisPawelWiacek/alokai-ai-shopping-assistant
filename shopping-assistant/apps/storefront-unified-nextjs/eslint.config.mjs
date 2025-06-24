import { concat, ecma, nextjs, style, typescript } from '@vue-storefront/eslint-config';
import gitignore from 'eslint-config-flat-gitignore';

export default concat(
  gitignore(),
  ecma(),
  typescript(
    {
      files: '**/*.{ts,tsx}',
    },
    {
      files: ['**/*.{ts,tsx}'],
      rules: {
        '@typescript-eslint/consistent-type-imports': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-empty-object-type': 'off',
        '@typescript-eslint/no-magic-numbers': 'off',
      },
    },
  ),
  nextjs({
    files: {
      components: ['components/**/*.{js,jsx,ts,tsx}', 'app/**/components/*.{js,jsx,ts,tsx}'],
      general: '**/*.{js,jsx,ts,tsx}',
      hooks: '{hooks,helpers}/**/*.{js,jsx,ts,tsx}',
    },
  }),
  style(),
);
