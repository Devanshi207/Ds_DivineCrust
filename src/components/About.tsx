export default function About() {
  return (
    <section className="about" id="about">
      <div className="about-image-wrap">
        <img className="about-img-main" src="/cakes/rose-ribbon-tier.jpg" alt="Two-tier rose ribbon cake by D's Divine Crust" />
        <img className="about-img-accent" src="/cakes/checkerboard-cake.jpg" alt="Checkerboard cake with cream rosettes" />
        <div className="about-badge">Baked<br />Fresh<br />Daily ✦</div>
      </div>
      <div className="about-content">
        <span className="section-label">Our Story</span>
        <h2 className="section-title">
          A Home Kitchen<br />Filled with <em>Warmth</em>
        </h2>
        <p>
          D's Divine Crust was born out of a simple love for baking and a desire to share that joy with everyone around us. What started as weekend experiments and family celebrations has grown into a beloved home bakery right here in Surat.
        </p>
        <p>
          Every cake we bake is made fresh to order, no preservatives, no shortcuts. We use only quality ingredients and pour genuine care into every layer, swirl, and garnish. Whether it's a birthday, anniversary, or just a sweet Tuesday, we believe every occasion deserves something truly special.
        </p>
        <p>
          From classic marble cakes and checkerboard creations to custom celebration cakes and fruit-studded muffins, our menu is baked with love and delivered with a smile.
        </p>
        <a href="#menu" className="btn-primary" style={{ display: 'inline-block', marginTop: '1rem' }}>See Our Menu</a>
      </div>
    </section>
  );
}
