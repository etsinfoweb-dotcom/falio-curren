// Liste publique des produits actifs — utilisée par le site pour afficher le catalogue.
const { pg, json } = require('./_supabase');

exports.handler = async () => {
  try {
    const res = await pg('/products?active=eq.true&select=*&order=id.asc');
    if (!res.ok) {
      const text = await res.text();
      return json(res.status, { success: false, message: 'Erreur Supabase.', detail: text });
    }
    const data = await res.json();
    return json(200, data);
  } catch (err) {
    return json(500, { success: false, message: err.message });
  }
};
