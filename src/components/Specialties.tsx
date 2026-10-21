import { SPECIALTIES } from '../data/site';

export default function Specialties() {
  return (
    <div className="specialties">
      {SPECIALTIES.map((s) => (
        <div className="specialty-item" key={s.title}>
          <div className="spec-icon">{s.icon}</div>
          <div className="spec-title">{s.title}</div>
          <p className="spec-desc">{s.text}</p>
        </div>
      ))}
    </div>
  );
}
