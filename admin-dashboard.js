const { pg, json, isAdminAuthorized } = require('./_supabase');

exports.handler = async (event) => {
  if (!isAdminAuthorized(event)) {
    return json(401, { success: false, message: 'Non autorisé.' });
  }

  try {
    const qs = event.queryStringParameters || {};
    let query = '/sales?select=*&order=created_at.desc&limit=2000';
    if (qs.from) query += '&created_at=gte.' + encodeURIComponent(qs.from);
    if (qs.to) query += '&created_at=lte.' + encodeURIComponent(qs.to);

    const res = await pg(query);
    if (!res.ok) {
      const text = await res.text();
      return json(res.status, { success: false, message: text });
    }
    const sales = await res.json();

    const counted = sales.filter(s => s.status !== 'annulee');

    let revenue = 0, cost = 0, deliveryFees = 0, ordersCount = counted.length;
    const perProduct = {};

    counted.forEach(s => {
      revenue += Number(s.total) || 0;
      cost += Number(s.cost_total) || 0;
      deliveryFees += Number(s.delivery_fee) || 0;
      (s.items || []).forEach(it => {
        const key = (it.model || 'inconnu') + '|' + (it.color || '');
        if (!perProduct[key]) perProduct[key] = { model: it.model, color: it.color, name: it.name, qty: 0, revenue: 0, cost: 0 };
        perProduct[key].qty += Number(it.qty) || 0;
        perProduct[key].revenue += (Number(it.unit_price) || 0) * (Number(it.qty) || 0);
        perProduct[key].cost += (Number(it.unit_cost) || 0) * (Number(it.qty) || 0);
      });
    });

    const profit = revenue - cost;
    const byStatus = {};
    sales.forEach(s => { byStatus[s.status] = (byStatus[s.status] || 0) + 1; });

    const topProducts = Object.values(perProduct)
      .map(p => ({ ...p, profit: p.revenue - p.cost }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 15);

    return json(200, {
      orders_count: ordersCount,
      revenue, cost, profit, delivery_fees: deliveryFees,
      margin_pct: revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : 0,
      by_status: byStatus,
      top_products: topProducts
    });
  } catch (err) {
    return json(500, { success: false, message: err.message });
  }
};
