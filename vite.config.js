import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// ─── Slate Branding Plugin ─────────────────────────────────────────────────
// Transforms Excalidraw source *during* the Vite build — no postinstall needed,
// no npm-cache issues, no risk of corrupting JS identifiers.
function slateBrandingPlugin() {
  const excalidrawRE = /node_modules[/\\]@excalidraw[/\\]/;

  const replacements = [
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
    // Runs during both dev-server transforms AND production Rolldown bundling
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
})
