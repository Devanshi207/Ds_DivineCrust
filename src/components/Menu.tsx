import { useState } from 'react';
import { useMenu } from '../lib/useMenu';
import MenuCard from './MenuCard';

export default function Menu() {
  const menu = useMenu();
  const [activeId, setActiveId] = useState(menu[0].id);
  const active = menu.find((t) => t.id === activeId) ?? menu[0];

  return (
    <section className="menu" id="menu">
      <div className="menu-header">
        <div>
          <span className="section-label">What We Bake</span>
          <h2 className="section-title">Our <em>Menu</em></h2>
        </div>
      </div>

      <div className="menu-tabs" role="tablist">
        {menu.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={tab.id === active.id}
            className={tab.id === active.id ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setActiveId(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content active" key={active.id}>
        <div className="menu-grid">
          {active.items.map((item, i) => (
            <MenuCard key={`${item.name}-${i}`} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
