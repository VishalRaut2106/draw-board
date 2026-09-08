import { useState, useEffect, useRef, useCallback } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';

const STORAGE_KEY = 'slate-board-data';

function App() {
  const [initialData, setInitialData] = useState(undefined);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    let data = null;

    try {
      const savedRaw = localStorage.getItem(STORAGE_KEY);
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        // Only restore elements — do NOT restore appState in production
        // as it causes Excalidraw refs to be undefined during init
        if (parsed && Array.isArray(parsed.elements)) {
          data = {
            elements: parsed.elements,
            appState: {
              viewBackgroundColor: '#121212',
              theme: 'dark',
            },
          };
        }
      }
    } catch (e) {
      console.warn('Could not load saved data:', e);
    }

    // If no saved data, set defaults
    setInitialData(
      data ?? {
        elements: [],
        appState: {
          viewBackgroundColor: '#121212',
          theme: 'dark',
        },
      }
    );
  }, []);

  const handleChange = useCallback((elements, appState) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            elements,
            // Save minimal appState only
            appState: {
              theme: appState.theme,
              viewBackgroundColor: appState.viewBackgroundColor,
            },
          })
        );
      } catch (e) {
        console.warn('Could not save data:', e);
      }
    }, 500);
  }, []);

  // Don't render Excalidraw until initialData is ready
  if (initialData === undefined) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#121212',
          color: '#fff',
          fontFamily: 'Inter, sans-serif',
          fontSize: '1.1rem',
        }}
      >
        Loading Slate...
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
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
            export: { saveFileToDisk: true },
          },
        }}
      />
    </div>
  );
}

export default App;
