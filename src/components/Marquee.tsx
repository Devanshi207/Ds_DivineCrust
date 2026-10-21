import { MARQUEE_ITEMS } from '../data/site';

// Four copies so the strip never shows a gap on wide screens; the CSS animation slides it by half.
const COPIES = 4;

export default function Marquee() {
  return (
    <div className="marquee-section">
      <div className="marquee-track">
        {Array.from({ length: COPIES }).flatMap((_, c) =>
          MARQUEE_ITEMS.map((text) => (
            <span className="marquee-item" key={`${c}-${text}`} aria-hidden={c > 0}>
              {text} <span className="marquee-dot" />
            </span>
          )),
        )}
      </div>
    </div>
  );
}
