import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { SalesPage } from './pages/SalesPage';
import { ProductionPage } from './pages/ProductionPage';
import { InventoryPage } from './pages/InventoryPage';
import { FinancePage } from './pages/FinancePage';
import { PayrollExpensesPage } from './pages/PayrollExpensesPage';
import { fetchSummary, fetchProducts, fetchWholesalers } from './api/client';

export function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [summary, setSummary] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [wholesalers, setWholesalers] = useState<any[]>([]);
  const [openNewSaleModal, setOpenNewSaleModal] = useState(false);

  const loadData = async () => {
    const s = await fetchSummary();
    const p = await fetchProducts();
    const w = await fetchWholesalers();
    setSummary(s);
    setProducts(p);
    setWholesalers(w);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenNewSale = () => {
    setActiveTab('sales');
    setOpenNewSaleModal(true);
  };

  return (
    <div className="min-h-screen bg-carbon-950 text-slate-100 flex flex-col">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        summaryData={summary}
        onOpenNewSale={handleOpenNewSale}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardPage
            summary={summary}
            onNavigateTab={setActiveTab}
            onOpenNewSale={handleOpenNewSale}
          />
        )}

        {activeTab === 'sales' && (
          <SalesPage
            products={products}
            wholesalers={wholesalers}
            onRefresh={loadData}
            openNewSaleModal={openNewSaleModal}
          />
        )}

        {activeTab === 'production' && (
          <ProductionPage products={products} onRefresh={loadData} />
        )}

        {activeTab === 'inventory' && (
          <InventoryPage onRefresh={loadData} />
        )}

        {activeTab === 'finance' && (
          <FinancePage summary={summary} onRefresh={loadData} />
        )}

        {activeTab === 'payroll' && (
          <PayrollExpensesPage onRefresh={loadData} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-carbon-800 py-4 text-center text-xs text-slate-500 font-mono">
        AbvFoods Tracker v1.1.0 • Cold Drink Manufacturing & B2B Wholesaler Management System
      </footer>
    </div>
  );
}

export default App;
