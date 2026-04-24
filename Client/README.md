# Client

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh

- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc/README.md) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top level `parserOptions` property like this:

```js
export default [
  // ...
  {
    languageOptions: {
      // ...
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: ['./tsconfig.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
]
```

- Replace `tsconfig.json` with a TypeScript configuration that you want to use for linting

- Add the TypeScript ESLint parser

```js
// npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'

export default [
  // ...
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
    },
  },
]
```

## Getting Started

First, run the development server:

```bash
npm run dev
```

Then, open your browser to [http://localhost:5173](http://localhost:5173).

You can start editing the page by modifying `src/App.jsx`. The page will reload automatically when you make changes.

To build for production:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```