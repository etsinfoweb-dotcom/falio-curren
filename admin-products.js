const { pg, json, isAdminAuthorized } = require('./_supabase');

exports.handler = async (event) => {
  if (!isAdminAuthorized(event)) {
    return json(401, { success: false, message: 'Non autorisé.' });
  }

  try {
    if (event.httpMethod === 'GET') {
      const res = await pg('/products?select=*&order=id.desc');
      const data = await res.json();
      return json(res.status, data);
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { model, name, color, price, gender, stock, image, low_stock_threshold } = body;
      if (!model || !name || !color || price == null || !gender) {
        return json(400, { success: false, message: 'Champs obligatoires manquants (model, name, color, price, gender).' });
      }
      const res = await pg('/products', {
        method: 'POST',
        headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify({
          model, name, color,
          price: Number(price),
          gender,
          stock: Number(stock) || 0,
          image: image || null,
          low_stock_threshold: low_stock_threshold != null ? Number(low_stock_threshold) : 2,
          active: true
        })
      });
      const data = await res.json();
      return json(res.status, data);
    }

    if (event.httpMethod === 'PATCH') {
      const body = JSON.parse(event.body || '{}');
      const { id, ...fields } = body;
      if (!id) return json(400, { success: false, message: 'id manquant.' });
      fields.updated_at = new Date().toISOString();
      const res = await pg('/products?id=eq.' + encodeURIComponent(id), {
        method: 'PATCH',
        headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify(fields)
      });
      const data = await res.json();
      return json(res.status, data);
    }

    if (event.httpMethod === 'DELETE') {
      const body = JSON.parse(event.body || '{}');
      const id = body.id || (event.queryStringParameters && event.queryStringParameters.id);
      if (!id) return json(400, { success: false, message: 'id manquant.' });
      const res = await pg('/products?id=eq.' + encodeURIComponent(id), { method: 'DELETE' });
      if (!res.ok) {
        const text = await res.text();
        return json(res.status, { success: false, message: text });
      }
      return json(200, { success: true });
    }

    return json(405, { success: false, message: 'Méthode non autorisée.' });
  } catch (err) {
    return json(500, { success: false, message: err.message });
  }
};
