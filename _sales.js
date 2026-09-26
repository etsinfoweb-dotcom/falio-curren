const { pg } = require('./_supabase');

// items: [{ product_id?, model?, color?, name, qty, unit_price }]
// Renvoie { saleRow, itemsResolved, stockWarnings }
async function recordSale({ source, customer_name, customer_phone, wilaya, delivery_type, delivery_fee, items, status, noest_tracking }) {
  const stockWarnings = [];
  const resolvedItems = [];
  let subtotal = 0;
  let costTotal = 0;

  for (const it of items) {
    let product = null;
    if (it.product_id) {
      const r = await pg('/products?id=eq.' + encodeURIComponent(it.product_id) + '&select=*');
      const rows = await r.json();
      product = rows[0] || null;
    }
    if (!product && it.model) {
      const params = new URLSearchParams({ model: 'eq.' + it.model });
      let query = '/products?model=eq.' + encodeURIComponent(it.model);
      if (it.color) query += '&color=eq.' + encodeURIComponent(it.color);
      query += '&select=*';
      const r = await pg(query);
      const rows = await r.json();
      product = rows[0] || null;
    }

    const qty = Number(it.qty) || 1;
    const unitPrice = it.unit_price != null ? Number(it.unit_price) : (product ? Number(product.price) : 0);
    const unitCost = product ? Number(product.cost_price) || 0 : 0;

    subtotal += unitPrice * qty;
    costTotal += unitCost * qty;

    resolvedItems.push({
      product_id: product ? product.id : null,
      model: it.model || (product ? product.model : null),
      color: it.color || (product ? product.color : null),
      name: it.name || (product ? product.name : 'Produit'),
      qty, unit_price: unitPrice, unit_cost: unitCost
    });

    if (product) {
      const newStock = Math.max(0, (product.stock || 0) - qty);
      const updRes = await pg('/products?id=eq.' + encodeURIComponent(product.id), {
        method: 'PATCH',
        body: JSON.stringify({ stock: newStock, updated_at: new Date().toISOString() })
      });
      if (!updRes.ok) stockWarnings.push('Stock non mis à jour pour ' + (it.name || it.model));
    } else {
      stockWarnings.push('Produit introuvable pour la ligne : ' + (it.name || it.model || '?'));
    }
  }

  const deliveryFee = Number(delivery_fee) || 0;
  const total = subtotal + deliveryFee;

  const saleRes = await pg('/sales', {
    method: 'POST',
    headers: { 'Prefer': 'return=representation' },
    body: JSON.stringify({
      source: source || 'manual',
      customer_name: customer_name || null,
      customer_phone: customer_phone || null,
      wilaya: wilaya || null,
      delivery_type: delivery_type || null,
      delivery_fee: deliveryFee,
      items: resolvedItems,
      subtotal, total, cost_total: costTotal,
      status: status || 'en_attente',
      noest_tracking: noest_tracking || null
    })
  });

  if (!saleRes.ok) {
    const text = await saleRes.text();
    throw new Error('Échec enregistrement de la vente : ' + text);
  }
  const saleData = await saleRes.json();
  return { saleRow: saleData[0], itemsResolved: resolvedItems, stockWarnings };
}

module.exports = { recordSale };
