import './style.css';

const WHATSAPP = '917573973151';

// Menu tabs (event delegation, no inline handlers)
const tabs = document.querySelector('.menu-tabs');
tabs?.addEventListener('click', (e) => {
  const btn = e.target.closest('.tab-btn');
  if (!btn) return;
  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
  document.querySelectorAll('.tab-content').forEach((t) =>
    t.classList.toggle('active', t.id === `tab-${btn.dataset.tab}`)
  );
});

// Order form -> opens a prefilled WhatsApp message
document.getElementById('order-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.currentTarget));
  const text = [
    `Hi! I'd like to place an order from D's Divine Crust.`,
    `Name: ${d.name}`,
    `Phone: ${d.phone}`,
    `Looking for: ${d.item}`,
    `Date: ${d.date || 'not decided'}`,
    `Serves: ${d.serves}`,
    d.notes && `Notes: ${d.notes}`,
  ].filter(Boolean).join('\n');
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
});

// Fade nav background shadow on scroll
const nav = document.querySelector('nav');
addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 10), { passive: true });

// Cards with two photos: crossfade automatically (staggered); hovering shows the second photo right away
document.querySelectorAll('.card-img-wrap.has-alt').forEach((w, i) => {
  setTimeout(() => setInterval(() => w.classList.toggle('show-alt'), 3200), i * 700);
});
