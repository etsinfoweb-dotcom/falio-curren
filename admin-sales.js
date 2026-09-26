const { pg, json, isAdminAuthorized } = require('./_supabase');
const { recordSale } = require('./_sales');

exports.handler = async (event) => {
  if (!isAdminAuthorized(event)) {
    return json(401, { success: false, message: 'Non autorisé.' });
  }

  try {
    if (event.httpMethod === 'GET') {
      const qs = event.queryStringParameters || {};
      let query = '/sales?select=*&order=created_at.desc&limit=500';
      if (qs.from) query += '&created_at=gte.' + encodeURIComponent(qs.from);
      if (qs.to) query += '&created_at=lte.' + encodeURIComponent(qs.to);
      const res = await pg(query);
      const data = await res.json();
      return json(res.status, data);
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      if (!Array.isArray(body.items) || !body.items.length) {
        return json(400, { success: false, message: 'items requis (au moins une ligne).' });
      }
      const result = await recordSale({ ...body, source: 'manual', status: body.status || 'confirmee' });
      return json(200, { success: true, ...result });
    }

    if (event.httpMethod === 'PATCH') {
      const body = JSON.parse(event.body || '{}');
      const { id, status } = body;
      if (!id || !status) return json(400, { success: false, message: 'id et status requis.' });
      const res = await pg('/sales?id=eq.' + encodeURIComponent(id), {
        method: 'PATCH',
        headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      return json(res.status, data);
    }

    if (event.httpMethod === 'DELETE') {
      const body = JSON.parse(event.body || '{}');
      if (!body.id) return json(400, { success: false, message: 'id manquant.' });
      const res = await pg('/sales?id=eq.' + encodeURIComponent(body.id), { method: 'DELETE' });
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
