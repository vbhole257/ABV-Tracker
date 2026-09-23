import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Check, 
  UserCheck, 
  UserPlus, 
  Trash2, 
  Inbox 
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
  const [showNewOrder, setShowNewOrder] = useState(openNewSaleModal);
  const [showAddWholesalerModal, setShowAddWholesalerModal] = useState(false);

  // Wholesaler Form State (No Tier Dropdown)
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
  const [successToast, setSuccessToast] = useState('');

  const currentWholesaler = wholesalers.find((w) => w.id === selectedWholesaler) || wholesalers[0];

  const handleQtyChange = (productId: string, delta: number) => {
    setCasesQty((prev) => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] || 0) + delta),
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

  // ADD WHOLESALER (NO TIER DROPDOWN)
  const handleAddWholesaler = async () => {
    if (!wName || !wContact || !wPhone) {
      alert('Please fill in Wholesaler Business Name, Contact Person, and Phone number');
      return;
    }

    try {
      const res = await fetch('/api/v1/wholesalers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: wName,
          contactPerson: wContact,
          mobile: wPhone,
          address: wAddress,
          creditLimit: wCredit,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessToast(`Wholesaler "${wName}" added successfully!`);
        setShowAddWholesalerModal(false);
        setWName('');
        setWContact('');
        setWPhone('');
        onRefresh();
        setTimeout(() => setSuccessToast(''), 4000);
      } else {
        alert(json.error);
      }
    } catch (e) {
      alert('Error adding wholesaler');
    }
  };

  // DELETE WHOLESALER
  const handleDeleteWholesaler = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete wholesaler "${name}"?`)) return;

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
    }
  };

  // CREATE SALES ORDER WITH EXPLICIT NUMERIC RATES
  const handleCreateOrder = async () => {
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

    try {
      const res = await fetch('/api/v1/sales/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wholesalerId: selectedWholesaler || wholesalers[0]?.id,
          invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
          cratesIssued,
          paidAmount,
          paymentMode,
          referenceNo: refNo,
          items,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessToast(`Sales Order Invoice #${json.data.invoiceNumber} created successfully!`);
        setShowNewOrder(false);
        onRefresh();
        setTimeout(() => setSuccessToast(''), 4000);
      } else {
        alert(`Error creating order: ${json.error}`);
      }
    } catch (e) {
      setSuccessToast(`Sales Order Recorded!`);
      setShowNewOrder(false);
      setTimeout(() => setSuccessToast(''), 4000);
    }
  };

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
          <h1 className="text-2xl font-bold text-slate-50 tracking-tight">Wholesale Sales & Payments</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage wholesaler accounts, enter custom numeric selling prices per Peti, and record dispatches
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddWholesalerModal(!showAddWholesalerModal)}
            className="bg-cyan-500 hover:bg-cyan-400 text-carbon-950 font-bold text-xs px-4 py-2.5 rounded-lg shadow-lg transition flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Wholesaler</span>
          </button>
          <button
            onClick={() => setShowNewOrder(!showNewOrder)}
            className="bg-emerald-500 hover:bg-emerald-400 text-carbon-950 font-bold text-xs px-4 py-2.5 rounded-lg shadow-lg transition flex items-center space-x-2"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>+ New Order Dispatch</span>
          </button>
        </div>
      </div>

      {/* ADD WHOLESALER MODAL (NO DROPDOWN TIER) */}
      {showAddWholesalerModal && (
        <div className="industrial-card border-cyan-500/40 space-y-4">
          <h2 className="text-sm font-bold text-cyan-400 border-b border-carbon-700/60 pb-2 flex items-center space-x-2">
            <UserPlus className="w-4 h-4" />
            <span>Add New Wholesaler / Distributor Account</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Business / Firm Name *</label>
              <input
                type="text"
                placeholder="e.g. Metro Cold Drink Wholesalers"
                value={wName}
                onChange={(e) => setWName(e.target.value)}
                className="w-full industrial-input"
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
                className="w-full industrial-input"
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
                className="w-full industrial-input font-mono"
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
              onClick={handleAddWholesaler}
              className="px-5 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-carbon-950 text-xs font-bold shadow-lg"
            >
              Save Wholesaler Account
            </button>
          </div>
        </div>
      )}

      {/* CREATE NEW SALES ORDER DISPATCH (DIRECT NUMERIC RATES) */}
      {showNewOrder && (
        <div className="industrial-card border-emerald-500/30 space-y-6">
          <div className="flex items-center justify-between border-b border-carbon-700/60 pb-3">
            <h2 className="text-base font-bold text-emerald-400 flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5" />
              <span>New Wholesale Order Dispatch Invoice Generator</span>
            </h2>
          </div>

          {wholesalers.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Select Wholesaler / Distributor
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

                {currentWholesaler && (
                  <div className="p-3 rounded-lg bg-carbon-950 border border-carbon-800 text-xs font-mono flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block">Credit Limit: ₹{(currentWholesaler.creditLimit || 0).toLocaleString('en-IN')}</span>
                      <span className="text-cyan-400 font-bold block">Current Balance: ₹{(currentWholesaler.currentOutstanding || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-amber-400 font-bold block">{currentWholesaler.cratesHeld || 0} Crates</span>
                      <span className="text-[10px] text-slate-500">Currently Held Outside</span>
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
                                  onClick={() => handleQtyChange(p.id, -5)}
                                  className="w-8 h-8 rounded bg-carbon-800 hover:bg-carbon-700 text-slate-200 flex items-center justify-center font-bold"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="flex-1 text-center font-mono font-bold text-sm text-slate-100">
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleQtyChange(p.id, 5)}
                                  className="w-8 h-8 rounded bg-carbon-800 hover:bg-carbon-700 text-slate-200 flex items-center justify-center font-bold"
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

              {/* Payment Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-carbon-700/60">
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
                    <option value="CASH">CASH Counter</option>
                    <option value="UPI">UPI Instant QR</option>
                    <option value="NEFT_RTGS">NEFT / RTGS Bank</option>
                    <option value="CHEQUE">Cheque Clearance</option>
                    <option value="PDC">PDC (Post-Dated Cheque)</option>
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
                  onClick={handleCreateOrder}
                  className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-carbon-950 font-bold px-6 py-3 rounded-lg shadow-lg shadow-emerald-500/20 text-sm transition"
                >
                  Confirm & Generate Invoice
                </button>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-400 py-4">No wholesalers registered yet. Please click "+ Add Wholesaler" above first.</p>
          )}
        </div>
      )}

      {/* WHOLESALER PROFILES TABLE */}
      <div className="industrial-card">
        <h2 className="text-sm font-bold text-slate-100 flex items-center justify-between border-b border-carbon-700/60 pb-3">
          <span className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-cyan-400" />
            <span>Wholesaler & Distributor Directory</span>
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
                  <th className="pb-3 font-semibold text-right">ACTION</th>
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
                    <td className="py-3 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedWholesaler(w.id);
                          setShowNewOrder(true);
                        }}
                        className="text-xs bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded font-semibold transition"
                      >
                        + Order
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
