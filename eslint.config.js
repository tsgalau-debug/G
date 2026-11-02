// @ts-check
const js = require('@eslint/js');
const ts = require('typescript-eslint');
const unicorn = require('eslint-plugin-unicorn');
const importPlugin = require('eslint-plugin-import');

module.exports = ts.config(
  {
    ignores: [
      'src/tests/**/*',
      'tools/**/*',
      'scripts/**/*',
      'math compesor/**/*',
      'public/wasm/**/*',
      'dist/**/*',
      '*.js',
    ],
  },
  js.configs.recommended,
  ...ts.configs.strictTypeChecked,
  ...ts.configs.stylisticTypeChecked,
  unicorn.default.configs['flat/recommended'],
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // === TYPE SAFETY (Strict) ===
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/restrict-plus-operands': 'error',
      '@typescript-eslint/restrict-template-expressions': 'error',
      
      // === MUTABILITY ===
      '@typescript-eslint/prefer-readonly': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      
      // === HOT PATH PERFORMANCE ===
      'no-loop-func': 'error',
      
      // === STRUCTURAL ===
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      
      // === HEAP ALLOCATION GUARD ===
      'unicorn/no-new-array': 'error',
      'unicorn/prefer-set-has': 'error',
      'no-restricted-syntax': ['error',
        {
          selector: 'ForStatement BlockStatement > ExpressionStatement > NewExpression[callee.name="Float32Array"]',
          message: 'Float32Array allocation in loop — use pre-allocated buffer (zero-alloc policy).',
        },
        {
          selector: 'FunctionDeclaration[id.name=/^(encode|reconstruct|queryTerms|wandSearch|rebuildMoments)$/] BlockStatement > ExpressionStatement > NewExpression[callee.name=/^(Map|Set)$/]',
          message: 'Heap allocation in hot path — pre-allocate or use SOA.',
        },
      ],
      
      // === ASYNC & CONCURRENCY ===
      'require-atomic-updates': 'error',
      
      // === CLEANLINESS ===
      'unicorn/no-abusive-eslint-disable': 'off',
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      'no-debugger': 'error',
      'unicorn/no-null': 'off',
      'unicorn/prevent-abbreviations': 'off',
      
      // === IMPORT ===
      'import/no-cycle': 'error',
      'import/no-self-import': 'error',
      
      // === RELAXED (domain-specific) ===
      '@typescript-eslint/prefer-readonly-parameter-types': 'off',
    },
  }
);
