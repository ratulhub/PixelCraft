import { PageShell } from '../components/layout/PageShell';
import { AppRouter } from './router';

export function App() {
  return (
    <PageShell>
      <AppRouter />
    </PageShell>
  );
}

export default App;

