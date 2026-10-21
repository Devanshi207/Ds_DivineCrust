import { useEffect, useState } from 'react';
import { menu as staticMenu, type MenuTab } from '../data/menu';
import { fetchPublicMenu } from './menuApi';

/** Built-in menu first (instant), replaced by the live Supabase menu when it is available. */
export function useMenu(): MenuTab[] {
  const [tabs, setTabs] = useState<MenuTab[]>(staticMenu);

  useEffect(() => {
    let cancelled = false;
    fetchPublicMenu()
      .then((live) => {
        if (!cancelled && live) setTabs(live);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return tabs;
}
