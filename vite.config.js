import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'url'

// ─── Slate Branding Plugin ─────────────────────────────────────────────────
// Transforms Excalidraw source *during* the Vite build — no postinstall needed,
// no npm-cache issues, no risk of corrupting JS identifiers.
function slateBrandingPlugin() {
  const excalidrawRE = /node_modules[/\\]@excalidraw[/\\]/;

  const replacements = [
    // ── DEFENSIVE FIX ─────────────────────────────────────────────────────
    // Vercel caches node_modules between builds. An old broken postinstall
    // ran /\.excalidraw/g which accidentally renamed property ACCESSES like
    // `.excalidrawContainerRef` → `.slateContainerRef` but LEFT the createRef()
    // declaration as `excalidrawContainerRef` → crash (ref is undefined).
    // These two lines restore the originals so the build is safe regardless
    // of whether Vercel's cache is clean or corrupt.
    [/\bslateContainerRef\b/g,         'excalidrawContainerRef'],
    [/\bslateContainerValue\b/g,        'excalidrawContainerValue'],
    // ──────────────────────────────────────────────────────────────────────

    // File-extension strings: use \b so we match ".excalidraw" (followed by
    // a non-word char like " or , or )) but NOT ".excalidrawContainerRef" etc.
    [/\.excalidraw\b/g,               '.slate'],

    // Specific visible UI label strings (exact, case-sensitive)
    ['Export to Excalidraw',           'Export to Slate'],
    ['Open Excalidraw file',           'Open Slate file'],
    ['Save as Excalidraw file',        'Save as Slate file'],
    ['Excalidraw file',                'Slate file'],
    ['Welcome to Excalidraw',          'Welcome to Slate'],
    ['Made with Excalidraw',           'Made with Slate'],
    ['Excalidraw+',                    'Slate+'],
    ['https://excalidraw.com',         'https://draw.vishalraut.me'],
  ];


  return {
    name: 'slate-branding',
    transform(code, id) {
      if (!excalidrawRE.test(id)) return null;

      let out = code;
      for (const [from, to] of replacements) {
        out = out.replace(
          from instanceof RegExp
            ? from
            : new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          to
        );
      }
      return out === code ? null : { code: out, map: null };
    },
  };
}
// ──────────────────────────────────────────────────────────────────────────

export default defineConfig({
  plugins: [react(), slateBrandingPlugin()],
  define: {
    'process.env': {
      NODE_ENV: 'production',
      IS_PREACT: 'false',
    },
  },
  resolve: {
    alias: [
      {
        // Force the WORKING dev bundle — the prod bundle has a class-field
        // initialization bug that crashes in production Rolldown builds.
        // Regex with $ so only the exact import is aliased, not sub-paths.
        find: /^@excalidraw\/excalidraw$/,
        replacement: fileURLToPath(
          new URL('./node_modules/@excalidraw/excalidraw/dist/dev/index.js', import.meta.url)
        ),
      },
    ],
  },
})

