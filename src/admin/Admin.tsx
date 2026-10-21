import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  TABS,
  deleteRow,
  fetchAllRows,
  insertRow,
  seedFromStatic,
  updateRow,
  uploadPhoto,
  type MenuRow,
  type MenuRowInput,
} from '../lib/menuApi';
import '../style.css';
import './admin.css';

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    document.title = 'Admin | D\'s Divine Crust';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!supabase) {
    return (
      <div className="adm">
        <div className="adm-card adm-login">
          <h1>Admin</h1>
          <p className="adm-note" style={{ marginTop: '1rem' }}>
            Supabase is not connected yet. Fill in <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in
            the <code>.env</code> file, then restart <code>npm run dev</code>. Steps are in <code>SUPABASE_SETUP.md</code>.
          </p>
        </div>
      </div>
    );
  }

  if (!ready) return null;
  return session ? <Dashboard /> : <Login />;
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error } = await supabase!.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setBusy(false);
  }

  return (
    <div className="adm">
      <form className="adm-card adm-login" onSubmit={submit}>
        <h1>Admin login</h1>
        <label htmlFor="a-email">Email</label>
        <input id="a-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
        <label htmlFor="a-pass">Password</label>
        <input id="a-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        <div className="adm-actions">
          <button className="adm-btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </div>
        {error && <p className="adm-msg err">{error}</p>}
      </form>
    </div>
  );
}

type Draft = {
  id?: string;
  tab: string;
  name: string;
  description: string;
  price: string;
  image_url: string;
  image2_url: string;
  aspect: string;
  visible: boolean;
  position: number;
};

const emptyDraft = (tab: string, position: number): Draft => ({
  tab, name: '', description: '', price: '', image_url: '', image2_url: '', aspect: '', visible: true, position,
});

