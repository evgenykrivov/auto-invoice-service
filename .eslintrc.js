module.exports = {
  parser: '@typescript-eslint/parser',
  root: true,
  parserOptions: {
    project: './tsconfig.eslint.json',
    tsconfigRootDir: __dirname,
  },
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',

    'airbnb',
    'airbnb-typescript',

    'next',
    'next/core-web-vitals',

    'plugin:prettier/recommended',
  ],
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'warn',
    'react/require-default-props': 'off',
    'react/jsx-props-no-spreading': 'off',
    'prettier/prettier': 'error',

    'jsx-a11y/no-static-element-interactions': 'warn',
    'jsx-a11y/click-events-have-key-events': 'warn',
    'react/no-array-index-key': 'warn',
    'object-shorthand': 'warn',
    'react/self-closing-comp': 'off',
    'import/prefer-default-export': 'off',
    '@typescript-eslint/no-misused-promises': 'off',
    'react/button-has-type': 'warn',
    'react/jsx-filename-extension': [2, { extensions: ['.tsx'] }],
    eqeqeq: 'warn',
    'react/function-component-definition': [
      'warn',
      {
        namedComponents: 'arrow-function',
        unnamedComponents: 'arrow-function',
      },
    ],
  },
  ignorePatterns: [
    '**/node_modules/*',
    '**/.next/*',
    '**/dist/*',
    '**/coverage/*',
  ],
};
