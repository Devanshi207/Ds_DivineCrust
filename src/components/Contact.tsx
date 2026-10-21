import type { FormEvent } from 'react';
import {
  INSTAGRAM_URL,
  ORDER_ITEM_OPTIONS,
  PHONE_DISPLAY,
  PHONE_E164,
  SERVES_OPTIONS,
  WHATSAPP_URL,
} from '../data/site';

const iconProps = {
  viewBox: '0 0 24 24',
  width: 20,
  height: 20,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

function InstagramIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="0.6" fill="currentColor" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg {...iconProps}>
      <path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.4-4.3a8.5 8.5 0 1 1 15.6-4.5z" />
      <path d="M9.2 8.4c-.3.5-.5 1.2-.1 2.1.7 1.7 2.1 3.2 3.9 3.9.9.4 1.6.1 2.1-.3l.4-.8-1.9-1-.8.6a3.4 3.4 0 0 1-1.9-1.9l.6-.8-1-1.9-.8.3z" />
    </svg>
  );
}

// The enquiry form opens WhatsApp with the details already filled in.
function sendToWhatsApp(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
  const text = [
    "Hi! I'd like to place an order from D's Divine Crust.",
    `Name: ${d.name}`,
    `Phone: ${d.phone}`,
    `Looking for: ${d.item}`,
    `Date: ${d.date || 'not decided'}`,
    `Serves: ${d.serves || 'not sure'}`,
    d.notes && `Notes: ${d.notes}`,
  ]
    .filter(Boolean)
    .join('\n');
  window.open(`${WHATSAPP_URL}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
}

export default function Contact() {
  return (
    <section className="contact" id="contact">
      <div className="contact-info">
        <span className="section-label">Get in Touch</span>
        <h2>Let's Bake <em>Something<br />Special</em> Together</h2>
        <p>
          Planning a birthday, a celebration or just a sweet treat? Message us to place an order or to talk through a custom cake. We usually reply within a few hours.
        </p>

        <div className="contact-detail">
          <div className="contact-icon">📱</div>
          <div className="contact-detail-text">
            <strong>WhatsApp / Call</strong>
            <a href={`tel:+${PHONE_E164}`}>{PHONE_DISPLAY}</a>
          </div>
        </div>

        <div className="contact-detail">
          <div className="contact-icon">📍</div>
          <div className="contact-detail-text">
            <strong>Location</strong>
            <span>Surat, Gujarat, India<br />Home delivery available within city</span>
          </div>
        </div>

        <div className="contact-detail">
          <div className="contact-icon">🕐</div>
          <div className="contact-detail-text">
            <strong>Order Lead Time</strong>
            <span>Minimum 24 hrs for standard orders<br />48–72 hrs for custom cakes</span>
          </div>
        </div>

        <div className="social-row">
          <a href={INSTAGRAM_URL} className="social-btn" title="Instagram" aria-label="Instagram" target="_blank" rel="noopener">
            <InstagramIcon />
          </a>
          <a href={WHATSAPP_URL} className="social-btn" title="WhatsApp" aria-label="WhatsApp" target="_blank" rel="noopener">
            <WhatsAppIcon />
          </a>
        </div>
      </div>

      <form className="contact-form" id="order-form" onSubmit={sendToWhatsApp}>
        <h3>Place an Order</h3>
        <p>Fill in the details below and we'll get back to you shortly.</p>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="f-name">Your Name</label>
            <input id="f-name" name="name" type="text" required />
          </div>
          <div className="form-group">
            <label htmlFor="f-phone">Phone / WhatsApp</label>
            <input id="f-phone" name="phone" type="tel" required />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="f-item">What are you looking for?</label>
          <select id="f-item" name="item" required defaultValue="">
            <option value="" disabled>Select</option>
            {ORDER_ITEM_OPTIONS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="f-date">Occasion Date</label>
            <input id="f-date" name="date" type="date" />
          </div>
          <div className="form-group">
            <label htmlFor="f-serves">Serves (approx.)</label>
            <select id="f-serves" name="serves" defaultValue="">
              <option value="" disabled>Select</option>
              {SERVES_OPTIONS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="f-notes">Tell us more</label>
          <textarea id="f-notes" name="notes" />
        </div>
        <button className="btn-submit" type="submit">Send Enquiry</button>
      </form>
    </section>
  );
}
