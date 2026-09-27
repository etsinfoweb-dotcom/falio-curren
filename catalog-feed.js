// Flux catalogue pour Meta Commerce Manager (format CSV).
// Meta va appeler cette URL périodiquement pour connaître le stock réel.
const { pg } = require('./_supabase');

function csvEscape(value) {
  const str = String(value == null ? '' : value);
  if (/[",\n]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

exports.handler = async (event) => {
  try {
    const res = await pg('/products?active=eq.true&select=*&order=id.asc');
    if (!res.ok) {
      return { statusCode: 502, body: 'Erreur Supabase' };
    }
    const products = await res.json();

    const siteUrl = 'https://' + (event.headers['x-forwarded-host'] || event.headers.host);

    const columns = [
      'id', 'title', 'description', 'availability', 'condition',
      'price', 'link', 'image_link', 'brand', 'item_group_id', 'color', 'quantity_to_sell_on_facebook'
    ];

    const rows = [columns.join(',')];

    products.forEach(p => {
      const link = `${siteUrl}/?m=${encodeURIComponent(p.model)}&c=${encodeURIComponent(p.color)}`;
      const imageLink = p.image ? (p.image.startsWith('http') ? p.image : `${siteUrl}/${p.image}`) : '';
      const specsText = Array.isArray(p.specs) ? p.specs.map(s => s[0] + ': ' + s[1]).join('. ') : '';
      const description = `${p.name} — ${p.color}. ${specsText} Paiement à la livraison, livraison Noest partout en Algérie.`;

      const row = [
        p.id,
        `${p.name} — ${p.color}`,
        description,
        p.stock > 0 ? 'in stock' : 'out of stock',
        'new',
        `${p.price} DZD`,
        link,
        imageLink,
        'CURREN',
        p.model,
        p.color,
        p.stock
      ];
      rows.push(row.map(csvEscape).join(','));
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 'public, max-age=1800'
      },
      body: rows.join('\n')
    };
  } catch (err) {
    return { statusCode: 500, body: 'Erreur: ' + err.message };
  }
};
