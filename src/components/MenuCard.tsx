import { useEffect, useState } from 'react';
import type { MenuItem } from '../data/menu';

type Props = { item: MenuItem; index: number };

const SWAP_MS = 3200;

export default function MenuCard({ item, index }: Props) {
  const [showAlt, setShowAlt] = useState(false);

  // Cards with a second photo crossfade between the two on their own (staggered by position).
  useEffect(() => {
    if (!item.image2) return;
    let interval: number | undefined;
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => setShowAlt((v) => !v), SWAP_MS);
    }, index * 700);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(interval);
    };
  }, [item.image2, index]);

  const wrapClass = ['card-img-wrap', item.image2 && 'has-alt', showAlt && 'show-alt'].filter(Boolean).join(' ');

  return (
    <div className="menu-card">
      <div className={wrapClass} style={item.aspect ? { aspectRatio: item.aspect } : undefined}>
        <img
          loading="lazy"
          decoding="async"
          src={item.image}
          alt={item.alt}
          style={item.objectPosition ? { objectPosition: item.objectPosition } : undefined}
        />
        {item.image2 && <img className="alt" loading="lazy" decoding="async" src={item.image2} alt="" aria-hidden="true" />}
      </div>
      <div className="card-body">
        <div className="card-name">{item.name}</div>
        <p className="card-desc">{item.description}</p>
        <div className="card-footer">
          <span className="card-price">{item.price}</span>
          <a href="#contact" className="card-order">Order →</a>
        </div>
      </div>
    </div>
  );
}
