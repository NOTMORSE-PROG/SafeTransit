module.exports = {
  root: true,
  extends: [
    'expo',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', {
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_',
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
  },
  overrides: [
    {
      files: ['*.config.js', '*.config.ts'],
      rules: {
        '@typescript-eslint/no-require-imports': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    '.expo/',
    'dist/',
    'build/',
  ],
};
