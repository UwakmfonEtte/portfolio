/**
 * Seeds a throwaway Business Tracker instance with realistic demo data, for portfolio screenshots.
 *
 * Nothing here touches the real install. The app reads DB_DIR and DB_KEY_FILE from the
 * environment, so this runs a completely separate database in a temp folder — there is no backup
 * to restore and nothing to revert, because the real data is never opened.
 *
 * Data goes in through the app's own HTTP API rather than straight into SQLite, so it passes the
 * same validation, stock arithmetic and identity rules as real entries. Screenshots then show the
 * app genuinely working, not a database dressed up to look like it.
 *
 *   node seed-tracker.js            (expects the isolated server on :3011)
 */
const BASE = process.env.SEED_BASE || 'http://localhost:3011';
const OWNER_PW = process.env.SEED_OWNER_PW || 'demo-owner-pw';
const STAFF_PW = process.env.SEED_STAFF_PW || 'demo-staff-pw';

let cookie = '';

async function call(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';')[0];
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (e) { /* non-JSON response */ }
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${json ? JSON.stringify(json) : text.slice(0, 120)}`);
  return json;
}

// A plausible Uyo gadget shop. Prices in naira, at roughly realistic 2026 street rates.
const PRODUCTS = [
  { name: 'iPhone 13',            category: 'phone',     brand: 'Apple',    variant: '128GB',      cost_price: 520000, selling_price: 615000, quantity: 6 },
  { name: 'iPhone 15 Pro',        category: 'phone',     brand: 'Apple',    variant: '256GB',      cost_price: 1180000, selling_price: 1345000, quantity: 3 },
  { name: 'Galaxy A55',           category: 'phone',     brand: 'Samsung',  variant: '256GB',      cost_price: 385000, selling_price: 452000, quantity: 8 },
  { name: 'Redmi Note 13',        category: 'phone',     brand: 'Xiaomi',   variant: '128GB',      cost_price: 198000, selling_price: 245000, quantity: 12 },
  { name: 'Tecno Spark 20',       category: 'phone',     brand: 'Tecno',    variant: '128GB',      cost_price: 132000, selling_price: 168000, quantity: 15 },
  { name: 'MacBook Air M2',       category: 'laptop',    brand: 'Apple',    variant: '8GB/256GB',  cost_price: 1250000, selling_price: 1420000, quantity: 2 },
  { name: 'ThinkPad T480',        category: 'laptop',    brand: 'Lenovo',   variant: '16GB/512GB', cost_price: 415000, selling_price: 505000, quantity: 4 },
  { name: 'HP Pavilion 15',       category: 'laptop',    brand: 'HP',       variant: '8GB/512GB',  cost_price: 468000, selling_price: 560000, quantity: 3 },
  { name: 'AirPods Pro 2',        category: 'accessory', brand: 'Apple',    variant: '',           cost_price: 145000, selling_price: 189000, quantity: 9 },
  { name: 'Anker PowerCore 20K',  category: 'accessory', brand: 'Anker',    variant: '20000mAh',   cost_price: 28000,  selling_price: 42000,  quantity: 22 },
  { name: '65W USB-C Charger',    category: 'charger',   brand: 'Anker',    variant: '65W',        cost_price: 14500,  selling_price: 24000,  quantity: 30 },
  { name: 'Screen Protector',     category: 'accessory', brand: '',         variant: 'Tempered',   cost_price: 1200,   selling_price: 3500,   quantity: 60 }
];

const CUSTOMERS = [
  ['Aniekan Udo', '08031234567'], ['Blessing Effiong', '08076543210'],
  ['Emmanuel Bassey', '07038889900'], ['Ini Akpan', '09022334455'],
  ['Grace Nsikak', '08145556677'], ['Samuel Etim', '08099887766'],
  ['Mfon Umoh', '07011223344'], ['Deborah Okon', '08167778899']
];

const SALES = [
  ['Tecno Spark 20', 2], ['Screen Protector', 5], ['65W USB-C Charger', 3],
  ['Redmi Note 13', 2], ['Anker PowerCore 20K', 4], ['iPhone 13', 1],
  ['AirPods Pro 2', 2], ['Galaxy A55', 3], ['Screen Protector', 8],
  ['65W USB-C Charger', 6], ['Redmi Note 13', 1], ['ThinkPad T480', 1],
  ['Tecno Spark 20', 3], ['Anker PowerCore 20K', 2], ['iPhone 15 Pro', 1],
  ['MacBook Air M2', 1], ['Screen Protector', 6], ['Galaxy A55', 1],
  ['65W USB-C Charger', 4], ['AirPods Pro 2', 1], ['HP Pavilion 15', 1],
  ['Tecno Spark 20', 2], ['Screen Protector', 4], ['Redmi Note 13', 2]
];

const EXPENSES = [
  ['Shop rent — September', 'other', 180000],
  ['NEPA prepaid units', 'other', 35000],
  ['Generator fuel', 'other', 28000],
  ['Transport to Lagos (restock)', 'other', 65000],
  ['Shop assistant salary', 'other', 90000],
  ['Internet subscription', 'other', 22000],
  ['Packaging bags and receipts', 'other', 12500]
];

async function main() {
  console.log('Seeding', BASE);

  const status = await call('GET', '/api/auth/setup-status');
  if (status && status.needsSetup !== false) {
    await call('POST', '/api/auth/setup', { owner_password: OWNER_PW, frontdesk_password: STAFF_PW });
    console.log('  setup complete');
  }

  await call('POST', '/api/auth/login', { password: OWNER_PW });
  console.log('  signed in as owner');

  for (const p of PRODUCTS) {
    await call('POST', '/api/products', p);
  }
  console.log('  ' + PRODUCTS.length + ' products in stock');

  let sold = 0;
  for (let i = 0; i < SALES.length; i++) {
    const [name, qty] = SALES[i];
    const [customer_name, customer_phone] = CUSTOMERS[i % CUSTOMERS.length];
    try {
      await call('POST', '/api/sales', { product_name: name, quantity: qty, customer_name, customer_phone });
      sold++;
    } catch (e) {
      console.log('    skipped ' + name + ': ' + e.message.slice(0, 70));
    }
  }
  console.log('  ' + sold + ' sales recorded');

  for (const [description, category, amount] of EXPENSES) {
    await call('POST', '/api/expenses', { description, category, amount });
  }
  console.log('  ' + EXPENSES.length + ' expenses recorded');

  console.log('\nSeeded. Sign in with the owner password to view.');
}

main().catch((e) => {
  console.error('\nFAILED: ' + e.message);
  process.exitCode = 1;
});
