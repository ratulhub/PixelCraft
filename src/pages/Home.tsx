import { DropZone } from '../components/upload/DropZone';
import { FormatRail } from '../components/upload/FormatRail';

export function Home() {
  return (
    <main className="home">
      <section className="home__hero">
        <p className="type-eyebrow">Universal image utility</p>
        <h1 className="type-display">
          Any image. Any format.<br />
          <em className="home__hero-em">Your metadata rules.</em>
        </h1>
        <p className="type-body home__hero-sub">
          Convert RAW, HEIC, JXL, and more — locally, with a clear
          metadata report and pixel-path control. No uploads. No account.
        </p>
      </section>

      <DropZone />
      <FormatRail />
    </main>
  );
}

