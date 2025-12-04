module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: ['react', 'react-hooks', '@typescript-eslint'],
  settings: {
    react: { version: 'detect' },
  },
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'react/react-in-jsx-scope': 'off',
    'react/display-name': 'warn',
    'react/no-unescaped-entities': 'warn',
    '@typescript-eslint/no-var-requires': 'warn',
    'react/no-unknown-property': ['error', { ignore: ['jsx'] }],
  },
  overrides: [
    {
      files: ['e2e/**/*.ts', 'e2e/**/*.tsx'],
      parserOptions: {
        project: null,
      },
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
      },
    },
    {
      files: ['**/__tests__/**/*.tsx', '**/__tests__/**/*.ts', '**/*.test.tsx', '**/*.test.ts'],
      parserOptions: {
        project: null,
      },
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
      },
    },
  ],
};
