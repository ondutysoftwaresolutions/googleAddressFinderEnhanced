import { defineConfig, globalIgnores } from 'eslint/config';
import lwcConfig from '@salesforce/eslint-config-lwc';

export default defineConfig([
  globalIgnores([
    '**/lwc/**/*.css',
    '**/lwc/**/*.html',
    '**/lwc/**/*.json',
    '**/lwc/**/*.svg',
    '**/lwc/**/*.xml',
    '**/aura/**/*.auradoc',
    '**/aura/**/*.cmp',
    '**/aura/**/*.css',
    '**/aura/**/*.design',
    '**/aura/**/*.evt',
    '**/aura/**/*.json',
    '**/aura/**/*.svg',
    '**/aura/**/*.tokens',
    '**/aura/**/*.xml',
    '**/aura/**/*.app',
    '**/.sfdx',
  ]),
  ...lwcConfig.configs.recommended,
  {
    rules: {
      '@lwc/lwc/no-api-reassignments': 'off',
    },
  },
]);
