// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

// `npm run lint` (package.json) has had no config at all to run against —
// ESLint 9 requires a flat eslint.config.js and none existed, so the
// command failed outright with "ESLint couldn't find an eslint.config.js"
// rather than running any rules. This is the first one, built from the
// angular-eslint + typescript-eslint versions already in devDependencies
// (no new packages added).
module.exports = tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      // Matches every component's actual selector prefix/casing in this
      // repo (app-kebab-case for components, appCamelCase for directives).
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {},
  },
  {
    ignores: ['dist/**', 'coverage/**', '.angular/**'],
  },
);
