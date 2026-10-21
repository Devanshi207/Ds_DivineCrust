import { INSTAGRAM_URL, PHONE_DISPLAY, PHONE_E164, WHATSAPP_URL } from '../data/site';

export default function Footer() {
  return (
    <>
      <footer>
        <div className="footer-brand">
          <div className="brand-name">D's <span>Divine</span> Crust</div>
          <p>A home bakery in Surat, crafting fresh, made-to-order cakes and bakes with love since our very first batch.</p>
        </div>
        <div className="footer-col">
          <h4>Menu</h4>
          <ul>
            <li><a href="#menu">Signature Cakes</a></li>
            <li><a href="#menu">Birthday Cakes</a></li>
            <li><a href="#menu">Fruit Cakes</a></li>
            <li><a href="#menu">Muffins</a></li>
            <li><a href="#menu">Custom Orders</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Information</h4>
          <ul>
            <li><a href="#about">About Us</a></li>
            <li><a href="#contact">Contact</a></li>
            <li><a href="#contact">Order Now</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Contact</h4>
          <ul>
            <li><a href={`tel:+${PHONE_E164}`}>{PHONE_DISPLAY}</a></li>
            <li><a href={INSTAGRAM_URL} target="_blank" rel="noopener">Instagram</a></li>
            <li><a href={WHATSAPP_URL} target="_blank" rel="noopener">WhatsApp</a></li>
          </ul>
        </div>
      </footer>
      <div className="footer-bottom">
        <span>© 2026 D's Divine Crust · All Rights Reserved · Surat, India</span>
        <span>Made with 🧁 and love</span>
      </div>
    </>
  );
}
