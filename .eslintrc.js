module.exports = {
  extends: [
    'eslint:recommended',
    'standard',
    'prettier',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'promise/param-names': 'off',
    'no-use-before-define': 'off',
    camelcase: 'off',
    'no-undef': 'off',
    'no-undefined': 'off',
    'no-void': ['off'],
    '@typescript-eslint/no-unnecessary-type-constraint': 'off',
    '@typescript-eslint/no-explicit-any': ['warn', { ignoreRestArgs: true }],
    'no-extra-semi': 'off',
    '@typescript-eslint/no-extra-semi': ['warn'],
    '@typescript-eslint/no-empty-interface': [
      'error',
      {
        allowSingleExtends: true,
      },
    ],
  },
};
