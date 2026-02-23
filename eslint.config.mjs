import process from 'node:process'
import antfu from '@antfu/eslint-config'

export default antfu({
  // Enable Vue support
  vue: true,

  // Enable TypeScript support
  typescript: true,

  // Disable stylistic formatting (use Prettier instead)
  stylistic: false,

  // Disable linting of code blocks inside markdown files
  markdown: false,

  // Ignore patterns
  ignores: [
    'node_modules',
    'dist',
    'extension',
    '*.local',
    '*.log*',
    'public',
  ],

  // Custom rules
  rules: {
    // Browser extension specific globals
    'no-restricted-globals': ['error', 'name', 'length', 'event'],

    // Vue rules
    'vue/no-v-html': 'off',
    'vue/require-default-prop': 'off',
    'vue/multi-word-component-names': 'off',

    // TypeScript rules
    'ts/no-explicit-any': 'off',
    'ts/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

    // Allow console in development
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
  },
})
