const fs = require('fs');
const path = require('path');
const filePaths = [
    path.join(__dirname, 'node_modules', '@excalidraw', 'excalidraw', 'dist', 'prod', 'index.js'),
    path.join(__dirname, 'node_modules', '@excalidraw', 'excalidraw', 'dist', 'dev', 'index.js')
];

for (const filePath of filePaths) {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        content = content.replace(/\.excalidraw/g, '.slate');
        content = content.replace(/"Excalidraw"/g, '"Slate"');
        content = content.replace(/Export to Excalidraw/g, 'Export to Slate');
        content = content.replace(/Open Excalidraw file/g, 'Open Slate file');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Patched ' + filePath);
    }
}
