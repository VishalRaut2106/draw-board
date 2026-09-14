import { useState, useEffect, useRef, useCallback } from 'react';
import { Excalidraw, MainMenu, WelcomeScreen } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';

const STORAGE_KEY = 'slate-board-data';
const GITHUB_URL = 'https://github.com/VishalRaut2106/draw-board';
const PORTFOLIO_URL = 'https://vishalraut.me';

/* ─── icons ─────────────────────────────────────────────────────────────── */
const GithubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

const GlobeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

/* ─── hide library sidebar button via CSS injection ─────────────────────── */
const HIDE_LIBRARY_CSS = `
  .layer-ui__wrapper .layer-ui__library,
  button[aria-label="Library"],
  .ToolIcon[data-testid="toolbar-libraries"] {
    display: none !important;
  }
`;

function App() {
  const [initialData, setInitialData] = useState(undefined);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    let data = null;
    try {
      const savedRaw = localStorage.getItem(STORAGE_KEY);
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
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
        Loading Slate…
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      {/* Inject CSS to hide library button */}
      <style>{HIDE_LIBRARY_CSS}</style>

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
      >
        {/* ── Custom menu: only useful items + personal links ── */}
        <MainMenu>
          <MainMenu.DefaultItems.LoadScene />
          <MainMenu.DefaultItems.SaveToActiveFile />
          <MainMenu.DefaultItems.Export />
          <MainMenu.DefaultItems.SaveAsImage />
          <MainMenu.Separator />
          <MainMenu.DefaultItems.ToggleTheme />
          <MainMenu.DefaultItems.ChangeCanvasBackground />
          <MainMenu.Separator />
          <MainMenu.Item
            icon={<GithubIcon />}
            onSelect={() => window.open(GITHUB_URL, '_blank')}
          >
            GitHub — draw-board
          </MainMenu.Item>
          <MainMenu.Item
            icon={<GlobeIcon />}
            onSelect={() => window.open(PORTFOLIO_URL, '_blank')}
          >
            vishalraut.me
          </MainMenu.Item>
        </MainMenu>

        {/* ── Welcome screen: personal Slate branding ── */}
        <WelcomeScreen>
          <WelcomeScreen.Hints.MenuHint />
          <WelcomeScreen.Hints.ToolbarHint />
          <WelcomeScreen.Hints.HelpHint />
          <WelcomeScreen.Center>
            <WelcomeScreen.Center.Logo>
              <span
                style={{
                  fontSize: '2.4rem',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  background: 'linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                Slate
              </span>
            </WelcomeScreen.Center.Logo>
            <WelcomeScreen.Center.Heading>
              Your personal whiteboard.
            </WelcomeScreen.Center.Heading>
            <WelcomeScreen.Center.Menu>
              <WelcomeScreen.Center.MenuItemLoadScene />
              <WelcomeScreen.Center.MenuItemHelp />
            </WelcomeScreen.Center.Menu>
          </WelcomeScreen.Center>
        </WelcomeScreen>
      </Excalidraw>
    </div>
  );
}

export default App;
