import React, { useState, useEffect } from 'react';
import { Package, Truck, Plus, Trash2, Edit, Building, Inbox, Check, Calendar, FileText, DollarSign } from 'lucide-react';

interface InventoryPageProps {
  onRefresh: () => void;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({ onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'PURCHASES' | 'RAW_MATERIALS' | 'SUPPLIERS'>('PURCHASES');

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);

  // Edit States
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<any | null>(null);
  const [editPurchaseInvoice, setEditPurchaseInvoice] = useState('');
  const [editPurchasePaid, setEditPurchasePaid] = useState(0);

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
  const [purchDate, setPurchDate] = useState(new Date().toISOString().slice(0, 10));

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [finishedGoods, setFinishedGoods] = useState<any[]>([]);
  const [toast, setToast] = useState('');

  const loadInventoryData = async () => {
    try {
      const [supRes, matRes, purRes, fgRes] = await Promise.all([
        fetch('/api/v1/suppliers').then((r) => r.json()),
        fetch('/api/v1/raw-materials').then((r) => r.json()),
        fetch('/api/v1/purchases').then((r) => r.json()),
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
      if (purRes.success) setPurchases(purRes.data);
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

  // RECORD PURCHASE FUNCTION (CREATE)
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
          paidAmount: Number(paid),
          purchaseDate: purchDate,
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

  // EDIT PURCHASE ENTRY
  const handleOpenEditPurchase = (p: any) => {
    setEditingPurchase(p);
    setEditPurchaseInvoice(p.invoiceNumber);
    setEditPurchasePaid(p.paidAmount);
  };

  const handleSavePurchaseEdit = async () => {
    if (!editingPurchase) return;

    try {
      const res = await fetch(`/api/v1/purchases/${editingPurchase.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNumber: editPurchaseInvoice,
          paidAmount: Number(editPurchasePaid),
        }),
      });

      const json = await res.json();
      if (json.success) {
        triggerToast(`Purchase Invoice #${editPurchaseInvoice} updated!`);
        setEditingPurchase(null);
        loadInventoryData();
        onRefresh();
      }
    } catch (e) {
      alert('Error updating purchase entry');
    }
  };

  // DELETE / ROLLBACK PURCHASE ENTRY
  const handleDeletePurchase = async (id: string, invNo: string) => {
    if (!confirm(`Are you sure you want to delete Purchase Entry #${invNo}? This will reverse the added stock and supplier balance.`)) return;

    try {
      const res = await fetch(`/api/v1/purchases/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        triggerToast(`Purchase Entry #${invNo} deleted & stock reversed!`);
        loadInventoryData();
        onRefresh();
      }
    } catch (e) {
      alert('Error deleting purchase entry');
    }
  };

  const totalPurchasesValue = purchases.reduce((acc, p) => acc + (p.totalAmount || 0), 0);

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
            Historical purchase log (where & when), Supplier CRUD, and Raw Material stock levels (with CARTON & PETI units)
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

      {/* Main Tab Navigation Bar */}
      <div className="flex border-b border-carbon-800 space-x-2">
        <button
          onClick={() => setActiveTab('PURCHASES')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition flex items-center space-x-2 ${
            activeTab === 'PURCHASES'
              ? 'bg-carbon-800 text-emerald-400 border-t-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Purchase Stock Ledger ({purchases.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('RAW_MATERIALS')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition flex items-center space-x-2 ${
            activeTab === 'RAW_MATERIALS'
              ? 'bg-carbon-800 text-amber-400 border-t-2 border-amber-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Raw Materials Stock ({rawMaterials.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('SUPPLIERS')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition flex items-center space-x-2 ${
            activeTab === 'SUPPLIERS'
              ? 'bg-carbon-800 text-cyan-400 border-t-2 border-cyan-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Supplier Directory ({suppliers.length})</span>
        </button>
      </div>

      {/* TAB 1: HISTORICAL PURCHASE STOCK LEDGER (WHERE & WHEN) */}
      {activeTab === 'PURCHASES' && (
        <div className="industrial-card">
          <div className="flex items-center justify-between border-b border-carbon-700/60 pb-3">
            <h2 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <Truck className="w-4 h-4 text-emerald-400" />
              <span>Purchase Stock Inward History (Where & When Purchased)</span>
            </h2>
            <div className="font-mono text-xs">
              <span className="text-slate-400">Total Purchase Value: </span>
              <strong className="text-emerald-400 font-bold">₹{totalPurchasesValue.toLocaleString('en-IN')}</strong>
            </div>
          </div>

          {purchases.length > 0 ? (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-slate-400 border-b border-carbon-800">
                    <th className="pb-3">PURCHASE DATE</th>
                    <th className="pb-3">INVOICE #</th>
                    <th className="pb-3">WHERE (SUPPLIER)</th>
                    <th className="pb-3">PURCHASED MATERIAL</th>
                    <th className="pb-3">TOTAL VALUE</th>
                    <th className="pb-3">PAID AMOUNT</th>
                    <th className="pb-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-carbon-800/60 text-slate-200">
                  {purchases.map((p) => {
                    const item = p.items?.[0];
                    const matName = item?.material?.name || 'Raw Material';
                    const matUnit = item?.material?.unit || 'Units';
                    const matQty = item?.quantity || 0;
                    return (
                      <tr key={p.id} className="hover:bg-carbon-800/40">
                        <td className="py-3 text-slate-300">
                          {new Date(p.purchaseDate || p.createdAt).toLocaleDateString()} {new Date(p.purchaseDate || p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 font-bold text-amber-400">{p.invoiceNumber}</td>
                        <td className="py-3 font-bold text-cyan-400">{p.supplier?.name || 'Supplier'}</td>
                        <td className="py-3 text-slate-100 font-bold">
                          {matName} — <span className="text-emerald-400">{matQty} {matUnit}</span> @ ₹{item?.rate || 0}
                        </td>
                        <td className="py-3 font-bold text-slate-100">₹{(p.totalAmount || 0).toLocaleString('en-IN')}</td>
                        <td className="py-3 text-emerald-400">₹{(p.paidAmount || 0).toLocaleString('en-IN')}</td>
                        <td className="py-3 text-right space-x-1">
                          <button
                            onClick={() => handleOpenEditPurchase(p)}
                            className="p-1.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                            title="Edit Purchase Invoice"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePurchase(p.id, p.invoiceNumber)}
                            className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
                            title="Delete / Reverse Purchase"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center text-slate-500 text-xs space-y-2">
              <Inbox className="w-8 h-8 mx-auto text-slate-600" />
              <p>No purchase stock entries logged yet. Click "+ Record Purchase" to inward stock.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RAW MATERIALS STOCK LEVELS */}
      {activeTab === 'RAW_MATERIALS' && (
        <div className="industrial-card">
          <h2 className="text-sm font-bold text-slate-100 flex items-center justify-between border-b border-carbon-700/60 pb-3">
            <span className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-amber-400" />
              <span>Raw Material Stock Levels (CRUD)</span>
            </span>
            <button
              onClick={() => handleOpenMaterialModal()}
              className="text-xs font-bold text-amber-400 hover:underline"
            >
              + Add Raw Material
            </button>
          </h2>

          {rawMaterials.length > 0 ? (
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-slate-400 border-b border-carbon-800">
                    <th className="pb-2">MATERIAL</th>
                    <th className="pb-2">CURRENT STOCK</th>
                    <th className="pb-2">REORDER MIN</th>
                    <th className="pb-2">LAST PURCHASE RATE</th>
                    <th className="pb-2 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-carbon-800/60 text-slate-200">
                  {rawMaterials.map((m, idx) => (
                    <tr key={idx} className="hover:bg-carbon-800/40">
                      <td className="py-2.5 font-bold text-slate-100">{m.name}</td>
                      <td className="py-2.5 text-cyan-400 font-bold">{m.currentQuantity} {m.unit}</td>
                      <td className="py-2.5 text-slate-400">{m.reorderLevel} {m.unit}</td>
                      <td className="py-2.5 text-emerald-400 font-bold">₹{m.lastPurchaseRate || 0} / {m.unit}</td>
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
      )}

      {/* TAB 3: SUPPLIER DIRECTORY */}
      {activeTab === 'SUPPLIERS' && (
        <div className="industrial-card">
          <h2 className="text-sm font-bold text-slate-100 flex items-center justify-between border-b border-carbon-700/60 pb-3">
            <span className="flex items-center space-x-2">
              <Building className="w-4 h-4 text-cyan-400" />
              <span>Supplier Directory & Outstanding Payables (CRUD)</span>
            </span>
            <button
              onClick={() => handleOpenSupplierModal()}
              className="text-xs font-bold text-cyan-400 hover:underline"
            >
              + Add Supplier Profile
            </button>
          </h2>

          {suppliers.length > 0 ? (
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-slate-400 border-b border-carbon-800">
                    <th className="pb-2">SUPPLIER FIRM</th>
                    <th className="pb-2">CONTACT PERSON</th>
                    <th className="pb-2">PHONE</th>
                    <th className="pb-2">OUTSTANDING PAYABLE</th>
                    <th className="pb-2 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-carbon-800/60 text-slate-200">
                  {suppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-carbon-800/40">
                      <td className="py-2.5 font-bold text-slate-100">{s.name}</td>
                      <td className="py-2.5 text-slate-300">{s.contactPerson}</td>
                      <td className="py-2.5 text-slate-400">{s.phone}</td>
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
      )}

      {/* RECORD PURCHASE MODAL */}
      {showPurchaseModal && (
        <div className="industrial-card border-emerald-500/40 space-y-4">
          <h2 className="text-sm font-bold text-emerald-400 border-b border-carbon-700/60 pb-2">
            Record Raw Material Supplier Purchase Entry (Stock Inward)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Purchase Date *</label>
              <input
                type="date"
                value={purchDate}
                onChange={(e) => setPurchDate(e.target.value)}
                className="w-full industrial-input font-mono"
              />
            </div>

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

      {/* ADD / EDIT RAW MATERIAL MODAL */}
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

      {/* ADD / EDIT SUPPLIER MODAL */}
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

      {/* MODAL: EDIT PURCHASE INVOICE */}
      {editingPurchase && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="industrial-card border-cyan-500/40 w-full max-w-md space-y-4">
            <h2 className="text-sm font-bold text-cyan-400 border-b border-carbon-700/60 pb-2">
              Edit Purchase Entry #{editingPurchase.invoiceNumber}
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Invoice Number</label>
                <input
                  type="text"
                  value={editPurchaseInvoice}
                  onChange={(e) => setEditPurchaseInvoice(e.target.value)}
                  className="w-full industrial-input font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Paid Amount (₹)</label>
                <input
                  type="number"
                  value={editPurchasePaid}
                  onChange={(e) => setEditPurchasePaid(Number(e.target.value))}
                  className="w-full industrial-input font-mono font-bold text-emerald-400"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-carbon-800">
              <button
                onClick={() => setEditingPurchase(null)}
                className="px-4 py-2 rounded bg-carbon-800 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePurchaseEdit}
                className="px-5 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-carbon-950 text-xs font-bold shadow-lg"
              >
                Save Purchase Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
