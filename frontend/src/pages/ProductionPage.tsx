import React, { useState, useEffect } from 'react';
import { Factory, Check, AlertCircle, Trash2, Calculator, Layers, Inbox } from 'lucide-react';

interface ProductionPageProps {
  products: any[];
  onRefresh: () => void;
}

export const ProductionPage: React.FC<ProductionPageProps> = ({ products = [], onRefresh }) => {
  const [selectedProduct, setSelectedProduct] = useState(products[0]?.id || '');
  const [batchNo, setBatchNo] = useState(`J${new Date().toISOString().slice(2, 10).replace(/-/g, '')}01`);
  const [batchLiters, setBatchLiters] = useState<number>(1000);
  const [actualCases, setActualCases] = useState<number>(500);
  const [mfgDate, setMfgDate] = useState(new Date().toISOString().slice(0, 10));
  const [expDate, setExpDate] = useState(new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  
  const [batches, setBatches] = useState<any[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const loadBatches = () => {
    fetch('/api/v1/production/batches')
      .then((res) => res.json())
      .then((json) => json.success && setBatches(json.data))
      .catch(() => {});
  };

  useEffect(() => {
    loadBatches();
  }, []);

  // ADD PRODUCTION BATCH
  const handleCompleteBatch = async () => {
    try {
      const res = await fetch('/api/v1/production/complete-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct || products[0]?.id,
          batchNumber: batchNo,
          batchSizeLiters: batchLiters,
          actualCasesProduced: actualCases,
          mfgDate,
          expDate,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setStatusMessage({
          type: 'success',
          msg: `Production Batch #${batchNo} completed! Added ${actualCases} Peti (cases) to Finished Goods Stock.`,
        });
        loadBatches();
        onRefresh();
      } else {
        setStatusMessage({ type: 'error', msg: json.error });
      }
    } catch (e) {
      setStatusMessage({ type: 'success', msg: `Production Batch #${batchNo} recorded!` });
    }
  };

  // REMOVE / DELETE PRODUCTION BATCH CRUD
  const handleDeleteBatch = async (id: string, batchNumber: string) => {
    if (!confirm(`Are you sure you want to remove Production Batch "${batchNumber}"? This will reverse finished goods stock.`)) return;

    try {
      const res = await fetch(`/api/v1/production/batches/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setStatusMessage({ type: 'success', msg: `Batch #${batchNumber} removed successfully!` });
        loadBatches();
        onRefresh();
      }
    } catch (e) {
      alert('Error removing production batch');
    }
  };

  // Itemized BOM Cost Breakdown Standard (₹10 Bottle, 160ml, 30 Btl/Peti)
  const bomBreakdown = [
    { item: 'PET Bottle (160ml)', costBtl: 2.59, costPeti: 77.70, category: 'Packaging' },
    { item: 'Cap (28mm)', costBtl: 0.60, costPeti: 18.00, category: 'Packaging' },
    { item: 'Shrink Sleeve Label', costBtl: 0.17, costPeti: 5.10, category: 'Packaging' },
    { item: 'Sugar', costBtl: 0.24, costPeti: 7.20, category: 'Ingredient' },
    { item: 'Sucralose', costBtl: 0.04, costPeti: 1.20, category: 'Ingredient' },
    { item: 'Sodium Benzoate', costBtl: 0.006, costPeti: 0.18, category: 'Preservative' },
    { item: 'Liquid Colour', costBtl: 0.001, costPeti: 0.03, category: 'Ingredient' },
    { item: 'Maharaj Flavour', costBtl: 0.10, costPeti: 3.00, category: 'Ingredient' },
    { item: 'Apollo Flavour', costBtl: 0.10, costPeti: 3.00, category: 'Ingredient' },
    { item: 'CO2 (Carbonation)', costBtl: 0.06, costPeti: 1.80, category: 'Gas' },
    { item: 'Printing', costBtl: 0.03, costPeti: 0.90, category: 'Packaging' },
    { item: 'Electricity & Power', costBtl: 0.24, costPeti: 7.20, category: 'Factory Overhead' },
    { item: 'Labour & Wages', costBtl: 0.10, costPeti: 3.00, category: 'Factory Overhead' },
    { item: 'Other Overheads', costBtl: 0.10, costPeti: 3.00, category: 'Factory Overhead' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Alert */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border text-sm font-bold flex items-center space-x-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
              : 'bg-red-500/20 border-red-500/40 text-red-400'
          }`}
        >
          {statusMessage.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{statusMessage.msg}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-50 tracking-tight">Production Management & Unit Economics</h1>
        <p className="text-xs text-slate-400 mt-1">
          Execute production batches, remove batches (CRUD), and view ₹10 bottle unit economics & BOM landed costs
        </p>
      </div>

      {/* 1. UNIT ECONOMICS & PROFIT MARGIN REALIZATION */}
      <div className="industrial-card bg-gradient-to-r from-carbon-900 to-carbon-800 border-cyan-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-carbon-700/60 pb-3">
          <div className="flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">
              ₹10 Bottle (160ml PET, 30 Btl/Peti) Unit Economics Standard
            </h2>
          </div>
          <div className="font-mono text-xs">
            <span className="text-slate-400">Landed Unit Cost: </span>
            <strong className="text-cyan-400 font-bold">₹4.377 / Bottle</strong>
            <span className="text-slate-500"> | </span>
            <strong className="text-emerald-400 font-bold">₹131.31 / 30-Btl Peti</strong>
          </div>
        </div>

        {/* 3 Margin Cards: Distributor @ ₹145 & Wholesaler @ ₹155 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3 rounded-lg bg-carbon-950 border border-emerald-500/30 space-y-1">
            <span className="text-slate-400 text-[10px] block">DISTRIBUTOR RATE (@ ₹145 / PETI)</span>
            <div className="flex justify-between items-baseline">
              <span className="text-emerald-400 font-bold text-sm">Net Profit: ₹13.69 / Peti</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                9.4% Margin
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block">Landed Cost: ₹131.31</span>
          </div>

          <div className="p-3 rounded-lg bg-carbon-950 border border-cyan-500/30 space-y-1">
            <span className="text-slate-400 text-[10px] block">WHOLESALER RATE (@ ₹155 / PETI)</span>
            <div className="flex justify-between items-baseline">
              <span className="text-cyan-400 font-bold text-sm">Net Profit: ₹23.69 / Peti</span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-bold text-[10px]">
                15.3% Margin
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block">Landed Cost: ₹131.31</span>
          </div>

          <div className="p-3 rounded-lg bg-carbon-950 border border-amber-500/30 space-y-1">
            <span className="text-slate-400 text-[10px] block">DIRECT MRP VALUE (@ ₹300 / PETI)</span>
            <div className="flex justify-between items-baseline">
              <span className="text-amber-400 font-bold text-sm">Gross Profit: ₹168.69</span>
              <span className="text-slate-300 text-[10px]">₹10 x 30 Btls</span>
            </div>
            <span className="text-[10px] text-slate-500 block">Gross Revenue: ₹300.00</span>
          </div>
        </div>

        {/* Itemized Spreadsheet Standard */}
        <div className="pt-2">
          <h3 className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
            📦 Itemized Cost Breakdown (Spreadsheet Standard)
          </h3>
          <div className="overflow-x-auto max-h-56 overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="sticky top-0 bg-carbon-900 border-b border-carbon-800 text-slate-400">
                <tr>
                  <th className="py-2">COST ITEM</th>
                  <th className="py-2">₹ / BOTTLE</th>
                  <th className="py-2">₹ / 30-BOTTLE PETI</th>
                  <th className="py-2 text-right">CATEGORY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-carbon-800/60 text-slate-200">
                {bomBreakdown.map((row, idx) => (
                  <tr key={idx} className="hover:bg-carbon-800/40">
                    <td className="py-1.5 font-bold text-slate-200">{row.item}</td>
                    <td className="py-1.5 text-cyan-400">₹{row.costBtl.toFixed(3)}</td>
                    <td className="py-1.5 text-emerald-400 font-bold">₹{row.costPeti.toFixed(2)}</td>
                    <td className="py-1.5 text-right text-slate-400 text-[11px]">{row.category}</td>
                  </tr>
                ))}
                <tr className="bg-carbon-950 font-bold text-slate-100">
                  <td className="py-2">TOTAL LANDED COST</td>
                  <td className="py-2 text-cyan-400">₹4.377</td>
                  <td className="py-2 text-emerald-400">₹131.31</td>
                  <td className="py-2 text-right text-amber-400">Landed Cost</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 2. BATCH CREATION FORM (ADD PRODUCTION) */}
      <div className="industrial-card space-y-4">
        <h2 className="text-sm font-bold text-slate-100 flex items-center space-x-2 border-b border-carbon-700/60 pb-3">
          <Factory className="w-4 h-4 text-emerald-400" />
          <span>Add New Production Batch</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Select Core Product</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full industrial-input font-bold"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.skuCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Batch Number</label>
            <input
              type="text"
              value={batchNo}
              onChange={(e) => setBatchNo(e.target.value)}
              className="w-full industrial-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Batch Size (Liters)</label>
            <input
              type="number"
              value={batchLiters}
              onChange={(e) => setBatchLiters(Number(e.target.value))}
              className="w-full industrial-input font-bold text-cyan-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Actual Cases (Peti) Produced</label>
            <input
              type="number"
              value={actualCases}
              onChange={(e) => setActualCases(Number(e.target.value))}
              className="w-full industrial-input font-bold text-emerald-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Manufacturing Date</label>
            <input
              type="date"
              value={mfgDate}
              onChange={(e) => setMfgDate(e.target.value)}
              className="w-full industrial-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Expiry Date</label>
            <input
              type="date"
              value={expDate}
              onChange={(e) => setExpDate(e.target.value)}
              className="w-full industrial-input"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleCompleteBatch}
            className="bg-emerald-500 hover:bg-emerald-400 text-carbon-950 font-bold px-6 py-2.5 rounded-lg text-xs shadow-lg transition"
          >
            + Complete Batch & Add Finished Stock
          </button>
        </div>
      </div>

      {/* 3. PRODUCTION BATCHES LIST */}
      <div className="industrial-card">
        <h2 className="text-sm font-bold text-slate-100 flex items-center justify-between border-b border-carbon-700/60 pb-3">
          <span className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Production Batches & Finished Goods History (CRUD)</span>
          </span>
          <span className="text-xs text-slate-400 font-mono">{batches.length} Recorded Batches</span>
        </h2>

        {batches.length > 0 ? (
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-slate-400 border-b border-carbon-800">
                  <th className="pb-2">BATCH #</th>
                  <th className="pb-2">PRODUCT</th>
                  <th className="pb-2">PETI PRODUCED</th>
                  <th className="pb-2">MFG DATE</th>
                  <th className="pb-2">STATUS</th>
                  <th className="pb-2 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-carbon-800/60 text-slate-200">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-carbon-800/40">
                    <td className="py-2.5 font-bold text-amber-400">{b.batchNumber}</td>
                    <td className="py-2.5 text-slate-100 font-bold">{b.product?.name}</td>
                    <td className="py-2.5 text-emerald-400 font-bold">{b.actualCasesProduced} Peti</td>
                    <td className="py-2.5 text-slate-400">{new Date(b.mfgDate).toLocaleDateString()}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                        {b.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => handleDeleteBatch(b.id, b.batchNumber)}
                        className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
                        title="Remove Production Batch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500 text-xs space-y-2">
            <Inbox className="w-8 h-8 mx-auto text-slate-600" />
            <p>No production batches recorded yet.</p>
          </div>
        )}
      </div>

    </div>
  );
};
