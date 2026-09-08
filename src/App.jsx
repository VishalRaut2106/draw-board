import { useState, useEffect, useRef } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';

function App() {
  const [isClient, setIsClient] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    // Attempt to load previously saved data from LocalStorage
    const savedData = localStorage.getItem('draw-board-data');
    let parsedData = null;
    if (savedData) {
      try {
        parsedData = JSON.parse(savedData);
      } catch (e) {
        console.error("Failed to parse saved board data");
      }
    }

    if (parsedData) {
      setInitialData(parsedData);
    } else {
      setInitialData({
        appState: { 
          viewBackgroundColor: "#121212", 
          theme: "dark",
          currentItemStrokeColor: "#ffffff",
        }
      });
    }

    setIsClient(true);
  }, []);

  const handleChange = (elements, appState) => {
    // Debounce the save operation to avoid freezing the browser while drawing
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      // Only save the necessary state (elements and basic theme settings)
      const dataToSave = {
        elements,
        appState: {
          theme: appState.theme,
          viewBackgroundColor: appState.viewBackgroundColor,
        }
      };
      localStorage.setItem('draw-board-data', JSON.stringify(dataToSave));
    }, 500); // Save half a second after they stop drawing
  };

  if (!isClient || !initialData) {
    return <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>Loading Whiteboard...</div>;
  }

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      <Excalidraw 
        initialData={initialData}
        onChange={handleChange}
        UIOptions={{
          canvasActions: {
            changeViewBackgroundColor: true,
            clearCanvas: true,
            loadScene: true,
            saveToActiveFile: true,
            toggleTheme: true,
            saveAsImage: true,
            export: { saveFileToDisk: true }
          }
        }}
      />
      
      {/* Custom GitHub Link */}
      <a 
        href="https://github.com/VishalRaut2106/draw-board" 
        target="_blank" 
        rel="noopener noreferrer"
        style={{
          position: "absolute",
          bottom: "1.5rem",
          right: "1.5rem",
          backgroundColor: "#1a1a1a",
          color: "#fff",
          padding: "0.5rem 1rem",
          borderRadius: "8px",
          textDecoration: "none",
          fontFamily: "system-ui, sans-serif",
          fontSize: "0.875rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          zIndex: 10,
          border: "1px solid #333"
        }}
      >
        <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.46-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
        </svg>
        GitHub Repo
      </a>

    </div>
  );
}

export default App;
