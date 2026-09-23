// Clean API Client - Connected to Backend REST API (No demo data)

export const API_BASE = '/api/v1';

export async function fetchSummary() {
  try {
    const res = await fetch(`${API_BASE}/dashboard/summary`);
    const json = await res.json();
    if (json.success) return json.data;
  } catch (e) {
    console.warn('Backend API connection warning');
  }

  // Clean Zero State (No demo data)
  return {
    financialPulse: {
      totalCash: 0,
      totalBank: 0,
      totalAvailableBalance: 0,
      customerReceivables: 0,
      supplierPayables: 0,
      totalLoanOutstanding: 0,
      emiDue30Days: 0,
    },
    todaySummary: {
      casesSold: 0,
      revenue: 0,
      ordersCount: 0,
    },
    targetMeter: null,
    inventoryAlerts: {
      lowStockMaterialsCount: 0,
      lowStockMaterials: [],
      finishedGoodsCount: 0,
    },
    upcomingEmis: [],
  };
}

export async function fetchProducts() {
  try {
    const res = await fetch(`${API_BASE}/products`);
    const json = await res.json();
    if (json.success) return json.data;
  } catch (e) {}
  return [];
}

export async function fetchWholesalers() {
  try {
    const res = await fetch(`${API_BASE}/wholesalers`);
    const json = await res.json();
    if (json.success) return json.data;
  } catch (e) {}
  return [];
}
