/* ============================================
   SUPABASE SYNC
   Ponte entre o site / painel de admin e o Supabase.
   Se o Supabase não estiver configurado (js/supabase-config.js ainda
   com os valores de exemplo), todas as funções aqui falham em silêncio
   e o site continua usando os dados estáticos de js/menu-data.js.
   ============================================ */

function genId(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function sb() {
  return supabaseClient;
}

/* ---------------- Leitura (usada pelo site público) ---------------- */
window.loadSiteData = async function () {
  const client = sb();
  if (!client) return; // Supabase não configurado — segue com os dados estáticos

  const { data: settingsRow } = await client
    .from('settings')
    .select('data')
    .eq('id', 'business')
    .maybeSingle();
  if (settingsRow && settingsRow.data) {
    Object.assign(BUSINESS, settingsRow.data);
  }

  const { data: cats } = await client
    .from('categories')
    .select('*')
    .order('order', { ascending: true });
  if (cats && cats.length) {
    const liveMenu = cats.map(c => ({
      cat: c.cat, icon: c.icon, sub: c.sub, order: c.order,
      items: c.items || [], _docId: c.id
    }));
    MENU.length = 0;
    MENU.push(...liveMenu);
  }
};

/* ---------------- Escrita (usada pelo painel de admin) ---------------- */

async function saveBusinessSettings(data) {
  const client = sb();
  if (!client) throw new Error('Supabase não configurado.');
  const { error } = await client.from('settings').upsert({ id: 'business', data });
  if (error) throw error;
}

async function getBusinessSettings() {
  const client = sb();
  if (!client) return null;
  const { data } = await client.from('settings').select('data').eq('id', 'business').maybeSingle();
  return data ? data.data : null;
}

async function listCategories() {
  const client = sb();
  if (!client) return [];
  const { data, error } = await client.from('categories').select('*').order('order', { ascending: true });
  if (error || !data) return [];
  return data.map(c => ({
    cat: c.cat, icon: c.icon, sub: c.sub, order: c.order,
    items: c.items || [], _docId: c.id
  }));
}

async function saveCategory(docId, data) {
  const client = sb();
  if (!client) throw new Error('Supabase não configurado.');
  if (docId) {
    const { error } = await client.from('categories').update(data).eq('id', docId);
    if (error) throw error;
    return docId;
  } else {
    const { data: row, error } = await client.from('categories').insert(data).select('id').single();
    if (error) throw error;
    return row.id;
  }
}

async function deleteCategory(docId) {
  const client = sb();
  if (!client) throw new Error('Supabase não configurado.');
  const { error } = await client.from('categories').delete().eq('id', docId);
  if (error) throw error;
}

// Como os itens vivem dentro da coluna "items" (jsonb) da categoria,
// para salvar/remover um item reescrevemos o array inteiro da categoria.
async function saveItemInCategory(docId, items) {
  const client = sb();
  if (!client) throw new Error('Supabase não configurado.');
  const { error } = await client.from('categories').update({ items }).eq('id', docId);
  if (error) throw error;
}

async function uploadProductImage(file) {
  const client = sb();
  if (!client) throw new Error('Supabase não configurado.');
  const path = `products/${genId('img')}_${file.name.replace(/\s+/g, '_')}`;
  const { error } = await client.storage.from('product-images').upload(path, file);
  if (error) throw error;
  const { data } = client.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}

/* ---------------- Cupons ---------------- */
async function listCoupons() {
  const client = sb();
  if (!client) return [];
  const { data, error } = await client.from('coupons').select('*').order('created_at', { ascending: false });
  if (error || !data) return [];
  return data;
}

async function saveCoupon(coupon) {
  const client = sb();
  if (!client) throw new Error('Supabase não configurado.');
  const { error } = await client.from('coupons').upsert(coupon);
  if (error) throw error;
}

async function deleteCoupon(code) {
  const client = sb();
  if (!client) throw new Error('Supabase não configurado.');
  const { error } = await client.from('coupons').delete().eq('code', code);
  if (error) throw error;
}

// usado pelo site público (chave anon) pra validar um cupom digitado no carrinho
async function getActiveCoupon(code) {
  const client = sb();
  if (!client) return null;
  const { data } = await client.from('coupons').select('*').eq('code', code.toUpperCase().trim()).eq('active', true).maybeSingle();
  return data || null;
}
window.getActiveCoupon = getActiveCoupon;

/* ---------------- Importação inicial (migra js/menu-data.js pro Supabase) ---------------- */
async function seedInitialData() {
  const client = sb();
  if (!client) throw new Error('Supabase não configurado.');

  const rows = MENU.map((cat, i) => ({
    cat: cat.cat,
    icon: cat.icon || 'bi-egg-fried',
    sub: cat.sub || '',
    order: i,
    items: cat.items.map(it => ({ ...it, id: it.id || genId('itm') }))
  }));

  const { error: e1 } = await client.from('categories').insert(rows);
  if (e1) throw e1;

  const { error: e2 } = await client.from('settings').upsert({ id: 'business', data: BUSINESS });
  if (e2) throw e2;
}

window.AdminAPI = {
  saveBusinessSettings,
  getBusinessSettings,
  listCategories,
  saveCategory,
  deleteCategory,
  saveItemInCategory,
  uploadProductImage,
  seedInitialData,
  listCoupons,
  saveCoupon,
  deleteCoupon,
  genId,
  isConfigured: () => !!supabaseClient
};
