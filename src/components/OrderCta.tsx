import { INSTAGRAM_DM_URL, WHATSAPP_ORDER_URL } from '../data/site';

export default function OrderCta() {
  return (
    <div className="order-cta">
      <div>
        <h2 className="order-cta-title">Ready to Order Something<br /><em>Delicious?</em></h2>
        <p className="order-cta-sub">
          Choose how you want to order: the website form, Instagram or WhatsApp. We'd love to bake for you!
        </p>
      </div>
      <div className="order-btns">
        <a href="#order-form" className="btn-white">Order on Website</a>
        <a href={WHATSAPP_ORDER_URL} className="btn-white" target="_blank" rel="noopener">Order on WhatsApp</a>
        <a href={INSTAGRAM_DM_URL} className="btn-white btn-ig" target="_blank" rel="noopener">Order on Instagram</a>
      </div>
    </div>
  );
}
