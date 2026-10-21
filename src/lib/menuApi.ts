import { menu as staticMenu, type MenuItem, type MenuTab } from '../data/menu';
import { BUCKET, supabase } from './supabase';

export type MenuRow = {
  id: string;
  tab: string;
  name: string;
  description: string;
  price: string;
  image_url: string;
  image2_url: string | null;
  aspect: string | null;
  object_position: string | null;
  position: number;
  visible: boolean;
};

export type MenuRowInput = Omit<MenuRow, 'id'>;

export const TABS = staticMenu.map(({ id, label }) => ({ id, label }));

function rowToItem(r: MenuRow): MenuItem {
  return {
    name: r.name,
    description: r.description,
    price: r.price,
    image: r.image_url,
    image2: r.image2_url ?? undefined,
    alt: r.name,
    aspect: r.aspect ?? undefined,
    objectPosition: r.object_position ?? undefined,
  };
}

/** Public menu: visible items grouped by tab. Returns null if Supabase is off, empty or fails. */
export async function fetchPublicMenu(): Promise<MenuTab[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('visible', true)
    .order('position')
    .order('created_at');
  if (error || !data || data.length === 0) return null;
  const rows = data as MenuRow[];
  return TABS.map((t) => ({
    ...t,
    items: rows.filter((r) => r.tab === t.id).map(rowToItem),
  })).filter((t) => t.items.length > 0);
}

export async function fetchAllRows(): Promise<MenuRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('menu_items').select('*').order('position').order('created_at');
  if (error) throw error;
  return (data ?? []) as MenuRow[];
}

export async function insertRow(row: MenuRowInput) {
  const { error } = await supabase!.from('menu_items').insert(row);
  if (error) throw error;
}

export async function updateRow(id: string, patch: Partial<MenuRowInput>) {
  const { error } = await supabase!.from('menu_items').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteRow(id: string) {
  const { error } = await supabase!.from('menu_items').delete().eq('id', id);
  if (error) throw error;
}

/** Copies the built-in menu into the database (used once, from the admin page). */
export async function seedFromStatic() {
  const rows: MenuRowInput[] = staticMenu.flatMap((t) =>
    t.items.map((it, i) => ({
      tab: t.id,
      name: it.name,
      description: it.description,
      price: it.price,
      image_url: it.image,
      image2_url: it.image2 ?? null,
      aspect: it.aspect ?? null,
      object_position: it.objectPosition ?? null,
      position: i,
      visible: true,
    })),
  );
  const { error } = await supabase!.from('menu_items').insert(rows);
  if (error) throw error;
}

/** Shrinks a photo to at most 1200px wide and saves it as WebP, so pages stay fast. */
async function toWebp(file: File, maxWidth = 1200): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bmp.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not convert the photo'))), 'image/webp', 0.85),
  );
}

/** Uploads a photo to Supabase Storage and returns its public URL. */
export async function uploadPhoto(file: File): Promise<string> {
  const blob = await toWebp(file);
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
  const { error } = await supabase!.storage.from(BUCKET).upload(path, blob, {
    contentType: 'image/webp',
    cacheControl: '31536000',
  });
  if (error) throw error;
  return supabase!.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
