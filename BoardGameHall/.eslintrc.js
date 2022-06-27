module.exports = {
  root: true,
  plugins: ['jest'],
  extends: ['plugin:jest/recommended', 'plugin:jest/style', 'eslint:recommended'],
  rules: {
    'no-unused-vars': 'off',
    'jest/consistent-test-it': ['error', { fn: 'test' }],
  },
  env: {
    'jest/globals': true,
    node: true,
    es2021: true,
  },
};
