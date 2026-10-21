// Costing calculator data layer, stored in Supabase (replaces the old Express + MongoDB server).
// Each record is saved as { id, data (JSON), created_at, updated_at } so the screens keep the same object shape.
import { supabase } from '../../../lib/supabase';
import { demoIngredients, demoPackaging, demoRecipes, demoCalculations } from './demoData';

const T = {
  ingredients: 'calc_ingredients',
  recipes: 'calc_recipes',
  packaging: 'calc_packaging',
  calculations: 'calc_calculations',
  settings: 'calc_settings',
};

const DEFAULT_SETTINGS = { profitMargin: 40, wastagePercentage: 5, labourRate: 100, overheadPercentage: 5 };

const client = () => {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
};

const fromRow = (r) => ({ ...r.data, id: r.id, createdAt: r.created_at, updatedAt: r.updated_at });
const newId = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 11)}`;
const check = ({ data, error }) => {
  if (error) throw error;
  return data;
};

// Strips fields that belong to the row itself (or to the old MongoDB export) before saving as JSON.
const toData = (obj) => {
  // eslint-disable-next-line no-unused-vars
  const { id, createdAt, updatedAt, _id, __v, ...rest } = obj;
  return rest;
};

async function listTable(table) {
  const rows = check(await client().from(table).select('*'));
  return rows.map(fromRow);
}

async function saveRow(table, obj) {
  const row = check(
    await client()
      .from(table)
      .upsert({ id: obj.id, data: toData(obj), updated_at: new Date().toISOString() })
      .select()
      .single(),
  );
  return fromRow(row);
}

async function removeRow(table, id) {
  check(await client().from(table).delete().eq('id', id));
  return { success: true };
}

const byName = (a, b) => String(a.name).localeCompare(String(b.name));

// Unit calculations helper (synchronous)
export const getUnitCost = (price, quantity, unit) => {
  const p = parseFloat(price) || 0;
  const q = parseFloat(quantity) || 0;
  if (p <= 0 || q <= 0) return 0;

  if (unit === 'kg') {
    return p / (q * 1000); // cost per gram
  } else if (unit === 'litre') {
    return p / (q * 1000); // cost per ml
  }
  return p / q; // cost per unit
};

export const getBaseUnit = (unit) => {
  if (unit === 'kg' || unit === 'g') return 'g';
  if (unit === 'litre' || unit === 'ml') return 'ml';
  if (unit === 'piece') return 'piece';
  if (unit === 'pack') return 'pack';
  return unit;
};

// Recalculates every recipe's cost from the current ingredient prices.
export const recalculateAllRecipes = async () => {
  const [ingredients, recipes] = await Promise.all([listTable(T.ingredients), listTable(T.recipes)]);
  const ingMap = new Map(ingredients.map((i) => [i.id, i]));
  if (recipes.length === 0) return true;

  const updated = recipes.map((recipe) => {
    let totalCost = 0;
    let totalWeight = 0;

    const items = (recipe.items || []).map((item) => {
      const ing = ingMap.get(item.ingredientId);
      const itemCost = ing ? ing.costPerUnit * item.quantity : 0;
      if (item.unit === 'g' || item.unit === 'ml') totalWeight += item.quantity;
      return {
        ingredientId: item.ingredientId,
        quantity: item.quantity,
        unit: item.unit,
        calculatedCost: parseFloat(itemCost.toFixed(2)),
      };
    });
    items.forEach((item) => {
      totalCost += item.calculatedCost;
    });

    const finishedYield = parseFloat(recipe.finishedYield) || totalWeight || 1;
    let costPerGram = 0;
    let costPerPiece = 0;
    if (recipe.yieldType === 'pieces') costPerPiece = totalCost / finishedYield;
    else costPerGram = totalCost / finishedYield;

    return {
      ...recipe,
      items,
      totalWeight: parseFloat(totalWeight.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      costPerGram: parseFloat(costPerGram.toFixed(6)),
      costPerPiece: parseFloat(costPerPiece.toFixed(2)),
    };
  });

  check(
    await client()
      .from(T.recipes)
      .upsert(updated.map((r) => ({ id: r.id, data: toData(r), updated_at: new Date().toISOString() }))),
  );
  return true;
};

// Make sure the settings row exists
export const initializeDatabase = async () => {
  try {
    return await getSettings();
  } catch (e) {
    console.error('initializeDatabase failed:', e);
    return null;
  }
};

const insertAll = async (table, items) => {
  if (!items || items.length === 0) return;
  check(
    await client()
      .from(table)
      .insert(items.map((it) => ({ id: it.id || newId('x'), data: toData(it) }))),
  );
};

const deleteDemo = async () => {
  for (const table of [T.ingredients, T.packaging, T.recipes, T.calculations]) {
    check(await client().from(table).delete().eq('data->>isDemo', 'true'));
  }
};

export const seedDemoData = async () => {
  await deleteDemo();
  await insertAll(T.ingredients, demoIngredients);
  await insertAll(T.packaging, demoPackaging);
  await insertAll(T.recipes, demoRecipes);
  await insertAll(T.calculations, demoCalculations);
  await recalculateAllRecipes();
  return { success: true };
};

export const clearDemoData = async () => {
  await deleteDemo();
  return { success: true };
};

// === INGREDIENTS ===
export const getIngredients = async () => (await listTable(T.ingredients)).sort(byName);

export const saveIngredient = async (ingredient) => {
  const data = { ...ingredient };
  data.costPerUnit = parseFloat(getUnitCost(data.purchasePrice, data.purchaseQuantity, data.purchaseUnit).toFixed(6));

  let existing = null;
  if (data.id) {
    const row = check(await client().from(T.ingredients).select('*').eq('id', data.id).maybeSingle());
    existing = row ? fromRow(row) : null;
  }

  if (existing) {
    const history = existing.priceHistory || [];
    if (parseFloat(existing.purchasePrice) !== parseFloat(data.purchasePrice)) {
      history.unshift({ price: existing.purchasePrice, unit: existing.purchaseUnit, date: existing.updatedAt });
    }
    data.priceHistory = history.slice(0, 5);
  } else {
    data.id = data.id || newId('ing');
    data.priceHistory = data.priceHistory || [];
    data.isDemo = data.isDemo || false;
  }

  const saved = await saveRow(T.ingredients, data);
  await recalculateAllRecipes();
  return saved;
};

export const deleteIngredient = async (id) => {
  await removeRow(T.ingredients, id);
  await recalculateAllRecipes();
  return { success: true };
};

export const isIngredientUsed = async (id) => {
  const recipes = await listTable(T.recipes);
  return recipes.filter((r) => (r.items || []).some((item) => item.ingredientId === id)).map((r) => r.name);
};

// === RECIPES ===
export const getRecipes = async () => (await listTable(T.recipes)).sort(byName);

export const saveRecipe = async (recipe) => {
  const data = { ...recipe };
  const ingredients = await listTable(T.ingredients);
  const ingMap = new Map(ingredients.map((i) => [i.id, i]));

  let totalCost = 0;
  let totalWeight = 0;

  data.items = (data.items || []).map((item) => {
    const ing = ingMap.get(item.ingredientId);
    const itemCost = ing ? ing.costPerUnit * item.quantity : 0;
    if (item.unit === 'g' || item.unit === 'ml') totalWeight += parseFloat(item.quantity) || 0;
    return { ...item, calculatedCost: parseFloat(itemCost.toFixed(2)) };
  });
  data.items.forEach((item) => {
    totalCost += item.calculatedCost;
  });

  data.totalWeight = parseFloat(totalWeight.toFixed(2));
  data.totalCost = parseFloat(totalCost.toFixed(2));

  const finishedYield = parseFloat(data.finishedYield) || totalWeight || 1;
  if (data.yieldType === 'pieces') {
    data.costPerGram = 0;
    data.costPerPiece = parseFloat((totalCost / finishedYield).toFixed(2));
  } else {
    data.costPerGram = parseFloat((totalCost / finishedYield).toFixed(6));
    data.costPerPiece = 0;
  }

  data.id = data.id || newId('rec');
  data.isDemo = data.isDemo || false;
  return saveRow(T.recipes, data);
};

export const deleteRecipe = async (id) => removeRow(T.recipes, id);

export const isRecipeUsedInCalculations = async (recipeId) => {
  const calcs = await listTable(T.calculations);
  const usedIn = [];
  calcs.forEach((c) => {
    const comp = c.components || {};
    const hasSponge = (comp.sponges || []).some((s) => s.recipeId === recipeId);
    const hasFilling = (comp.fillings || []).some((f) => f.recipeId === recipeId);
    const hasTopping = (comp.toppings || []).some((t) => t.recipeId === recipeId);
    const hasDeco = (comp.decorations || []).some((d) => d.recipeId === recipeId);
    const hasRecipe = comp.recipeId === recipeId;
    if (hasSponge || hasFilling || hasTopping || hasDeco || hasRecipe) usedIn.push(c.productName);
  });
  return [...new Set(usedIn)];
};

// === PACKAGING ===
export const getPackaging = async () => (await listTable(T.packaging)).sort(byName);

export const savePackaging = async (pkg) => {
  const data = { ...pkg };
  const price = parseFloat(data.purchasePrice) || 0;
  const q = parseFloat(data.purchaseQuantity) || 1;
  data.costPerPiece = parseFloat((price / q).toFixed(2));
  data.id = data.id || newId('pkg');
  data.isDemo = data.isDemo || false;
  return saveRow(T.packaging, data);
};

export const deletePackaging = async (id) => removeRow(T.packaging, id);

export const isPackagingUsedInCalculations = async (pkgId) => {
  const calcs = await listTable(T.calculations);
  const usedIn = [];
  calcs.forEach((c) => {
    const comp = c.components || {};
    if ((comp.packaging || []).some((p) => p.id === pkgId)) usedIn.push(c.productName);
  });
  return [...new Set(usedIn)];
};

// === SAVED CALCULATIONS ===
export const getSavedCalculations = async () =>
  (await listTable(T.calculations)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

export const saveCalculation = async (calc) => {
  const data = { ...calc };
  data.id = data.id || newId('calc');
  data.isDemo = data.isDemo || false;
  return saveRow(T.calculations, data);
};

export const deleteCalculation = async (id) => removeRow(T.calculations, id);

// === SETTINGS ===
export const getSettings = async () => {
  const row = check(await client().from(T.settings).select('*').eq('id', 1).maybeSingle());
  if (row) return { ...DEFAULT_SETTINGS, ...row.data };
  check(await client().from(T.settings).insert({ id: 1, data: DEFAULT_SETTINGS }));
  return { ...DEFAULT_SETTINGS };
};

export const saveSettings = async (newSettings) => {
  const merged = { ...(await getSettings()), ...toData(newSettings) };
  check(await client().from(T.settings).upsert({ id: 1, data: merged, updated_at: new Date().toISOString() }));
  return merged;
};

// === DATABASE EXPORT / IMPORT ===
export const exportDatabaseJSON = async () => {
  const data = {
    ingredients: await getIngredients(),
    recipes: await getRecipes(),
    packaging: await getPackaging(),
    calculations: await getSavedCalculations(),
    settings: await getSettings(),
    exportedAt: new Date().toISOString(),
    version: '1.0',
  };
  return JSON.stringify(data, null, 2);
};

export const importDatabaseJSON = async (jsonStr) => {
  try {
    const data = JSON.parse(jsonStr);
    // Clear everything first for a total restore
    for (const table of [T.ingredients, T.recipes, T.packaging, T.calculations]) {
      check(await client().from(table).delete().neq('id', ''));
    }
    await insertAll(T.ingredients, data.ingredients);
    await insertAll(T.recipes, data.recipes);
    await insertAll(T.packaging, data.packaging);
    await insertAll(T.calculations, data.calculations);
    if (data.settings) await saveSettings(data.settings);
    await recalculateAllRecipes();
    return { success: true };
  } catch (e) {
    console.error('Failed to import JSON data', e);
    return { success: false, error: e.message };
  }
};
