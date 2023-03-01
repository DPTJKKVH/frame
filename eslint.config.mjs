import ts from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import prettier from 'eslint-config-prettier'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import testingLibrary from 'eslint-plugin-testing-library'
import jest from 'eslint-plugin-jest'
import globals from 'globals'

export default [
  'eslint:recommended',
  // All files
  {
    files: ['**/*.{js,mjs,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.es6
      }
    },
    rules: {
      ...prettier.rules,
      'no-unused-vars': ['error', { ignoreRestSiblings: true, destructuredArrayIgnorePattern: '^_' }]
    }
  },
  // Main process files and scripts
  {
    files: ['**/*.{js,mjs,ts}'],
    ignores: ['app/**/*', 'resources/Components/**/*'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },
  // TS files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { modules: true },
        ecmaVersion: 'latest',
        project: './tsconfig.json'
      }
    },
    plugins: {
      '@typescript-eslint': ts
    },
    rules: {
      ...ts.configs['eslint-recommended'].rules,
      ...ts.configs.recommended.rules,
      'no-undef': 'off' // redundant - TS will fail to compile with undefined vars
    }
  },
  // React / JSX files
  {
    files: [
      'app/**/*.js',
      'resources/Components/**/*.js',
      'resources/svg/index.js',
      'test/app/**/*.js',
      'test/resources/Components/**/*.js',
      'test/jest.svg.js'
    ],
    plugins: {
      react,
      'react-hooks': reactHooks
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/prop-types': 'off' // all type checking to be done in TS
    }
  },
  // Renderer process files
  {
    files: [
      'app/**/*.js',
      'resources/**/*.{js,ts,tsx}',
      'test/app/**/*.js',
      'test/resources/Components/**/*.js'
    ],
    languageOptions: {
      globals: {
        ...globals.browser
      }
    }
  },
  // Test files
  {
    files: ['test/**/*', '**/__mocks__/**/*'],
    plugins: {
      jest
    },
    languageOptions: {
      globals: {
        ...globals.jest
      }
    }
    // TODO: enable jest rules
    // rules: {
    //   ...jest.configs.recommended.rules
    // }
  },
  // Components test files
  {
    files: ['test/app/**/*.js', 'test/resources/Components/**/*.js', 'app/**/__mocks__/**'],
    plugins: {
      'testing-library': testingLibrary
    },
    rules: {
      ...testingLibrary.configs.react.rules
    }
  }
]
