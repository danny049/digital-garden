import { defineConfig } from 'astro/config';
import { localSignup } from './scripts/local-signup.mjs';

export default defineConfig({
  site: 'https://dannyhayder.com',
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  vite: {
    plugins: [localSignup()],
    server: { fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/.private/**', '**/*.sqlite*'] } },
  },
});
