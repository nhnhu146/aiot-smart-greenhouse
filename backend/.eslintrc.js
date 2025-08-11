module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
  ],
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    // Basic rules that work with TypeScript
    'no-unused-vars': 'off', // Turn off for TypeScript
    '@typescript-eslint/no-unused-vars': 'warn',
    // 'no-console': 'warn', // Removed - console logging is acceptable for debugging and operational info
    'semi': ['error', 'always'],
    'quotes': ['error', 'single'],
  },
  env: {
    node: true,
    es6: true,
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.js'],
};