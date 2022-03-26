module.exports = {
  env: {
    node: true,
    browser: true,
  },
  extends: [
    'plugin:@next/next/recommended',
    'plugin:@shopify/esnext',
    'plugin:@shopify/typescript',
    'plugin:@shopify/prettier',
  ],
  parser: '@typescript-eslint/parser',
  rules: {
    'import/no-unresolved': 'off',
  },
  overrides: [
    {
      files: ['*'],
      rules: {
        // borrowing this from https://github.com/Shopify/web-configs/blob/0e1857c/packages/eslint-plugin/lib/config/rules/typescript.js#L113
        // ... and *adding* the memberLike (snake_case, strictCamelCase) bit at the bottom
        '@typescript-eslint/naming-convention': [
          'error',
          {
            selector: 'memberLike',
            filter: {
              match: false,
              // Ignore double underscores and React UNSAFE_ (for lifecycle hooks that are to be deprecated)
              regex: '^(__|UNSAFE_).+$',
            },
            format: ['snake_case', 'strictCamelCase', 'PascalCase'],
          },
          {
            selector: 'default',
            format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
            leadingUnderscore: 'allow',
            trailingUnderscore: 'allow',
          },
          {
            selector: 'default',
            filter: {
              match: true,
              // Allow double underscores and React UNSAFE_ (for lifecycle hooks that are to be deprecated)
              regex: '^(__|UNSAFE_).+$',
            },
            format: null,
          },
          {
            selector: 'typeLike',
            format: ['PascalCase'],
          },
          {
            selector: 'typeParameter',
            format: ['PascalCase'],
            prefix: ['T'],
          },
          {
            selector: 'interface',
            format: ['PascalCase'],
            custom: {
              regex: '^I[A-Z]',
              match: false,
            },
          },
        ],

        // overriding shopify's preference and going for "record" here, because "index-signature" does not
        // support things like Record<MechanicColorScheme, any>, where our index key is a union type
        '@typescript-eslint/consistent-indexed-object-style': [
          'error',
          'record',
        ],
        'no-console': 'off',
        'import/order': 'off',
        '@shopify/strict-component-boundaries': 'off',
        'no-warning-comments': ['error', {terms: ['fixme']}],
      },
    },
  ],
};
