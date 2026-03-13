import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });
const config = [
  { ignores: ['coverage/**', '.next/**', 'node_modules/**'] },
  ...compat.config({ extends: ['next/core-web-vitals'] }),
];

export default config;
