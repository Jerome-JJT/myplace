import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import pluginReactRefresh from 'eslint-plugin-react-refresh';
import { fixupConfigRules, fixupPluginRules } from '@eslint/compat';

export default [
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
  },
  {
    languageOptions: { globals: globals.browser },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    plugins: {
      ['react-hooks']:   fixupPluginRules(reactHooksPlugin),
      ['react-refresh']: fixupPluginRules(pluginReactRefresh),
    },
    rules: {
      '@typescript-eslint/no-explicit-any':       'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-inferrable-types':   'off',
      'arrow-parens':                             [
        'error',
        'always',
      ],
      'arrow-spacing': 'error',
      'indent':        [
        'error',
        2,
      ],
      'no-tabs':               'error',
      'no-trailing-spaces':    'error',
      'no-var':                'error',
      'prefer-arrow-callback': 'error',
      'prefer-const':          'error',
      'quotes':                [
        'error',
        'single',
      ],
      'require-await': 'error',
      'key-spacing':   [
        'error',
        {
          'beforeColon': false,
          'afterColon':  true,
          'align':       'value',
        },
      ],
      'no-console': [
        'warn',
        {
          'allow': [
            'warn',
            'error',
          ],
        },
      ],
      'no-mixed-spaces-and-tabs': 'error',
      'no-return-await':          'error',
      'semi':                     [
        'error',
        'always',
      ],
      'yoda':           'error',
      'global-require': 'warn',
      'eqeqeq':         [
        'error',
        'smart',
      ],
      'brace-style': [
        'error',
        'stroustrup',
        {
          'allowSingleLine': true,
        },
      ],
      'object-curly-newline': [
        'error',
        {
          'consistent': true,
        },
      ],
      'object-curly-spacing': [
        'error',
        'always',
      ],
      'array-element-newline': [
        'error',
        'consistent',
      ],
      'array-bracket-newline': [
        'error',
        'consistent',
      ],
      'space-before-function-paren': [
        'error',
        {
          'anonymous':  'always',
          'named':      'never',
          'asyncArrow': 'always',
        },
      ],
      'comma-dangle': [
        'error',
        'always-multiline',
      ],
      'comma-spacing': [
        'error',
        {
          'before': false,
          'after':  true,
        },
      ],
      'no-multi-spaces': [
        'error',
        {
          'ignoreEOLComments': true,
        },
      ],
      'react/react-in-jsx-scope':          'off',
      'react/display-name':                'off',
      'no-unused-vars':                    'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          'argsIgnorePattern':         '^_',
          'varsIgnorePattern':         '^_',
          'caughtErrorsIgnorePattern': '^_',
        },
      ],
      'react-hooks/rules-of-hooks':  'error',
      'react-hooks/exhaustive-deps': [
        'error',
      ],
    },
  },
];