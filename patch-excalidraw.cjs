const fs = require('fs');
const path = require('path');
const filePaths = [
    path.join(__dirname, 'node_modules', '@excalidraw', 'excalidraw', 'dist', 'prod', 'index.js'),
    path.join(__dirname, 'node_modules', '@excalidraw', 'excalidraw', 'dist', 'dev', 'index.js')
];

for (const filePath of filePaths) {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        // Safely replace the file extension only
        content = content.replace(/\.excalidraw/g, '.slate');
        
        // Safely replace specific UI strings only (avoid breaking internal React states)
        content = content.replace(/Export to Excalidraw/g, 'Export to Slate');
        content = content.replace(/Open Excalidraw file/g, 'Open Slate file');
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Patched ' + filePath);
    }
}
