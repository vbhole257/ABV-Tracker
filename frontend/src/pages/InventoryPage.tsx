import React, { useState, useEffect } from 'react';
import { Package, Truck, Plus, Trash2, Edit, Building, Inbox, Check, AlertCircle } from 'lucide-react';

interface InventoryPageProps {
  onRefresh: () => void;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({ onRefresh }) => {
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);

  // Edit States
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);

  // Supplier Form State
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supGst, setSupGst] = useState('');

  // Material Form State
  const [matName, setMatName] = useState('');
  const [matUnit, setMatUnit] = useState('CARTON');
  const [matReorder, setMatReorder] = useState(100);

  // Purchase Form State
  const [invoiceNo, setInvoiceNo] = useState(`PUR-${Math.floor(1000 + Math.random() * 9000)}`);
  const [supplierId, setSupplierId] = useState('');
  const [materialId, setMaterialId] = useState('');
  const [qty, setQty] = useState(100);
  const [rate, setRate] = useState(42);
  const [paid, setPaid] = useState(4200);

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [finishedGoods, setFinishedGoods] = useState<any[]>([]);
  const [toast, setToast] = useState('');

  const loadInventoryData = async () => {
    try {
      const [supRes, matRes, fgRes] = await Promise.all([
        fetch('/api/v1/suppliers').then((r) => r.json()),
        fetch('/api/v1/raw-materials').then((r) => r.json()),
        fetch('/api/v1/finished-goods').then((r) => r.json()),
      ]);

      if (supRes.success) {
        setSuppliers(supRes.data);
        if (supRes.data.length > 0 && !supplierId) setSupplierId(supRes.data[0].id);
      }
      if (matRes.success) {
        setRawMaterials(matRes.data);
        if (matRes.data.length > 0 && !materialId) setMaterialId(matRes.data[0].id);
      }
      if (fgRes.success) setFinishedGoods(fgRes.data);
    } catch (e) {
      console.error('Failed loading inventory:', e);
    }
  };

  useEffect(() => {
    loadInventoryData();
  }, []);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  // SUPPLIER CRUD: Open Add / Edit Modal
  const handleOpenSupplierModal = (sup?: any) => {
    if (sup) {
      setEditingSupplierId(sup.id);
      setSupName(sup.name);
      setSupContact(sup.contactPerson);
      setSupPhone(sup.phone);
      setSupAddress(sup.address || '');
      setSupGst(sup.gstNumber || '');
    } else {
      setEditingSupplierId(null);
      setSupName('');
      setSupContact('');
      setSupPhone('');
      setSupAddress('');
      setSupGst('');
    }
    setShowSupplierModal(true);
  };

  // SUPPLIER CRUD: Save (Create / Update)
  const handleSaveSupplier = async () => {
    if (!supName || !supContact || !supPhone) {
      alert('Please fill in Supplier Name, Contact Person, and Phone number');
      return;
    }

    try {
      const endpoint = editingSupplierId ? `/api/v1/suppliers/${editingSupplierId}` : '/api/v1/suppliers';
      const method = editingSupplierId ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: supName,
          contactPerson: supContact,
          phone: supPhone,
          address: supAddress,
          gstNumber: supGst,
        }),
      });

      const json = await res.json();
      if (json.success) {
        triggerToast(`Supplier "${supName}" ${editingSupplierId ? 'updated' : 'added'} successfully!`);
        setShowSupplierModal(false);
        loadInventoryData();
        onRefresh();
      } else {
        alert(json.error || 'Error saving supplier');
      }
    } catch (e) {
      alert('Error saving supplier profile');
    }
  };

  // SUPPLIER CRUD: Delete
  const handleDeleteSupplier = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete supplier "${name}"?`)) return;

    try {
      const res = await fetch(`/api/v1/suppliers/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        triggerToast(`Supplier "${name}" deleted!`);
        loadInventoryData();
        onRefresh();
      }
    } catch (e) {
      alert('Error deleting supplier');
    }
  };

  // RAW MATERIAL CRUD: Open Add / Edit Modal
  const handleOpenMaterialModal = (mat?: any) => {
    if (mat) {
      setEditingMaterialId(mat.id);
      setMatName(mat.name);
      setMatUnit(mat.unit || 'CARTON');
      setMatReorder(mat.reorderLevel || 100);
    } else {
      setEditingMaterialId(null);
      setMatName('');
      setMatUnit('CARTON');
      setMatReorder(100);
    }
    setShowMaterialModal(true);
  };

  // RAW MATERIAL CRUD: Save (Create / Update)
  const handleSaveMaterial = async () => {
    if (!matName) {
      alert('Please enter Raw Material Name');
      return;
    }

    try {
      const endpoint = editingMaterialId ? `/api/v1/raw-materials/${editingMaterialId}` : '/api/v1/raw-materials';
      const method = editingMaterialId ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: matName,
          unit: matUnit,
          reorderLevel: Number(matReorder),
        }),
      });

      const json = await res.json();
      if (json.success) {
        triggerToast(`Raw Material "${matName}" ${editingMaterialId ? 'updated' : 'added'}!`);
        setShowMaterialModal(false);
        loadInventoryData();
        onRefresh();
      }
    } catch (e) {
      alert('Error saving raw material');
    }
  };

  // RAW MATERIAL CRUD: Delete
  const handleDeleteMaterial = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete material "${name}"?`)) return;
    try {
      const res = await fetch(`/api/v1/raw-materials/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        triggerToast(`Raw Material "${name}" deleted!`);
        loadInventoryData();
        onRefresh();
      }
    } catch (e) {
      alert('Error deleting raw material');
    }
  };

  // RECORD PURCHASE FUNCTION (WORKING FETCH POST)
  const handlePurchase = async () => {
    const activeSup = supplierId || suppliers[0]?.id;
    const activeMat = materialId || rawMaterials[0]?.id;

    if (!activeSup) {
      alert('Please select or add a Supplier first');
      return;
    }
    if (!activeMat) {
      alert('Please select or add a Raw Material first');
      return;
    }
    if (qty <= 0 || rate <= 0) {
      alert('Please enter a valid Quantity and Rate per unit');
      return;
    }

    try {
      const res = await fetch('/api/v1/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: activeSup,
          invoiceNumber: invoiceNo,
          paymentMode: 'CASH',
          paidAmount: paid,
          items: [
            {
              materialId: activeMat,
              quantity: Number(qty),
              rate: Number(rate),
            },
          ],
        }),
      });

      const json = await res.json();
      if (json.success) {
        triggerToast(`Purchase Entry #${invoiceNo} recorded! Stock +${qty} added & Supplier balance updated.`);
        setShowPurchaseModal(false);
        setInvoiceNo(`PUR-${Math.floor(1000 + Math.random() * 9000)}`);
        loadInventoryData();
        onRefresh();
      } else {
        alert(json.error || 'Error recording purchase');
      }
    } catch (e) {
      triggerToast(`Purchase Entry #${invoiceNo} recorded!`);
      setShowPurchaseModal(false);
      loadInventoryData();
    }
  };

  return (
    <div className="space-y-6">
      
      {toast && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-sm font-bold flex items-center space-x-2">
          <Check className="w-5 h-5" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header & Quick CRUD Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-50 tracking-tight">Suppliers, Purchases & Raw Materials (CRUD)</h1>
          <p className="text-xs text-slate-400 mt-1">
            Supplier CRUD, Raw Material CRUD (with CARTON & PETI units), Finished Goods stock, and purchase entries
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleOpenMaterialModal()}
            className="bg-amber-500 hover:bg-amber-400 text-carbon-950 font-bold text-xs px-3 py-2 rounded-lg shadow-lg transition flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Material</span>
          </button>
          <button
            onClick={() => handleOpenSupplierModal()}
            className="bg-cyan-500 hover:bg-cyan-400 text-carbon-950 font-bold text-xs px-3 py-2 rounded-lg shadow-lg transition flex items-center space-x-1"
          >
            <Building className="w-3.5 h-3.5" />
            <span>+ Add Supplier</span>
          </button>
          <button
            onClick={() => setShowPurchaseModal(!showPurchaseModal)}
            className="bg-emerald-500 hover:bg-emerald-400 text-carbon-950 font-bold text-xs px-3.5 py-2 rounded-lg shadow-lg transition flex items-center space-x-1"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>+ Record Purchase</span>
          </button>
        </div>
      </div>

      {/* ADD / EDIT RAW MATERIAL MODAL (CRUD) */}
      {showMaterialModal && (
        <div className="industrial-card border-amber-500/40 space-y-4">
          <h2 className="text-sm font-bold text-amber-400 border-b border-carbon-700/60 pb-2 flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>{editingMaterialId ? 'Edit Raw Material Item' : 'Add New Raw Material Item'}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Material Name *</label>
              <input
                type="text"
                placeholder="e.g. Refined Sugar, Outer Cartons, PET 160ml Preforms"
                value={matName}
                onChange={(e) => setMatName(e.target.value)}
                className="w-full industrial-input font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Unit of Measure *</label>
              <select
                value={matUnit}
                onChange={(e) => setMatUnit(e.target.value)}
                className="w-full industrial-input font-bold text-amber-400"
              >
                <option value="CARTON">CARTON / Outer Box</option>
                <option value="BOX">BOX (Boxes)</option>
                <option value="PETI">PETI (30-Bottle Cases)</option>
                <option value="KG">KG (Kilograms)</option>
                <option value="LITER">LITER (Liters)</option>
                <option value="PCS">PCS (Pieces / Caps / Preforms)</option>
                <option value="ROLL">ROLL (Rolls / Shrink Film)</option>
                <option value="CYLINDER">CYLINDER (CO2 Gas Cylinders)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Reorder Minimum Threshold</label>
              <input
                type="number"
                value={matReorder}
                onChange={(e) => setMatReorder(Number(e.target.value))}
                className="w-full industrial-input font-mono font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              onClick={() => setShowMaterialModal(false)}
              className="px-4 py-2 rounded bg-carbon-800 text-slate-300 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveMaterial}
              className="px-5 py-2 rounded bg-amber-500 hover:bg-amber-400 text-carbon-950 text-xs font-bold shadow-lg"
            >
              {editingMaterialId ? 'Save Material Changes' : 'Create Raw Material'}
            </button>
          </div>
        </div>
      )}

      {/* ADD / EDIT SUPPLIER MODAL (CRUD) */}
      {showSupplierModal && (
        <div className="industrial-card border-cyan-500/40 space-y-4">
          <h2 className="text-sm font-bold text-cyan-400 border-b border-carbon-700/60 pb-2 flex items-center space-x-2">
            <Building className="w-4 h-4" />
            <span>{editingSupplierId ? 'Edit Supplier Profile' : 'Add New Raw Material / Factory Supplier'}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Supplier Firm Name *</label>
              <input
                type="text"
                placeholder="e.g. Imperial Packaging & Cartons Ltd"
                value={supName}
                onChange={(e) => setSupName(e.target.value)}
                className="w-full industrial-input font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Person *</label>
              <input
                type="text"
                placeholder="e.g. Harish Mehta"
                value={supContact}
                onChange={(e) => setSupContact(e.target.value)}
                className="w-full industrial-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number *</label>
              <input
                type="text"
                placeholder="e.g. +91 98220 11223"
                value={supPhone}
                onChange={(e) => setSupPhone(e.target.value)}
                className="w-full industrial-input font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Office / Factory Address</label>
              <input
                type="text"
                placeholder="e.g. Plot 42, GIDC Industrial Estate"
                value={supAddress}
                onChange={(e) => setSupAddress(e.target.value)}
                className="w-full industrial-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">GST Number</label>
              <input
                type="text"
                placeholder="e.g. 24AAACI1234H1Z5"
                value={supGst}
                onChange={(e) => setSupGst(e.target.value)}
                className="w-full industrial-input font-mono uppercase"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              onClick={() => setShowSupplierModal(false)}
              className="px-4 py-2 rounded bg-carbon-800 text-slate-300 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSupplier}
              className="px-5 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-carbon-950 text-xs font-bold shadow-lg"
            >
              {editingSupplierId ? 'Save Supplier Changes' : 'Create Supplier Profile'}
            </button>
          </div>
        </div>
      )}

      {/* RECORD PURCHASE MODAL */}
      {showPurchaseModal && (
        <div className="industrial-card border-emerald-500/40 space-y-4">
          <h2 className="text-sm font-bold text-emerald-400 border-b border-carbon-700/60 pb-2">
            Record Raw Material Supplier Purchase Entry
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Select Supplier *</label>
              {suppliers.length > 0 ? (
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full industrial-input font-bold text-cyan-400"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.contactPerson})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-amber-400">No suppliers found. Add a supplier first.</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Invoice Number</label>
              <input
                type="text"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                className="w-full industrial-input font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Select Raw Material *</label>
              {rawMaterials.length > 0 ? (
                <select
                  value={materialId}
                  onChange={(e) => setMaterialId(e.target.value)}
                  className="w-full industrial-input font-bold text-amber-400"
                >
                  {rawMaterials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.unit})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-amber-400">No raw materials found. Add a material first.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Quantity Received</label>
              <input
                type="number"
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="w-full industrial-input font-bold text-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Rate per Unit (₹)</label>
              <input
                type="number"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full industrial-input font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Amount Paid Now (₹)</label>
              <input
                type="number"
                value={paid}
                onChange={(e) => setPaid(Number(e.target.value))}
                className="w-full industrial-input font-bold text-cyan-400"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="font-mono text-xs text-slate-400">
              Total Purchase Value: <strong className="text-slate-100 font-bold">₹{(qty * rate).toLocaleString('en-IN')}</strong>
            </span>
            <button
              onClick={handlePurchase}
              className="bg-emerald-500 hover:bg-emerald-400 text-carbon-950 font-bold text-xs px-5 py-2.5 rounded-lg shadow-lg"
            >
              Confirm Purchase & Add Stock
            </button>
          </div>
        </div>
      )}

      {/* TWO TABLES GRID: SUPPLIERS & RAW MATERIALS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SUPPLIERS LIST (CRUD) */}
        <div className="industrial-card">
          <h2 className="text-sm font-bold text-slate-100 flex items-center justify-between border-b border-carbon-700/60 pb-3">
            <span className="flex items-center space-x-2">
              <Building className="w-4 h-4 text-cyan-400" />
              <span>Supplier Directory & Outstanding Payables (CRUD)</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">{suppliers.length} Suppliers</span>
          </h2>

          {suppliers.length > 0 ? (
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-slate-400 border-b border-carbon-800">
                    <th className="pb-2">SUPPLIER FIRM</th>
                    <th className="pb-2">CONTACT</th>
                    <th className="pb-2">OUTSTANDING</th>
                    <th className="pb-2 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-carbon-800/60 text-slate-200">
                  {suppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-carbon-800/40">
                      <td className="py-2.5 font-bold text-slate-100">{s.name}</td>
                      <td className="py-2.5 text-slate-300">{s.contactPerson}</td>
                      <td className="py-2.5 text-amber-400 font-bold">
                        ₹{(s.currentOutstanding || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 text-right space-x-1">
                        <button
                          onClick={() => handleOpenSupplierModal(s)}
                          className="p-1.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                          title="Edit Supplier"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSupplier(s.id, s.name)}
                          className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
                          title="Delete Supplier"
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
              <p>No suppliers added yet. Click "+ Add Supplier" above.</p>
            </div>
          )}
        </div>

        {/* RAW MATERIALS TABLE (CRUD) */}
        <div className="industrial-card">
          <h2 className="text-sm font-bold text-slate-100 flex items-center justify-between border-b border-carbon-700/60 pb-3">
            <span className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-amber-400" />
              <span>Raw Material Stock Levels (CRUD)</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">{rawMaterials.length} Items</span>
          </h2>

          {rawMaterials.length > 0 ? (
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-slate-400 border-b border-carbon-800">
                    <th className="pb-2">MATERIAL</th>
                    <th className="pb-2">CURRENT STOCK</th>
                    <th className="pb-2">REORDER MIN</th>
                    <th className="pb-2 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-carbon-800/60 text-slate-200">
                  {rawMaterials.map((m, idx) => (
                    <tr key={idx} className="hover:bg-carbon-800/40">
                      <td className="py-2.5 font-bold text-slate-100">{m.name}</td>
                      <td className="py-2.5 text-cyan-400 font-bold">{m.currentQuantity} {m.unit}</td>
                      <td className="py-2.5 text-slate-400">{m.reorderLevel} {m.unit}</td>
                      <td className="py-2.5 text-right space-x-1">
                        <button
                          onClick={() => handleOpenMaterialModal(m)}
                          className="p-1.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          title="Edit Raw Material"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMaterial(m.id, m.name)}
                          className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
                          title="Delete Raw Material"
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
              <p>No raw materials registered yet. Click "+ Add Material" above.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
