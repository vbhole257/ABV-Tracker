import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Check, 
  UserCheck, 
  UserPlus, 
  Edit, 
  Trash2, 
  Inbox,
  FileText,
  Clock,
  XCircle,
  Loader2,
  Calendar,
  Search,
  Filter,
  ArrowUpDown
} from 'lucide-react';

interface SalesPageProps {
  products: any[];
  wholesalers: any[];
  onRefresh: () => void;
  openNewSaleModal?: boolean;
}

export const SalesPage: React.FC<SalesPageProps> = ({ 
  products = [], 
  wholesalers = [], 
  onRefresh,
  openNewSaleModal = false
}) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewOrder, setShowNewOrder] = useState(openNewSaleModal);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingInvoiceNumber, setEditingInvoiceNumber] = useState<string>('');

  const [showAddWholesalerModal, setShowAddWholesalerModal] = useState(false);
  const [editingWholesalerId, setEditingWholesalerId] = useState<string | null>(null);

  // Wholesaler Form State (Add / Edit)
  const [wName, setWName] = useState('');
  const [wContact, setWContact] = useState('');
  const [wPhone, setWPhone] = useState('');
  const [wAddress, setWAddress] = useState('');
  const [wCredit, setWCredit] = useState(50000);

  // Order Form State (Direct Numeric Rates per Product)
  const [selectedWholesaler, setSelectedWholesaler] = useState(wholesalers[0]?.id || '');
  const [casesQty, setCasesQty] = useState<{ [key: string]: number }>({});
  const [customRates, setCustomRates] = useState<{ [key: string]: number }>({});
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [cratesIssued, setCratesIssued] = useState<number>(0);
  const [refNo, setRefNo] = useState('');
  const [dispatchDate, setDispatchDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [successToast, setSuccessToast] = useState('');

  // Table Filter & Sorting State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST'>('NEWEST');

  const loadOrders = async () => {
    try {
      const res = await fetch('/api/v1/sales/orders');
      const json = await res.json();
      if (json.success) {
        setOrders(json.data);
      }
    } catch (e) {
      console.error('Error loading sales orders:', e);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const currentWholesaler = wholesalers.find((w) => w.id === selectedWholesaler) || wholesalers[0];

  const handleQtyChange = (productId: string, delta: number) => {
    setCasesQty((prev) => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] || 0) + delta),
    }));
  };

  const handleSetExactQty = (productId: string, qty: number) => {
    setCasesQty((prev) => ({
      ...prev,
      [productId]: Math.max(0, qty),
    }));
  };

  const handleRateChange = (productId: string, rate: number) => {
    setCustomRates((prev) => ({
      ...prev,
      [productId]: rate,
    }));
  };

  const calculateTotal = () => {
    return products.reduce((sum, p) => {
      const qty = casesQty[p.id] || 0;
      const rate = customRates[p.id] !== undefined ? customRates[p.id] : (p.defaultPricePerCase || 160);
      return sum + qty * rate;
    }, 0);
  };

  // RESET ORDER FORM
  const resetOrderForm = () => {
    setEditingOrderId(null);
    setEditingInvoiceNumber('');
    setCasesQty({});
    setCustomRates({});
    setPaidAmount(0);
    setCratesIssued(0);
    setRefNo('');
    setDispatchDate(new Date().toISOString().slice(0, 10));
  };

  // OPEN EDIT ORDER (CRUD UPDATE)
  const handleOpenEditOrder = (order: any) => {
    setEditingOrderId(order.id);
    setEditingInvoiceNumber(order.invoiceNumber);
    setSelectedWholesaler(order.wholesalerId);
    setCratesIssued(order.cratesIssued || 0);
    setPaidAmount(order.paidAmount || 0);
    setPaymentMode(order.paymentMode || 'CASH');
    setDispatchDate(order.dispatchDate ? new Date(order.dispatchDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));

    const newQty: { [key: string]: number } = {};
    const newRates: { [key: string]: number } = {};

    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item: any) => {
        newQty[item.productId] = item.casesQuantity;
        newRates[item.productId] = item.pricePerCase;
      });
    }

    setCasesQty(newQty);
    setCustomRates(newRates);
    setShowNewOrder(true);
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  // OPEN ADD / EDIT WHOLESALER MODAL (CRUD)
  const handleOpenWholesalerModal = (w?: any) => {
    if (w) {
      setEditingWholesalerId(w.id);
      setWName(w.businessName);
      setWContact(w.contactPerson);
      setWPhone(w.mobile);
      setWAddress(w.address || '');
      setWCredit(w.creditLimit || 50000);
    } else {
      setEditingWholesalerId(null);
      setWName('');
      setWContact('');
      setWPhone('');
      setWAddress('');
      setWCredit(50000);
    }
    setShowAddWholesalerModal(true);
  };

  // SAVE WHOLESALER (CREATE / UPDATE)
  const handleSaveWholesaler = async () => {
    if (!wName || !wContact || !wPhone) {
      alert('Please fill in Wholesaler Business Name, Contact Person, and Phone number');
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = editingWholesalerId ? `/api/v1/wholesalers/${editingWholesalerId}` : '/api/v1/wholesalers';
      const method = editingWholesalerId ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: wName,
          contactPerson: wContact,
          mobile: wPhone,
          address: wAddress,
          creditLimit: Number(wCredit),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessToast(`Wholesaler "${wName}" ${editingWholesalerId ? 'updated' : 'added'} successfully!`);
        setShowAddWholesalerModal(false);
        onRefresh();
        setTimeout(() => setSuccessToast(''), 4000);
      } else {
        alert(json.error || 'Error saving wholesaler');
      }
    } catch (e) {
      alert('Error saving wholesaler account');
    } finally {
      setIsLoading(false);
    }
  };

  // DELETE WHOLESALER
  const handleDeleteWholesaler = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete wholesaler "${name}"?`)) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/wholesalers/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setSuccessToast(`Wholesaler "${name}" deleted!`);
        onRefresh();
        setTimeout(() => setSuccessToast(''), 4000);
      }
    } catch (e) {
      alert('Error deleting wholesaler');
    } finally {
      setIsLoading(false);
    }
  };

  // CREATE OR EDIT SALES ORDER (POST / PUT)
  const handleSaveOrder = async () => {
    const items = Object.entries(casesQty)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, casesQuantity]) => {
        const p = products.find((prod) => prod.id === productId);
        const pricePerCase = customRates[productId] !== undefined 
          ? customRates[productId] 
          : (p?.defaultPricePerCase || 160);
        return {
          productId,
          casesQuantity,
          pricePerCase,
        };
      });

    if (items.length === 0) {
      alert('Please select at least one product case (Peti)');
      return;
    }

    const endpoint = editingOrderId ? `/api/v1/sales/orders/${editingOrderId}` : '/api/v1/sales/orders';
    const method = editingOrderId ? 'PUT' : 'POST';

    setIsLoading(true);
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wholesalerId: selectedWholesaler || wholesalers[0]?.id,
          invoiceNumber: editingOrderId ? editingInvoiceNumber : `INV-${Math.floor(1000 + Math.random() * 9000)}`,
          cratesIssued: Number(cratesIssued),
          paidAmount: Number(paidAmount),
          paymentMode,
          referenceNo: refNo,
          dispatchDate,
          items,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessToast(`Sales Order Invoice #${json.data.invoiceNumber} ${editingOrderId ? 'updated' : 'created'} successfully!`);
        setShowNewOrder(false);
        resetOrderForm();
        loadOrders();
        onRefresh();
        setTimeout(() => setSuccessToast(''), 4000);
      } else {
        alert(`Error saving order: ${json.error}`);
      }
    } catch (e) {
      alert('Error saving sales order');
    } finally {
      setIsLoading(false);
    }
  };

  // DELETE / ROLLBACK ORDER (DELETE)
  const handleDeleteOrder = async (id: string, invoiceNumber: string) => {
    if (!confirm(`Are you sure you want to delete/rollback Order Invoice #${invoiceNumber}? This will restore the wholesaler's balance & crates.`)) return;

    try {
      const res = await fetch(`/api/v1/sales/orders/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setSuccessToast(`Order Invoice #${invoiceNumber} deleted & balance restored.`);
        loadOrders();
        onRefresh();
        setTimeout(() => setSuccessToast(''), 4000);
      }
    } catch (e) {
      alert('Error deleting sales order entry');
    }
  };

  const filteredOrders = orders
    .filter((o) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchInvoice = o.invoiceNumber?.toLowerCase().includes(query);
        const matchFirm = o.wholesaler?.businessName?.toLowerCase().includes(query);
        if (!matchInvoice && !matchFirm) return false;
      }
      if (filterStartDate) {
        const orderDate = new Date(o.dispatchDate || o.createdAt).toISOString().slice(0, 10);
        if (orderDate < filterStartDate) return false;
      }
      if (filterEndDate) {
        const orderDate = new Date(o.dispatchDate || o.createdAt).toISOString().slice(0, 10);
        if (orderDate > filterEndDate) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const timeA = new Date(a.dispatchDate || a.createdAt).getTime();
      const timeB = new Date(b.dispatchDate || b.createdAt).getTime();
      return sortOrder === 'NEWEST' ? timeB - timeA : timeA - timeB;
    });

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-sm font-bold flex items-center space-x-2">
          <Check className="w-5 h-5" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header & CRUD Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-50 tracking-tight">Wholesale Sales & Payments (CRUD)</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage wholesaler accounts, record dispatches, edit past sales orders, and process payments
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleOpenWholesalerModal()}
            className="bg-cyan-500 hover:bg-cyan-400 text-carbon-950 font-bold text-xs px-4 py-2.5 rounded-lg shadow-lg transition flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Wholesaler</span>
          </button>
          <button
            onClick={() => {
              if (showNewOrder && editingOrderId) {
                resetOrderForm();
              }
              setShowNewOrder(!showNewOrder);
            }}
            className="bg-emerald-500 hover:bg-emerald-400 text-carbon-950 font-bold text-xs px-4 py-2.5 rounded-lg shadow-lg transition flex items-center space-x-2"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>+ New Order Dispatch</span>
          </button>
        </div>
      </div>

      {/* ADD / EDIT WHOLESALER MODAL (CRUD) */}
      {showAddWholesalerModal && (
        <div className="industrial-card border-cyan-500/40 space-y-4">
          <h2 className="text-sm font-bold text-cyan-400 border-b border-carbon-700/60 pb-2 flex items-center space-x-2">
            <UserPlus className="w-4 h-4" />
            <span>{editingWholesalerId ? 'Edit Wholesaler Account' : 'Add New Wholesaler / Distributor Account'}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Business / Firm Name *</label>
              <input
                type="text"
                placeholder="e.g. Metro Cold Drink Wholesalers"
                value={wName}
                onChange={(e) => setWName(e.target.value)}
                className="w-full industrial-input font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Person *</label>
              <input
                type="text"
                placeholder="e.g. Sanjay Gupta"
                value={wContact}
                onChange={(e) => setWContact(e.target.value)}
                className="w-full industrial-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile Number *</label>
              <input
                type="text"
                placeholder="e.g. +91 98901 55443"
                value={wPhone}
                onChange={(e) => setWPhone(e.target.value)}
                className="w-full industrial-input font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Address</label>
              <input
                type="text"
                placeholder="Shop / Godown address"
                value={wAddress}
                onChange={(e) => setWAddress(e.target.value)}
                className="w-full industrial-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Credit Limit (₹)</label>
              <input
                type="number"
                value={wCredit}
                onChange={(e) => setWCredit(Number(e.target.value))}
                className="w-full industrial-input font-mono font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              onClick={() => setShowAddWholesalerModal(false)}
              className="px-4 py-2 rounded bg-carbon-800 text-slate-300 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveWholesaler}
              className="px-5 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-carbon-950 text-xs font-bold shadow-lg"
            >
              {editingWholesalerId ? 'Save Wholesaler Changes' : 'Save Wholesaler Account'}
            </button>
          </div>
        </div>
      )}

      {/* CREATE / EDIT SALES ORDER DISPATCH (CRUD) */}
      {showNewOrder && (
        <div className={`industrial-card space-y-6 ${editingOrderId ? 'border-amber-500/50' : 'border-emerald-500/30'}`}>
          <div className="flex items-center justify-between border-b border-carbon-700/60 pb-3">
            <h2 className={`text-base font-bold flex items-center space-x-2 ${editingOrderId ? 'text-amber-400' : 'text-emerald-400'}`}>
              <ShoppingCart className="w-5 h-5" />
              <span>
                {editingOrderId 
                  ? `Editing Dispatched Sales Order #${editingInvoiceNumber}` 
                  : 'New Wholesale Order Dispatch Invoice Generator'}
              </span>
            </h2>
            {editingOrderId && (
              <button
                onClick={() => {
                  resetOrderForm();
                  setShowNewOrder(false);
                }}
                className="text-xs bg-carbon-800 hover:bg-carbon-700 text-slate-300 px-3 py-1 rounded font-bold flex items-center space-x-1"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel Editing</span>
              </button>
            )}
          </div>

          {wholesalers.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Select Wholesaler / Distributor *
                  </label>
                  <select
                    value={selectedWholesaler}
                    onChange={(e) => setSelectedWholesaler(e.target.value)}
                    className="w-full industrial-input font-bold text-slate-100"
                  >
                    {wholesalers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.businessName} ({w.contactPerson})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Dispatch / Sales Date *</span>
                  </label>
                  <input
                    type="date"
                    value={dispatchDate}
                    onChange={(e) => setDispatchDate(e.target.value)}
                    className="w-full industrial-input font-mono font-bold text-cyan-400"
                  />
                </div>

                {currentWholesaler && (
                  <div className="p-3 rounded-lg bg-carbon-950 border border-carbon-800 text-xs font-mono flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Credit Limit: ₹{(currentWholesaler.creditLimit || 0).toLocaleString('en-IN')}</span>
                      <span className="text-cyan-400 font-bold block">Outstanding: ₹{(currentWholesaler.currentOutstanding || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-amber-400 font-bold block">{currentWholesaler.cratesHeld || 0} Crates</span>
                      <span className="text-[10px] text-slate-500">Held Outside</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Product Quantities & Numeric Selling Rate Inputs */}
              <div>
                <h3 className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
                  Select 160ml Cold Drink Peti & Enter Numeric Rate (₹ / Peti)
                </h3>
                {products.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products.map((p) => {
                      const qty = casesQty[p.id] || 0;
                      const currentRate = customRates[p.id] !== undefined ? customRates[p.id] : (p.defaultPricePerCase || 160);
                      return (
                        <div key={p.id} className="p-3.5 rounded-lg bg-carbon-950 border border-carbon-800 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-bold text-slate-200 text-sm block">{p.name}</span>
                              <span className="text-[11px] text-slate-400 font-mono">30 Bottles per Peti</span>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono font-bold">
                              {p.skuCode}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-1">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                                Selling Price (₹ / Peti)
                              </label>
                              <input
                                type="number"
                                value={currentRate}
                                onChange={(e) => handleRateChange(p.id, Number(e.target.value))}
                                className="w-full industrial-input text-xs font-bold text-cyan-400"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                                Peti Quantity
                              </label>
                              <div className="flex items-center space-x-1">
                                <button
                                  type="button"
                                  onClick={() => handleQtyChange(p.id, -1)}
                                  className="w-8 h-8 rounded bg-carbon-800 hover:bg-carbon-700 text-slate-200 flex items-center justify-center font-bold shrink-0"
                                  title="Decrease by 1"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  value={qty === 0 ? '' : qty}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    handleSetExactQty(p.id, isNaN(val) ? 0 : Math.max(0, val));
                                  }}
                                  placeholder="0"
                                  className="w-full text-center industrial-input font-mono font-bold text-sm text-cyan-400 py-1"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleQtyChange(p.id, 1)}
                                  className="w-8 h-8 rounded bg-carbon-800 hover:bg-carbon-700 text-slate-200 flex items-center justify-center font-bold shrink-0"
                                  title="Increase by 1"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="text-right pt-2 border-t border-carbon-800/60">
                            <span className="font-mono text-xs text-emerald-400 font-bold">
                              Subtotal: ₹{(qty * currentRate).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-2">No product SKUs registered.</p>
                )}
              </div>

              {/* Payment Details & Dispatch Date */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-3 border-t border-carbon-700/60">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Dispatch / Invoice Date *
                  </label>
                  <input
                    type="date"
                    value={dispatchDate}
                    onChange={(e) => setDispatchDate(e.target.value)}
                    className="w-full industrial-input font-mono font-bold text-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Plastic Crates Issued
                  </label>
                  <input
                    type="number"
                    value={cratesIssued}
                    onChange={(e) => setCratesIssued(Number(e.target.value))}
                    className="w-full industrial-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full industrial-input"
                  >
                    <option value="CASH">💵 Cash (Factory Cash Box)</option>
                    <option value="UPI">📱 UPI (Online Bank Account)</option>
                    <option value="NEFT_RTGS">🏦 NEFT / RTGS (Online Bank Account)</option>
                    <option value="CHEQUE">📑 Cheque (Online Bank Account)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Amount Paid Today (₹)
                  </label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-full industrial-input font-bold text-emerald-400"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-carbon-700/60">
                <div className="font-mono">
                  <span className="text-slate-400 text-xs block">TOTAL INVOICE AMOUNT</span>
                  <span className="text-2xl font-extrabold text-cyan-400">
                    ₹ {calculateTotal().toLocaleString('en-IN')}
                  </span>
                </div>

                <button
                  onClick={handleSaveOrder}
                  disabled={isLoading}
                  className={`w-full sm:w-auto font-bold px-6 py-3 rounded-lg shadow-lg text-sm transition flex items-center justify-center space-x-2 ${
                    editingOrderId 
                      ? 'bg-amber-500 hover:bg-amber-400 text-carbon-950 shadow-amber-500/20' 
                      : 'bg-emerald-500 hover:bg-emerald-400 text-carbon-950 shadow-emerald-500/20'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingOrderId ? 'Save Sales Order Changes' : 'Confirm & Generate Invoice'}</span>
                </button>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-400 py-4">No wholesalers registered yet. Please click "+ Add Wholesaler" above first.</p>
          )}
        </div>
      )}

      {/* DISPATCHED SALES ORDERS HISTORY TABLE (CRUD & DATE SEARCH) */}
      <div className="industrial-card">
        <h2 className="text-sm font-bold text-slate-100 flex items-center justify-between border-b border-carbon-700/60 pb-3">
          <span className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Dispatched Sales Orders Ledger (CRUD & Date Range Search)</span>
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {filteredOrders.length} / {orders.length} Invoices Filtered
          </span>
        </h2>

        {/* Date Filter & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-3 pb-3 border-b border-carbon-800 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search Wholesaler / Invoice #"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full industrial-input pl-8 py-1.5 text-xs"
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400 font-mono text-[11px] shrink-0">From Date:</span>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full industrial-input py-1 text-xs font-mono"
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400 font-mono text-[11px] shrink-0">To Date:</span>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full industrial-input py-1 text-xs font-mono"
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="w-full industrial-input py-1 text-xs font-mono font-bold text-cyan-400"
            >
              <option value="NEWEST">📅 Sort: Newest Date First</option>
              <option value="OLDEST">📅 Sort: Oldest Date First</option>
            </select>
            {(searchQuery || filterStartDate || filterEndDate) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterStartDate('');
                  setFilterEndDate('');
                }}
                className="text-[10px] text-slate-400 hover:text-slate-200 underline shrink-0"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {orders.length > 0 ? (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-carbon-800 font-mono">
                  <th className="pb-3 font-semibold">INVOICE & DATE</th>
                  <th className="pb-3 font-semibold">WHOLESALER FIRM</th>
                  <th className="pb-3 font-semibold">ITEMS & QUANTITY</th>
                  <th className="pb-3 font-semibold">CRATES</th>
                  <th className="pb-3 font-semibold">TOTAL AMOUNT</th>
                  <th className="pb-3 font-semibold">PAID / STATUS</th>
                  <th className="pb-3 font-semibold text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-carbon-800/60 text-slate-200">
                {filteredOrders.map((o) => {
                  const unpaid = o.totalAmount - (o.paidAmount || 0);
                  return (
                    <tr key={o.id} className="hover:bg-carbon-800/40">
                      <td className="py-3 font-mono">
                        <span className="font-bold text-cyan-400 block">{o.invoiceNumber}</span>
                        <span className="text-[10px] text-slate-500 flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(o.dispatchDate || o.createdAt).toLocaleDateString()}</span>
                        </span>
                      </td>

                      <td className="py-3 font-bold text-slate-100">
                        {o.wholesaler?.businessName || 'Wholesaler'}
                      </td>

                      <td className="py-3 font-mono text-xs">
                        {o.items && o.items.length > 0 ? (
                          o.items.map((item: any, idx: number) => (
                            <span key={idx} className="block text-[11px] text-slate-300">
                              • {item.product?.name || 'Product'}: <strong className="text-cyan-400">{item.casesQuantity} Peti</strong> @ ₹{item.pricePerCase}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500">No item details</span>
                        )}
                      </td>

                      <td className="py-3 font-mono text-amber-400 font-bold">
                        {o.cratesIssued || 0} Crates
                      </td>

                      <td className="py-3 font-mono font-bold text-slate-100 text-sm">
                        ₹{(o.totalAmount || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 font-mono">
                        <div className="font-bold text-emerald-400">₹{(o.paidAmount || 0).toLocaleString('en-IN')}</div>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold inline-block mt-0.5 ${
                          o.paymentStatus === 'PAID'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : o.paymentStatus === 'PARTIAL'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}>
                          {o.paymentStatus} (Due: ₹{Math.max(0, unpaid).toLocaleString('en-IN')})
                        </span>
                      </td>

                      <td className="py-3 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEditOrder(o)}
                          className="p-1.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                          title="Edit Sales Order Invoice"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(o.id, o.invoiceNumber)}
                          className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
                          title="Delete / Rollback Sales Order"
                        >
                          <Trash2 className="w-4 h-4" />
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
            <p>No sales order dispatches recorded yet.</p>
          </div>
        )}
      </div>

      {/* WHOLESALER PROFILES TABLE */}
      <div className="industrial-card">
        <h2 className="text-sm font-bold text-slate-100 flex items-center justify-between border-b border-carbon-700/60 pb-3">
          <span className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-cyan-400" />
            <span>Wholesaler & Distributor Directory (CRUD)</span>
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {wholesalers.length} Wholesalers
          </span>
        </h2>

        {wholesalers.length > 0 ? (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-carbon-800 font-mono">
                  <th className="pb-3 font-semibold">WHOLESALER / FIRM</th>
                  <th className="pb-3 font-semibold">CONTACT</th>
                  <th className="pb-3 font-semibold">CREDIT LIMIT</th>
                  <th className="pb-3 font-semibold">OUTSTANDING</th>
                  <th className="pb-3 font-semibold">CRATES HELD</th>
                  <th className="pb-3 font-semibold text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-carbon-800/60 text-slate-200">
                {wholesalers.map((w) => (
                  <tr key={w.id} className="hover:bg-carbon-800/40">
                    <td className="py-3 font-bold text-slate-100">{w.businessName}</td>
                    <td className="py-3 font-mono text-slate-400">{w.contactPerson} ({w.mobile})</td>
                    <td className="py-3 font-mono text-slate-300">₹{(w.creditLimit || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3 font-mono font-bold text-cyan-400">
                      ₹{(w.currentOutstanding || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 font-mono text-amber-400 font-bold">{w.cratesHeld || 0} Crates</td>
                    <td className="py-3 text-right space-x-1">
                      <button
                        onClick={() => {
                          setSelectedWholesaler(w.id);
                          setShowNewOrder(true);
                        }}
                        className="text-xs bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2.5 py-1 rounded font-semibold transition"
                      >
                        + Order
                      </button>
                      <button
                        onClick={() => handleOpenWholesalerModal(w)}
                        className="p-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        title="Edit Wholesaler"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteWholesaler(w.id, w.businessName)}
                        className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
                        title="Delete Wholesaler"
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
          <div className="py-10 text-center text-slate-500 text-xs space-y-2">
            <Inbox className="w-8 h-8 mx-auto text-slate-600" />
            <p>No wholesalers registered yet. Click "+ Add Wholesaler" above to create an account.</p>
          </div>
        )}
      </div>

    </div>
  );
};
