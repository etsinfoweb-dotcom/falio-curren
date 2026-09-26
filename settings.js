const { pg, json } = require('./_supabase');

exports.handler = async () => {
  try {
    const res = await pg('/site_settings?id=eq.1&select=*');
    if (!res.ok) {
      const text = await res.text();
      return json(res.status, { success: false, message: text });
    }
    const rows = await res.json();
    return json(200, rows[0] || {});
  } catch (err) {
    return json(500, { success: false, message: err.message });
  }
};
