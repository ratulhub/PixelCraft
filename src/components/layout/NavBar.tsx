import { Lock, Layers, Image as ImageIcon } from 'lucide-react';
import { useStore } from '../../store';

export function NavBar() {
  const currentView = useStore((s) => s.currentView);
  const setCurrentView = useStore((s) => s.setCurrentView);
  const files = useStore((s) => s.files);

  return (
    <nav className="nav">
      <div className="nav__inner">
        <button
          type="button"
          onClick={() => setCurrentView(files.length > 0 ? 'workspace' : 'home')}
          className="nav__wordmark"
        >
          Pixel<span>Craft</span>
        </button>

        <div className="nav__links">
          <button
            type="button"
            onClick={() => setCurrentView(files.length > 0 ? 'workspace' : 'home')}
            className={`nav__link ${
              currentView === 'home' || currentView === 'workspace' ? 'nav__link--active' : ''
            }`}
          >
            Workspace
          </button>

          {files.length > 1 && (
            <button
              type="button"
              onClick={() => setCurrentView('batch')}
              className={`nav__link ${currentView === 'batch' ? 'nav__link--active' : ''}`}
            >
              Batch ({files.length})
            </button>
          )}

          <button
            type="button"
            onClick={() => setCurrentView('formats')}
            className={`nav__link ${currentView === 'formats' ? 'nav__link--active' : ''}`}
          >
            Formats
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('privacy')}
            className={`nav__link ${currentView === 'privacy' ? 'nav__link--active' : ''}`}
          >
            Privacy
          </button>
        </div>

        <div className="nav__status">
          <Lock size={14} strokeWidth={1.5} />
          <span>100% local</span>
        </div>
      </div>
    </nav>
  );
}

