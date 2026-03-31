import { defineConfig, globalIgnores } from 'eslint/config'

 
const eslintConfig = defineConfig([
  {
    rules: {
      'react/no-unescaped-entities': 'off',
      '@next/next/no-page-custom-font': 'off',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
   
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
])
 
export default eslintConfig