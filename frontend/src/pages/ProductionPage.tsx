import React, { useState, useEffect } from 'react';
import { Factory, Check, AlertCircle, Trash2, Edit, Calculator, Layers, Inbox } from 'lucide-react';

interface ProductionPageProps {
  products: any[];
  onRefresh: () => void;
}

export const ProductionPage: React.FC<ProductionPageProps> = ({ products: initialProducts = [], onRefresh }) => {
  const [productList, setProductList] = useState<any[]>(initialProducts);
  const [selectedProduct, setSelectedProduct] = useState(initialProducts[0]?.id || '');
  const [batchNo, setBatchNo] = useState(`J${new Date().toISOString().slice(2, 10).replace(/-/g, '')}01`);
  const [batchLiters, setBatchLiters] = useState<number>(1000);
  const [actualCases, setActualCases] = useState<number>(500);
  const [mfgDate, setMfgDate] = useState(new Date().toISOString().slice(0, 10));
  const [expDate, setExpDate] = useState(new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  
  const [batches, setBatches] = useState<any[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Edit Batch Modal State
  const [editingBatch, setEditingBatch] = useState<any | null>(null);
  const [editBatchNo, setEditBatchNo] = useState('');
  const [editCases, setEditCases] = useState(500);

  // Edit Product Pricing Modal State
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodMrp, setProdMrp] = useState(10);
  const [prodRate, setProdRate] = useState(145);

  const loadData = async () => {
    try {
      const [bRes, pRes] = await Promise.all([
        fetch('/api/v1/production/batches').then((r) => r.json()),
        fetch('/api/v1/products').then((r) => r.json()),
      ]);

      if (bRes.success) setBatches(bRes.data);
      if (pRes.success && pRes.data.length > 0) {
        setProductList(pRes.data);
        if (!selectedProduct) setSelectedProduct(pRes.data[0].id);
      }
    } catch (e) {
      console.error('Failed loading production data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync selectedProduct if initialProducts updates
  useEffect(() => {
    if (initialProducts.length > 0) {
      setProductList(initialProducts);
      if (!selectedProduct) setSelectedProduct(initialProducts[0].id);
    }
  }, [initialProducts]);

  // ADD PRODUCTION BATCH (FIXED WORKING FUNCTION)
  const handleCompleteBatch = async () => {
    const activeProdId = selectedProduct || productList[0]?.id;

    if (!activeProdId) {
      setStatusMessage({ type: 'error', msg: 'Please select a core product first.' });
      return;
    }

    try {
      const res = await fetch('/api/v1/production/complete-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: activeProdId,
          batchNumber: batchNo,
          batchSizeLiters: Number(batchLiters),
          actualCasesProduced: Number(actualCases),
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
        setBatchNo(`J${new Date().toISOString().slice(2, 10).replace(/-/g, '')}${Math.floor(10 + Math.random() * 90)}`);
        loadData();
        onRefresh();
      } else {
        setStatusMessage({ type: 'error', msg: json.error || 'Failed recording batch.' });
      }
    } catch (e) {
      setStatusMessage({ type: 'error', msg: 'Network error completing production batch.' });
    }
  };

  // EDIT PRODUCTION BATCH CRUD
  const handleOpenEditBatch = (batch: any) => {
    setEditingBatch(batch);
    setEditBatchNo(batch.batchNumber);
    setEditCases(batch.actualCasesProduced);
  };

  const handleSaveBatchEdit = async () => {
    if (!editingBatch) return;

    try {
      const res = await fetch(`/api/v1/production/batches/${editingBatch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchNumber: editBatchNo,
          actualCasesProduced: Number(editCases),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setStatusMessage({ type: 'success', msg: `Production Batch #${editBatchNo} updated successfully!` });
        setEditingBatch(null);
        loadData();
        onRefresh();
      } else {
        setStatusMessage({ type: 'error', msg: json.error || 'Failed updating batch.' });
      }
    } catch (e) {
      setStatusMessage({ type: 'error', msg: 'Error updating batch' });
    }
  };

  // DELETE PRODUCTION BATCH CRUD
  const handleDeleteBatch = async (id: string, batchNumber: string) => {
    if (!confirm(`Are you sure you want to remove Production Batch "${batchNumber}"? This will reverse finished goods stock.`)) return;

    try {
      const res = await fetch(`/api/v1/production/batches/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setStatusMessage({ type: 'success', msg: `Batch #${batchNumber} removed successfully!` });
        loadData();
        onRefresh();
      }
    } catch (e) {
      alert('Error removing production batch');
    }
  };

  // EDIT PRODUCT PRICING CRUD
  const handleOpenEditProduct = (prod: any) => {
    setEditingProduct(prod);
    setProdName(prod.name);
    setProdMrp(prod.mrpPerBottle || 10);
    setProdRate(prod.defaultPricePerCase || 145);
  };

  const handleSaveProductEdit = async () => {
    if (!editingProduct) return;

    try {
      const res = await fetch(`/api/v1/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: prodName,
          mrpPerBottle: Number(prodMrp),
          defaultPricePerCase: Number(prodRate),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setStatusMessage({ type: 'success', msg: `Product "${prodName}" updated successfully!` });
        setEditingProduct(null);
        loadData();
        onRefresh();
      }
    } catch (e) {
      alert('Error updating product rates');
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
          Execute production batches, edit batch details (CRUD), and view ₹10 bottle unit economics & BOM landed costs
        </p>
      </div>

      {/* CORE PRODUCTS LIST & PRICE EDITING */}
      <div className="industrial-card">
        <h2 className="text-sm font-bold text-slate-100 flex items-center justify-between border-b border-carbon-700/60 pb-3">
          <span>Core Products & Default Rates (CRUD)</span>
          <span className="text-xs text-slate-400 font-mono">{productList.length} Products</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
          {productList.map((prod) => (
            <div key={prod.id} className="p-3 rounded-lg bg-carbon-900 border border-carbon-800 flex justify-between items-center">
              <div>
                <div className="font-bold text-slate-100 text-sm">{prod.name}</div>
                <div className="text-xs text-slate-400">SKU: {prod.skuCode} | MRP: ₹{prod.mrpPerBottle}/btl</div>
                <div className="text-xs text-cyan-400 font-bold font-mono">Default Rate: ₹{prod.defaultPricePerCase}/Peti</div>
              </div>
              <button
                onClick={() => handleOpenEditProduct(prod)}
                className="px-3 py-1.5 rounded bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs font-bold flex items-center space-x-1"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Rate</span>
              </button>
            </div>
          ))}
        </div>
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
            <label className="block text-xs font-semibold text-slate-300 mb-1">Select Core Product *</label>
            {productList.length > 0 ? (
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full industrial-input font-bold text-cyan-400"
              >
                {productList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.skuCode})
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-amber-400">Loading products...</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Batch Number</label>
            <input
              type="text"
              value={batchNo}
              onChange={(e) => setBatchNo(e.target.value)}
              className="w-full industrial-input font-mono"
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
                  <th className="pb-2 text-right">ACTIONS</th>
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
                    <td className="py-2.5 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEditBatch(b)}
                        className="p-1.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        title="Edit Batch Details"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
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

      {/* MODAL: EDIT PRODUCTION BATCH */}
      {editingBatch && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="industrial-card border-cyan-500/40 w-full max-w-md space-y-4">
            <h2 className="text-sm font-bold text-cyan-400 border-b border-carbon-700/60 pb-2">
              Edit Production Batch #{editingBatch.batchNumber}
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Batch Number</label>
                <input
                  type="text"
                  value={editBatchNo}
                  onChange={(e) => setEditBatchNo(e.target.value)}
                  className="w-full industrial-input font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Actual Cases (Peti) Produced</label>
                <input
                  type="number"
                  value={editCases}
                  onChange={(e) => setEditCases(Number(e.target.value))}
                  className="w-full industrial-input font-mono font-bold text-emerald-400"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-carbon-800">
              <button
                onClick={() => setEditingBatch(null)}
                className="px-4 py-2 rounded bg-carbon-800 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBatchEdit}
                className="px-5 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-carbon-950 text-xs font-bold shadow-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PRODUCT RATES */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="industrial-card border-cyan-500/40 w-full max-w-md space-y-4">
            <h2 className="text-sm font-bold text-cyan-400 border-b border-carbon-700/60 pb-2">
              Edit Product: {editingProduct.name}
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Product Name</label>
                <input
                  type="text"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full industrial-input font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">MRP per Bottle (₹)</label>
                <input
                  type="number"
                  value={prodMrp}
                  onChange={(e) => setProdMrp(Number(e.target.value))}
                  className="w-full industrial-input font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Default Rate per Peti (₹)</label>
                <input
                  type="number"
                  value={prodRate}
                  onChange={(e) => setProdRate(Number(e.target.value))}
                  className="w-full industrial-input font-mono font-bold text-cyan-400"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-carbon-800">
              <button
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 rounded bg-carbon-800 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProductEdit}
                className="px-5 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-carbon-950 text-xs font-bold shadow-lg"
              >
                Save Product Rates
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
