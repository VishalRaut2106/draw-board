import { useState, useEffect, useRef } from 'react';
import { Excalidraw, MainMenu } from '@excalidraw/excalidraw';
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
      >
        <MainMenu>
          <MainMenu.DefaultItems.LoadScene />
          <MainMenu.DefaultItems.SaveToActiveFile />
          <MainMenu.DefaultItems.Export />
          <MainMenu.DefaultItems.SaveAsImage />
          <MainMenu.DefaultItems.Help />
          <MainMenu.DefaultItems.ClearCanvas />
          <MainMenu.Separator />
          <MainMenu.Group title="Slate links">
            <MainMenu.ItemLink href="https://github.com/VishalRaut2106/draw-board">
              Slate
            </MainMenu.ItemLink>
          </MainMenu.Group>
          <MainMenu.Separator />
          <MainMenu.DefaultItems.ToggleTheme />
          <MainMenu.DefaultItems.ChangeCanvasBackground />
        </MainMenu>
      </Excalidraw>
    </div>
  );
}

export default App;
