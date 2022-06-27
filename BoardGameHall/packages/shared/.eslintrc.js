module.exports = {
  ignorePatterns: ['dist/**'],
  env: {
    es2021: true,
    node: true,
  },
  overrides: [
    {
      files: ['**/*.ts'],
      extends: ['plugin:@typescript-eslint/recommended', 'prettier'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        sourceType: 'module',
      },
    },
  ],
};