function Dashboard() {
  const [rows, setRows] = useState<MenuRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await fetchAllRows());
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the menu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const nextPosition = (tab: string) => Math.max(-1, ...rows.filter((r) => r.tab === tab).map((r) => r.position)) + 1;

  async function move(row: MenuRow, dir: -1 | 1) {
    const siblings = rows.filter((r) => r.tab === row.tab);
    const i = siblings.findIndex((r) => r.id === row.id);
    const other = siblings[i + dir];
    if (!other) return;
    // Positions can tie after a bulk import, so re-number the whole tab.
    const order = siblings.map((r) => r.id);
    [order[i], order[i + dir]] = [order[i + dir], order[i]];
    await Promise.all(order.map((id, pos) => updateRow(id, { position: pos })));
    load();
  }

  async function toggleVisible(row: MenuRow) {
    await updateRow(row.id, { visible: !row.visible });
    load();
  }

  async function remove(row: MenuRow) {
    if (!window.confirm(`Delete "${row.name}"? This cannot be undone.`)) return;
    await deleteRow(row.id);
    load();
  }

  async function importCurrent() {
    if (!window.confirm('Copy the current website menu into the database?')) return;
    try {
      await seedFromStatic();
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
    }
  }

  if (draft) {
    return (
      <Editor
        draft={draft}
        onCancel={() => setDraft(null)}
        onSaved={() => {
          setDraft(null);
          load();
        }}
      />
    );
  }

  return (
    <div className="adm">
      <div className="adm-top">
        <h1>Menu admin</h1>
        <div className="adm-actions" style={{ marginTop: 0 }}>
          <a className="adm-btn" href="/admin/calc" style={{ textDecoration: 'none' }}>Costing calculator</a>
          <a className="adm-btn ghost" href="/" style={{ textDecoration: 'none' }}>View site</a>
          <button className="adm-btn ghost" onClick={() => supabase!.auth.signOut()}>Sign out</button>
        </div>
      </div>

      {error && <p className="adm-msg err">{error}</p>}
      {loading && <p className="adm-msg">Loading…</p>}

      {!loading && rows.length === 0 && (
        <div className="adm-note" style={{ marginTop: '1.5rem' }}>
          The database menu is empty, so the website is showing its built-in menu.
          <div className="adm-actions">
            <button className="adm-btn" onClick={importCurrent}>Import the current menu</button>
          </div>
        </div>
      )}

      {TABS.map((tab) => {
        const items = rows.filter((r) => r.tab === tab.id);
        return (
          <div key={tab.id}>
            <div className="adm-top">
              <h2>{tab.label}</h2>
              <button className="adm-btn small" onClick={() => setDraft(emptyDraft(tab.id, nextPosition(tab.id)))}>+ Add item</button>
            </div>
            <div className="adm-list">
              {items.length === 0 && <span style={{ color: 'var(--text-muted)' }}>No items yet.</span>}
              {items.map((r, i) => (
                <div className={r.visible ? 'adm-item' : 'adm-item hidden'} key={r.id}>
                  <img src={r.image_url} alt="" />
                  <div>
                    <strong>{r.name}</strong>
                    <span>{r.price}{r.visible ? '' : ' · hidden'}</span>
                  </div>
                  <div className="adm-item-actions">
                    <button className="adm-btn ghost small" disabled={i === 0} onClick={() => move(r, -1)} aria-label="Move up">↑</button>
                    <button className="adm-btn ghost small" disabled={i === items.length - 1} onClick={() => move(r, 1)} aria-label="Move down">↓</button>
                    <button className="adm-btn ghost small" onClick={() => toggleVisible(r)}>{r.visible ? 'Hide' : 'Show'}</button>
                    <button
                      className="adm-btn small"
                      onClick={() =>
                        setDraft({
                          id: r.id, tab: r.tab, name: r.name, description: r.description, price: r.price,
                          image_url: r.image_url, image2_url: r.image2_url ?? '', aspect: r.aspect ?? '',
                          visible: r.visible, position: r.position,
                        })
                      }
                    >
                      Edit
                    </button>
                    <button className="adm-btn danger small" onClick={() => remove(r)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Editor({ draft, onCancel, onSaved }: { draft: Draft; onCancel: () => void; onSaved: () => void }) {
  const [d, setD] = useState<Draft>(draft);
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((prev) => ({ ...prev, [k]: v }));
  const preview1 = file1 ? URL.createObjectURL(file1) : d.image_url;
  const preview2 = file2 ? URL.createObjectURL(file2) : d.image2_url;

  async function save(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!file1 && !d.image_url) {
      setError('Please choose a main photo.');
      return;
    }
    setBusy(true);
    try {
      const image_url = file1 ? await uploadPhoto(file1) : d.image_url;
      const image2_url = file2 ? await uploadPhoto(file2) : d.image2_url || null;
      const row: MenuRowInput = {
        tab: d.tab, name: d.name.trim(), description: d.description.trim(), price: d.price.trim(),
        image_url, image2_url, aspect: d.aspect || null, object_position: null,
        position: d.position, visible: d.visible,
      };
      if (d.id) await updateRow(d.id, row);
      else await insertRow(row);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
      setBusy(false);
    }
  }

  return (
    <div className="adm">
      <h1>{d.id ? 'Edit item' : 'Add item'}</h1>
      <form className="adm-card" onSubmit={save} style={{ marginTop: '1rem' }}>
        <div className="adm-row">
          <div>
            <label htmlFor="e-tab">Section</label>
            <select id="e-tab" value={d.tab} onChange={(e) => set('tab', e.target.value)}>
              {TABS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="e-price">Price</label>
            <input id="e-price" type="text" value={d.price} onChange={(e) => set('price', e.target.value)} placeholder="₹ 900 / kg" />
          </div>
        </div>
        <label htmlFor="e-name">Name</label>
        <input id="e-name" type="text" value={d.name} onChange={(e) => set('name', e.target.value)} required />
        <label htmlFor="e-desc">Description</label>
        <textarea id="e-desc" value={d.description} onChange={(e) => set('description', e.target.value)} />

        <div className="adm-photos">
          <div className="adm-photo-box">
            <label>Main photo</label>
            {preview1 && <img src={preview1} alt="" />}
            <input type="file" accept="image/*" onChange={(e) => setFile1(e.target.files?.[0] ?? null)} />
          </div>
          <div className="adm-photo-box">
            <label>Second photo (optional, fades with the first)</label>
            {preview2 && <img src={preview2} alt="" />}
            <input type="file" accept="image/*" onChange={(e) => setFile2(e.target.files?.[0] ?? null)} />
            {d.image2_url && !file2 && (
              <button type="button" className="adm-btn ghost small" style={{ marginTop: '0.4rem' }} onClick={() => set('image2_url', '')}>
                Remove second photo
              </button>
            )}
          </div>
        </div>

        <div className="adm-row">
          <div>
            <label htmlFor="e-aspect">Photo shape</label>
            <select id="e-aspect" value={d.aspect} onChange={(e) => set('aspect', e.target.value)}>
              <option value="">Square (default)</option>
              <option value="3/4">Tall (3:4)</option>
              <option value="4/3">Wide (4:3)</option>
            </select>
          </div>
          <div>
            <label htmlFor="e-vis">Show on website</label>
            <select id="e-vis" value={d.visible ? 'yes' : 'no'} onChange={(e) => set('visible', e.target.value === 'yes')}>
              <option value="yes">Yes</option>
              <option value="no">No (hidden)</option>
            </select>
          </div>
        </div>

        <div className="adm-actions">
          <button className="adm-btn" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
          <button type="button" className="adm-btn ghost" onClick={onCancel} disabled={busy}>Cancel</button>
        </div>
        {error && <p className="adm-msg err">{error}</p>}
      </form>
    </div>
  );
}
