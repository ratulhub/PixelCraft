import { useStore } from '../store';
import { Home } from '../pages/Home';
import { Workspace } from '../components/workspace/Workspace';
import { BatchResults } from '../components/batch/BatchResults';
import { Formats } from '../pages/Formats';
import { Privacy } from '../pages/Privacy';

export function AppRouter() {
  const currentView = useStore((s) => s.currentView);
  const files = useStore((s) => s.files);

  if (currentView === 'formats') {
    return <Formats />;
  }

  if (currentView === 'privacy') {
    return <Privacy />;
  }

  if (files.length === 0) {
    return <Home />;
  }

  if (currentView === 'batch') {
    return <BatchResults />;
  }

  return <Workspace />;
}

