const { pg, json, isAdminAuthorized } = require('./_supabase');

exports.handler = async (event) => {
  if (!isAdminAuthorized(event)) {
    return json(401, { success: false, message: 'Non autorisé.' });
  }

  try {
    if (event.httpMethod === 'GET') {
      const res = await pg('/purchases?select=*&order=purchased_at.desc,id.desc&limit=300');
      const data = await res.json();
      return json(res.status, data);
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { product_id, quantity, unit_cost, supplier, note, purchased_at } = body;
      if (!product_id || !quantity || unit_cost == null) {
        return json(400, { success: false, message: 'product_id, quantity et unit_cost sont requis.' });
      }

      const prodRes = await pg('/products?id=eq.' + encodeURIComponent(product_id) + '&select=id,name,stock');
      const prods = await prodRes.json();
      const product = prods[0];
      if (!product) return json(404, { success: false, message: 'Produit introuvable.' });

      const purchaseRes = await pg('/purchases', {
        method: 'POST',
        headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify({
          product_id: product.id,
          product_name: product.name,
          quantity: Number(quantity),
          unit_cost: Number(unit_cost),
          supplier: supplier || null,
          note: note || null,
          purchased_at: purchased_at || new Date().toISOString().slice(0, 10)
        })
      });
      if (!purchaseRes.ok) {
        const text = await purchaseRes.text();
        return json(purchaseRes.status, { success: false, message: text });
      }
      const purchaseData = await purchaseRes.json();

      const newStock = (product.stock || 0) + Number(quantity);
      const updateRes = await pg('/products?id=eq.' + encodeURIComponent(product.id), {
        method: 'PATCH',
        body: JSON.stringify({ stock: newStock, cost_price: Number(unit_cost), updated_at: new Date().toISOString() })
      });
      if (!updateRes.ok) {
        const text = await updateRes.text();
        return json(200, { success: true, purchase: purchaseData[0], warning: 'Achat enregistré mais mise à jour du stock échouée : ' + text });
      }

      return json(200, { success: true, purchase: purchaseData[0], new_stock: newStock });
    }

    if (event.httpMethod === 'DELETE') {
      const body = JSON.parse(event.body || '{}');
      const id = body.id;
      if (!id) return json(400, { success: false, message: 'id manquant.' });
      const res = await pg('/purchases?id=eq.' + encodeURIComponent(id), { method: 'DELETE' });
      if (!res.ok) {
        const text = await res.text();
        return json(res.status, { success: false, message: text });
      }
      return json(200, { success: true, message: 'Achat supprimé (le stock n\'a pas été modifié automatiquement — ajuste-le manuellement si besoin).' });
    }

    return json(405, { success: false, message: 'Méthode non autorisée.' });
  } catch (err) {
    return json(500, { success: false, message: err.message });
  }
};
