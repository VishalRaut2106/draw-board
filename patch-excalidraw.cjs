const fs = require('fs');
const path = require('path');

const filePaths = [
    path.join(__dirname, 'node_modules', '@excalidraw', 'excalidraw', 'dist', 'prod', 'index.js'),
    path.join(__dirname, 'node_modules', '@excalidraw', 'excalidraw', 'dist', 'dev', 'index.js'),
];

// Safe UI-only string replacements.
// NEVER replace JS identifiers — only human-visible display text.
// NOTE: use \b word boundary on .excalidraw so we only match file extensions
//       like '.excalidraw"' and NOT property accesses like '.excalidrawContainerRef'
const replacements = [
    // File extension in save/load dialogs — \b ensures we don't match property names
    [/\.excalidraw\b/g, '.slate'],

    // Known UI label strings (exact, case-sensitive)
    ['Export to Excalidraw',      'Export to Slate'],
    ['Open Excalidraw file',      'Open Slate file'],
    ['Save as Excalidraw file',   'Save as Slate file'],
    ['Excalidraw file',           'Slate file'],
    ['Welcome to Excalidraw',     'Welcome to Slate'],
    ['Made with Excalidraw',      'Made with Slate'],
    ['Excalidraw+',               'Slate+'],

    // External URLs in UI text / aria labels (not in code logic)
    ['https://excalidraw.com',    'https://draw.vishalraut.me'],
];

for (const filePath of filePaths) {
    if (!fs.existsSync(filePath)) {
        console.warn('Not found, skipping:', filePath);
        continue;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    for (const [from, to] of replacements) {
        content = content.replace(from instanceof RegExp ? from : new RegExp(escapeRegex(from), 'g'), to);
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Patched:', path.basename(path.dirname(filePath)) + '/' + path.basename(filePath));
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
