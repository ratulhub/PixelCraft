import React from 'react';
import { NavBar } from './NavBar';
import { Footer } from './Footer';

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-shell">
      <NavBar />
      <div className="page-shell__content">{children}</div>
      <Footer />
    </div>
  );
}

