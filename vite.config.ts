import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The repository-root HTML is also the entry point for branch-based GitHub
// Pages deployments. It points at committed production assets in /docs so it
// works on both github.io and a custom domain without running a Vite server.
// Replace those tags only when Vite serves or builds the source application.
function viteSourceEntry(): Plugin {
  const staticStylesheet = '<link data-pages-static rel="stylesheet" href="./docs/assets/app-bundle.css" />';
  const staticScript = '<script data-pages-static type="module" src="./docs/assets/app-bundle.js"></script>';
  return {
    name: 'tank-vite-source-entry',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html
          .replace(`    ${staticStylesheet}\n`, '')
          .replace(staticScript, '<script type="module" src="/src/main.tsx"></script>');
      },
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [viteSourceEntry(), react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'assets/app-bundle.js',
        assetFileNames: 'assets/app-bundle.[ext]',
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    cors: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  },
});
