// Demo data copied from the original calculator server.
export const demoIngredients = [
{ id: 'ing_c1', name: 'Dark Couverture Chocolate', category: 'Chocolate', brand: 'Van Houten', purchaseQuantity: 1, purchaseUnit: 'kg', purchasePrice: 850, costPerUnit: 0.85, supplier: 'Bakery World', notes: '54.5% Dark Chocolate', isDemo: true, priceHistory: [] },
{ id: 'ing_c2', name: 'White Chocolate Compound', category: 'Chocolate', brand: 'Morde', purchaseQuantity: 500, purchaseUnit: 'g', purchasePrice: 180, costPerUnit: 0.36, supplier: 'Local Mart', notes: 'For decorations and fillings', isDemo: true, priceHistory: [] },
{ id: 'ing_b1', name: 'All Purpose Flour (Maida)', category: 'Baking', brand: 'Rajdhani', purchaseQuantity: 1, purchaseUnit: 'kg', purchasePrice: 60, costPerUnit: 0.06, supplier: 'Grain Merchant', notes: 'Sift before use', isDemo: true, priceHistory: [] },
{ id: 'ing_b2', name: 'Granulated Sugar', category: 'Baking', brand: 'Madhur', purchaseQuantity: 1, purchaseUnit: 'kg', purchasePrice: 50, costPerUnit: 0.05, supplier: 'Grain Merchant', notes: 'Blend into powder as needed', isDemo: true, priceHistory: [] },
{ id: 'ing_b3', name: 'Cocoa Powder', category: 'Baking', brand: 'Cadbury', purchaseQuantity: 250, purchaseUnit: 'g', purchasePrice: 120, costPerUnit: 0.48, supplier: 'Local Mart', notes: 'Unsweetened', isDemo: true, priceHistory: [] },
{ id: 'ing_b4', name: 'Baking Powder', category: 'Baking', brand: 'Weikfield', purchaseQuantity: 100, purchaseUnit: 'g', purchasePrice: 35, costPerUnit: 0.35, supplier: 'Local Mart', notes: 'Keep airtight', isDemo: true, priceHistory: [] },
{ id: 'ing_b5', name: 'Baking Soda', category: 'Baking', brand: 'Weikfield', purchaseQuantity: 100, purchaseUnit: 'g', purchasePrice: 25, costPerUnit: 0.25, supplier: 'Local Mart', notes: 'Airtight', isDemo: true, priceHistory: [] },
{ id: 'ing_b6', name: 'Instant Dry Yeast', category: 'Baking', brand: 'Gloripan', purchaseQuantity: 500, purchaseUnit: 'g', purchasePrice: 220, costPerUnit: 0.44, supplier: 'Bakery World', notes: 'Store in freezer', isDemo: true, priceHistory: [] },
{ id: 'ing_b7', name: 'Bread Improver', category: 'Baking', brand: 'Blue Bird', purchaseQuantity: 100, purchaseUnit: 'g', purchasePrice: 60, costPerUnit: 0.60, supplier: 'Bakery World', notes: 'Optional but good for volume', isDemo: true, priceHistory: [] },
{ id: 'ing_d1', name: 'Full Cream Milk', category: 'Dairy', brand: 'Amul', purchaseQuantity: 1, purchaseUnit: 'litre', purchasePrice: 66, costPerUnit: 0.066, supplier: 'Local Dairy', notes: 'Fresh pasteurized', isDemo: true, priceHistory: [] },
{ id: 'ing_d2', name: 'Fresh Cream', category: 'Dairy', brand: 'Amul', purchaseQuantity: 1, purchaseUnit: 'litre', purchasePrice: 250, costPerUnit: 0.25, supplier: 'Local Dairy', notes: '25% fat content', isDemo: true, priceHistory: [] },
{ id: 'ing_d3', name: 'Whipping Cream', category: 'Dairy', brand: 'Tropolite', purchaseQuantity: 1, purchaseUnit: 'litre', purchasePrice: 180, costPerUnit: 0.18, supplier: 'Bakery World', notes: 'Non-dairy whip cream', isDemo: true, priceHistory: [] },
{ id: 'ing_d4', name: 'Unsalted Butter', category: 'Dairy', brand: 'Amul', purchaseQuantity: 500, purchaseUnit: 'g', purchasePrice: 275, costPerUnit: 0.55, supplier: 'Local Dairy', notes: 'Keep refrigerated', isDemo: true, priceHistory: [] },
{ id: 'ing_d5', name: 'Fresh Curd / Yogurt', category: 'Dairy', brand: 'Amul', purchaseQuantity: 400, purchaseUnit: 'g', purchasePrice: 35, costPerUnit: 0.0875, supplier: 'Local Dairy', notes: 'Egg replacement moisture', isDemo: true, priceHistory: [] },
{ id: 'ing_f1', name: 'Refined Sunflower Oil', category: 'Fats', brand: 'Fortune', purchaseQuantity: 1, purchaseUnit: 'litre', purchasePrice: 140, costPerUnit: 0.14, supplier: 'Local Mart', notes: 'Neutral oil', isDemo: true, priceHistory: [] },
{ id: 'ing_fl1', name: 'Vanilla Extract', category: 'Flavours', brand: 'Sprig', purchaseQuantity: 50, purchaseUnit: 'ml', purchasePrice: 350, costPerUnit: 7.00, supplier: 'Bakery World', notes: 'Premium extract', isDemo: true, priceHistory: [] }
];
export const demoPackaging = [
{ id: 'pkg_1', name: 'Cake Box 8 Inch', category: 'Cake Box', purchaseQuantity: 50, purchaseUnit: 'piece', purchasePrice: 1750, costPerPiece: 35, notes: 'Premium pink board box', isDemo: true },
{ id: 'pkg_2', name: 'Cake Board 10 Inch', category: 'Cake Board', purchaseQuantity: 50, purchaseUnit: 'piece', purchasePrice: 750, costPerPiece: 15, notes: 'Sturdy silver base', isDemo: true },
{ id: 'pkg_3', name: 'Bread Paper Bag', category: 'Bread Bag', purchaseQuantity: 100, purchaseUnit: 'piece', purchasePrice: 200, costPerPiece: 2, notes: 'Kraft paper', isDemo: true },
{ id: 'pkg_4', name: 'Ribbon & Tags', category: 'Ribbon', purchaseQuantity: 100, purchaseUnit: 'piece', purchasePrice: 300, costPerPiece: 3, notes: 'Satin ribbon (cut pieces)', isDemo: true },
{ id: 'pkg_5', name: 'Bakery Logo Sticker', category: 'Sticker', purchaseQuantity: 500, purchaseUnit: 'piece', purchasePrice: 500, costPerPiece: 1, notes: 'Round gloss sticker', isDemo: true }
];
export const demoRecipes = [
{
id: 'rec_r1',
name: 'Chocolate Sponge',
category: 'Cake Sponge',
items: [
{ ingredientId: 'ing_b1', quantity: 200, unit: 'g' },
{ ingredientId: 'ing_b2', quantity: 180, unit: 'g' },
{ ingredientId: 'ing_b3', quantity: 30, unit: 'g' },
{ ingredientId: 'ing_d1', quantity: 150, unit: 'ml' },
{ ingredientId: 'ing_f1', quantity: 60, unit: 'ml' },
{ ingredientId: 'ing_d5', quantity: 100, unit: 'g' },
{ ingredientId: 'ing_b4', quantity: 5, unit: 'g' },
{ ingredientId: 'ing_b5', quantity: 3, unit: 'g' },
{ ingredientId: 'ing_fl1', quantity: 5, unit: 'ml' }
],
totalWeight: 733,
yieldType: 'grams',
finishedYield: 650,
totalQuantity: 1,
totalCost: 112.58,
costPerGram: 0.1732,
costPerPiece: 0,
notes: 'Bake at 180C for 35 mins. Eggless standard sponge.',
isDemo: true
},
{
id: 'rec_r2',
name: 'Chocolate Ganache 1:1',
category: 'Filling',
items: [
{ ingredientId: 'ing_c1', quantity: 300, unit: 'g' },
{ ingredientId: 'ing_d2', quantity: 300, unit: 'ml' }
],
totalWeight: 600,
yieldType: 'grams',
finishedYield: 600,
totalQuantity: 1,
totalCost: 330.00,
costPerGram: 0.55,
costPerPiece: 0,
notes: 'Equal parts dark couverture and cream.',
isDemo: true
},
{
id: 'rec_r3',
name: 'Burger Bun Recipe',
category: 'Bread',
items: [
{ ingredientId: 'ing_b1', quantity: 500, unit: 'g' },
{ ingredientId: 'ing_d1', quantity: 250, unit: 'ml' },
{ ingredientId: 'ing_b2', quantity: 40, unit: 'g' },
{ ingredientId: 'ing_d4', quantity: 30, unit: 'g' },
{ ingredientId: 'ing_b6', quantity: 7, unit: 'g' },
{ ingredientId: 'ing_b7', quantity: 5, unit: 'g' }
],
totalWeight: 832,
yieldType: 'pieces',
finishedYield: 10,
totalQuantity: 10,
totalCost: 71.18,
costPerGram: 0,
costPerPiece: 7.12,
notes: 'Yields 10 burger buns of 80g dough each.',
isDemo: true
}
];
export const demoCalculations = [
{
id: 'calc_1',
productName: 'Chocolate Truffle Cake (Demo)',
productType: 'Cake',
materialCost: 512.44,
packagingCost: 54.00,
labourCost: 300.00,
overheadCost: 25.62,
wastageCost: 25.62,
totalCost: 917.68,
sellingPrice: 1529.47,
profit: 611.79,
profitMargin: 40,
isDemo: true,
components: {
weight: '1kg',
layers: '3',
sponges: [{ recipeId: 'rec_r1', quantity: 450, cost: 77.94 }],
fillings: [{ recipeId: 'rec_r2', quantity: 300, cost: 165.00 }],
toppings: [{ recipeId: 'rec_r2', quantity: 150, cost: 82.50 }],
decorations: [
{ recipeId: 'rec_r2', quantity: 50, cost: 27.50 },
{ name: 'Chocolate Shards / Flakes', isCustom: true, cost: 60 }
],
packaging: [
{ id: 'pkg_1', name: 'Cake Box 8 Inch', quantity: 1, cost: 35 },
{ id: 'pkg_2', name: 'Cake Board 10 Inch', quantity: 1, cost: 15 },
{ id: 'pkg_5', name: 'Bakery Logo Sticker', quantity: 1, cost: 1 },
{ id: 'pkg_4', name: 'Ribbon & Tags', quantity: 1, cost: 3 }
],
labourHours: 3,
labourRate: 100,
overheadRate: 5,
wastageRate: 5,
notes: 'Standard dark chocolate truffle cake.'
}
}
];

