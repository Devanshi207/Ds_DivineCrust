const BADGES = [
  { value: '100%', label: 'Home-made' },
  { value: 'Fresh', label: 'Made to Order' },
  { value: 'Custom', label: 'Designs Available' },
];

export default function Hero() {
  return (
    <section className="hero" id="home" style={{ padding: 0 }}>
      <div className="hero-left">
        <span className="hero-tag">Home Bakery · Surat</span>
        <h1 className="hero-title">
          Baked with<br />Love &amp; <em>Soul</em>
        </h1>
        <p className="hero-desc">
          Every cake, every bite, crafted fresh from our home kitchen with premium ingredients and a whole lot of heart.
        </p>
        <div className="hero-buttons">
          <a href="#menu" className="btn-primary">Explore Menu</a>
          <a href="#contact" className="btn-outline">Place an Order</a>
        </div>
        <div className="hero-badges">
          {BADGES.map((b) => (
            <div className="badge-item" key={b.label}>
              <strong>{b.value}</strong>
              <span>{b.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="hero-right">
        <img className="hero-sticker" src="/sticker-brand.png" alt="D's Divine Crust logo" fetchPriority="high" />
      </div>
    </section>
  );
}
