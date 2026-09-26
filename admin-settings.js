const { pg, json, isAdminAuthorized } = require('./_supabase');

exports.handler = async (event) => {
  if (!isAdminAuthorized(event)) {
    return json(401, { success: false, message: 'Non autorisé.' });
  }

  try {
    if (event.httpMethod === 'GET') {
      const res = await pg('/site_settings?id=eq.1&select=*');
      const rows = await res.json();
      return json(res.status, rows[0] || {});
    }

    if (event.httpMethod === 'PATCH') {
      const body = JSON.parse(event.body || '{}');
      delete body.id;
      body.updated_at = new Date().toISOString();
      const res = await pg('/site_settings?id=eq.1', {
        method: 'PATCH',
        headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      return json(res.status, data);
    }

    return json(405, { success: false, message: 'Méthode non autorisée.' });
  } catch (err) {
    return json(500, { success: false, message: err.message });
  }
};
