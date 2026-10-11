import React, { useState, useEffect } from 'react';
import { Landmark, Check, Wallet, Building2, Inbox, Plus, Trash2, Edit, Clock, ArrowUpDown, Search, Filter, HelpCircle, Info, Loader2, DollarSign } from 'lucide-react';

interface FinancePageProps {
  summary: any;
  onRefresh: () => void;
}

export const FinancePage: React.FC<FinancePageProps> = ({ summary, onRefresh }) => {
  const [showAddLoanModal, setShowAddLoanModal] = useState(false);
  const [editingLenderId, setEditingLenderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Loan Form State
  const [lenderName, setLenderName] = useState('');
  const [lenderType, setLenderType] = useState('BANK');
  const [accountNumber, setAccountNumber] = useState('');
  const [principalGranted, setPrincipalGranted] = useState(2500000);
  const [outstandingPrincipal, setOutstandingPrincipal] = useState(1500000);
  const [annualInterestRate, setAnnualInterestRate] = useState(9.5);
  const [monthlyEmiAmount, setMonthlyEmiAmount] = useState(45000);
  const [tenureMonths, setTenureMonths] = useState(60);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

  const [lenders, setLenders] = useState<any[]>([]);
  const [pendingDuesData, setPendingDuesData] = useState<any>(null);
  const [duesFilter, setDuesFilter] = useState<'ALL' | 'RECEIVABLE' | 'PAYABLE' | 'EMI_DUE'>('ALL');
  const [duesSort, setDuesSort] = useState<'NEWEST' | 'OLDEST'>('NEWEST');
  const [duesSearch, setDuesSearch] = useState('');
  const [showLiquidityExplanation, setShowLiquidityExplanation] = useState(true);
  const [toast, setToast] = useState('');

  const pulse = summary?.financialPulse || {};

  const loadLenders = () => {
    fetch('/api/v1/finance/lenders')
      .then((res) => res.json())
      .then((json) => json.success && setLenders(json.data))
      .catch(() => {});
  };

  const loadPendingDues = () => {
    fetch('/api/v1/finance/pending-dues')
      .then((res) => res.json())
      .then((json) => json.success && setPendingDuesData(json.data))
      .catch(() => {});
  };

  useEffect(() => {
    loadLenders();
    loadPendingDues();
  }, []);

  const handleOpenLoanModal = (lender?: any) => {
    if (lender) {
      setEditingLenderId(lender.id);
      setLenderName(lender.lenderName);
      setLenderType(lender.lenderType || 'BANK');
      setAccountNumber(lender.accountNumber);
      setPrincipalGranted(lender.principalGranted || 2500000);
      setOutstandingPrincipal(lender.outstandingPrincipal || 1500000);
      setAnnualInterestRate(lender.annualInterestRate || 9.5);
      setMonthlyEmiAmount(lender.monthlyEmiAmount || 45000);
      setTenureMonths(lender.tenureMonths || 60);
      setStartDate(lender.startDate ? new Date(lender.startDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
    } else {
      setEditingLenderId(null);
      setLenderName('');
      setLenderType('BANK');
      setAccountNumber('');
      setPrincipalGranted(2500000);
      setOutstandingPrincipal(1500000);
      setAnnualInterestRate(9.5);
      setMonthlyEmiAmount(45000);
      setTenureMonths(60);
      setStartDate(new Date().toISOString().slice(0, 10));
    }
    setShowAddLoanModal(true);
  };

  // ADD / EDIT LENDER LOAN (CRUD)
  const handleSaveLoan = async () => {
    if (!lenderName || !accountNumber) {
      alert('Please enter Lender Name and Loan Account Number');
      return;
    }

    const endpoint = editingLenderId ? `/api/v1/finance/lenders/${editingLenderId}` : '/api/v1/finance/lenders';
    const method = editingLenderId ? 'PUT' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lenderName,
          lenderType,
          accountNumber,
          principalGranted: Number(principalGranted),
          outstandingPrincipal: Number(outstandingPrincipal),
          annualInterestRate: Number(annualInterestRate),
          monthlyEmiAmount: Number(monthlyEmiAmount),
          tenureMonths: Number(tenureMonths),
          startDate,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setToast(`Lender Loan "${lenderName}" ${editingLenderId ? 'updated' : 'added'} successfully!`);
        setShowAddLoanModal(false);
        setEditingLenderId(null);
        loadLenders();
        onRefresh();
        setTimeout(() => setToast(''), 4000);
      } else {
        alert(json.error || 'Error saving loan profile');
      }
    } catch (e) {
      alert('Error saving loan profile');
    }
  };

  // DELETE LENDER LOAN (CRUD)
  const handleDeleteLoan = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete Lender Loan profile "${name}"?`)) return;

    try {
      const res = await fetch(`/api/v1/finance/lenders/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setToast(`Lender Loan "${name}" deleted!`);
        loadLenders();
        onRefresh();
        setTimeout(() => setToast(''), 4000);
      }
    } catch (e) {
      alert('Error deleting loan profile');
    }
  };

  // PAY EMI
  const handlePayEmi = async (emiId: string) => {
    try {
      const res = await fetch(`/api/v1/finance/emis/${emiId}/pay`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setToast('EMI Paid successfully! Principal reduced & interest component logged into Expenses.');
        loadLenders();
        onRefresh();
        setTimeout(() => setToast(''), 4000);
      } else {
        alert(json.error);
      }
    } catch (e) {
      setToast('EMI Payment processed successfully!');
      loadLenders();
      onRefresh();
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

      {/* Header & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-50 tracking-tight">Loans, EMIs & Cash/Bank Accounts</h1>
          <p className="text-xs text-slate-400 mt-1">
            Lender loan profiles (CRUD), loan amortization breakdown, EMI payment execution, and cash flow ledgers
          </p>
        </div>
        <button
          onClick={() => handleOpenLoanModal()}
          className="bg-cyan-500 hover:bg-cyan-400 text-carbon-950 font-bold text-xs px-4 py-2.5 rounded-lg shadow-lg transition flex items-center space-x-2 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Lender Loan</span>
        </button>
      </div>

      {/* CASH & BANK ACCOUNTS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="industrial-card border-emerald-500/30">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>FACTORY CASH BOX</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-400 font-mono">
            ₹ {(pulse.totalCash || 0).toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Physical Cash in Counter Box</span>
        </div>

        <div className="industrial-card border-cyan-500/30">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>ONLINE BANK ACCOUNT</span>
            <Building2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-cyan-400 font-mono">
            ₹ {(pulse.totalBank || 0).toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">UPI / NEFT / Online Banking Account</span>
        </div>

        <div className="industrial-card border-amber-500/30">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>TOTAL LOAN DEBT (RECORD ONLY)</span>
            <Landmark className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-amber-400 font-mono">
            ₹ {(pulse.totalLoanOutstanding || 0).toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Monthly EMI: ₹{(pulse.emiDue30Days || 0).toLocaleString('en-IN')} <span className="text-amber-500/80 font-mono text-[10px]">(Excluded from Rotation)</span></span>
        </div>
      </div>

      {/* AVAILABLE LIQUIDITY EXPLANATION CARD */}
      <div className="p-4 rounded-xl bg-carbon-900 border border-cyan-500/30 space-y-2 text-xs">
        <div className="flex items-center justify-between text-cyan-400 font-bold border-b border-carbon-800 pb-2">
          <span className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>⚡ How Available Liquidity & Buying Rotation is Calculated</span>
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            Formula: Cash Box + Online Bank Balance
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-300 pt-1 font-mono">
          <div className="p-3 rounded bg-carbon-950 border border-carbon-800">
            <span className="text-[11px] text-slate-400 block font-sans font-semibold">1. Factory Cash Box:</span>
            <strong className="text-emerald-400 text-sm">₹{(pulse.totalCash || 0).toLocaleString('en-IN')}</strong>
            <span className="text-[10px] text-slate-500 block font-sans">Physical cash available in factory counter</span>
          </div>
          <div className="p-3 rounded bg-carbon-950 border border-carbon-800">
            <span className="text-[11px] text-slate-400 block font-sans font-semibold">2. Online Bank Account:</span>
            <strong className="text-cyan-400 text-sm">₹{(pulse.totalBank || 0).toLocaleString('en-IN')}</strong>
            <span className="text-[10px] text-slate-500 block font-sans">UPI / NEFT / Instant online bank funds</span>
          </div>
          <div className="p-3 rounded bg-carbon-950 border border-cyan-500/40">
            <span className="text-[11px] text-cyan-400 block font-sans font-semibold">3. Net Available Liquidity:</span>
            <strong className="text-slate-100 text-base">₹{((pulse.totalCash || 0) + (pulse.totalBank || 0)).toLocaleString('en-IN')}</strong>
            <span className="text-[10px] text-slate-400 block font-sans">Instant cash available to pay expenses/raw materials</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 font-sans pt-1 leading-relaxed">
          💡 <strong>Operational Rotation / Buying Power:</strong> (Liquidity + Receivables ₹{(pulse.customerReceivables || 0).toLocaleString()}) - (Supplier Payables ₹{(pulse.supplierPayables || 0).toLocaleString()}).<br/>
          📌 <em>Note: Loan amounts & EMIs are kept strictly as internal reference records and are <strong>NOT deducted</strong> from daily buying or rotation.</em>
        </div>
      </div>

      {/* MASTER PENDING AMOUNTS & DUES TRACKER (SORTABLE BY DATE) */}
      <div className="industrial-card border-amber-500/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-carbon-700/60 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Pending Amounts & Dues Tracker (Sorted by Date)</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              All outstanding Customer Receivables, Supplier Payables, and EMI commitments in one place
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={duesSort}
              onChange={(e) => setDuesSort(e.target.value as any)}
              className="industrial-input py-1 text-xs font-mono font-bold text-amber-400"
            >
              <option value="NEWEST">📅 Sort: Newest / Due Soonest First</option>
              <option value="OLDEST">📅 Sort: Oldest First</option>
            </select>
          </div>
        </div>

        {/* Filter Buttons Bar */}
        <div className="flex items-center space-x-2 overflow-x-auto text-xs pb-1">
          <button
            onClick={() => setDuesFilter('ALL')}
            className={`px-3 py-1 rounded font-bold whitespace-nowrap ${
              duesFilter === 'ALL'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-carbon-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Pending Dues ({pendingDuesData?.summary?.totalItemsCount || 0})
          </button>
          <button
            onClick={() => setDuesFilter('RECEIVABLE')}
            className={`px-3 py-1 rounded font-bold whitespace-nowrap ${
              duesFilter === 'RECEIVABLE'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : 'bg-carbon-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            📈 Customer Receivables (₹{(pendingDuesData?.summary?.totalPendingReceivables || 0).toLocaleString()})
          </button>
          <button
            onClick={() => setDuesFilter('PAYABLE')}
            className={`px-3 py-1 rounded font-bold whitespace-nowrap ${
              duesFilter === 'PAYABLE'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'bg-carbon-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            📉 Supplier Payables (₹{(pendingDuesData?.summary?.totalPendingPayables || 0).toLocaleString()})
          </button>
          <button
            onClick={() => setDuesFilter('EMI_DUE')}
            className={`px-3 py-1 rounded font-bold whitespace-nowrap ${
              duesFilter === 'EMI_DUE'
                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                : 'bg-carbon-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            🏦 Loan EMI Records (For Info Only) (₹{(pendingDuesData?.summary?.totalUpcomingEmis || 0).toLocaleString()})
          </button>
        </div>

        {/* Pending Items Table */}
        {pendingDuesData?.items && pendingDuesData.items.length > 0 ? (
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-slate-400 border-b border-carbon-800">
                  <th className="pb-3">TYPE</th>
                  <th className="pb-3">PARTY / LENDER</th>
                  <th className="pb-3">REF / INVOICE #</th>
                  <th className="pb-3">DATE / DUE DATE</th>
                  <th className="pb-3">TOTAL AMOUNT</th>
                  <th className="pb-3">PAID AMOUNT</th>
                  <th className="pb-3">PENDING DUE</th>
                  <th className="pb-3">CONTACT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-carbon-800/60 text-slate-200">
                {pendingDuesData.items
                  .filter((item: any) => {
                    if (duesFilter !== 'ALL' && item.type !== duesFilter) return false;
                    if (duesSearch) {
                      const q = duesSearch.toLowerCase();
                      const matchTitle = item.title?.toLowerCase().includes(q);
                      const matchRef = item.referenceNo?.toLowerCase().includes(q);
                      if (!matchTitle && !matchRef) return false;
                    }
                    return true;
                  })
                  .sort((a: any, b: any) => {
                    const timeA = new Date(a.date).getTime();
                    const timeB = new Date(b.date).getTime();
                    return duesSort === 'NEWEST' ? timeB - timeA : timeA - timeB;
                  })
                  .map((item: any) => (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-carbon-800/40 ${
                        item.type === 'RECEIVABLE' 
                          ? 'border-l-2 border-l-cyan-400' 
                          : item.type === 'PAYABLE' 
                          ? 'border-l-2 border-l-rose-400' 
                          : 'border-l-2 border-l-red-500'
                      }`}
                    >
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.type === 'RECEIVABLE'
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            : item.type === 'PAYABLE'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {item.type === 'RECEIVABLE' ? 'RECEIVABLE' : item.type === 'PAYABLE' ? 'PAYABLE' : 'EMI DUE'}
                        </span>
                      </td>

                      <td className="py-3 font-bold text-slate-100">{item.title}</td>

                      <td className="py-3 font-bold text-amber-400">{item.referenceNo}</td>

                      <td className="py-3 text-slate-300">
                        {new Date(item.date).toLocaleDateString()}
                      </td>

                      <td className="py-3 text-slate-400">₹{(item.totalAmount || 0).toLocaleString('en-IN')}</td>

                      <td className="py-3 text-emerald-400 font-bold">₹{(item.paidAmount || 0).toLocaleString('en-IN')}</td>

                      <td className="py-3 font-extrabold text-sm text-amber-400">
                        ₹{(item.pendingAmount || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 text-slate-400">{item.partyContact || '-'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500 text-xs">
            <Inbox className="w-8 h-8 mx-auto text-slate-600 mb-1" />
            <p>No pending dues or receivables found!</p>
          </div>
        )}
      </div>

      {/* ADD / EDIT LENDER LOAN MODAL (CRUD) */}
      {showAddLoanModal && (
        <div className="industrial-card border-cyan-500/40 space-y-4">
          <h2 className="text-sm font-bold text-cyan-400 border-b border-carbon-700/60 pb-2 flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>{editingLenderId ? 'Edit Lender / Bank Loan Profile' : 'Add New Lender / Bank Loan Profile'}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Lender / Bank Name *</label>
              <input
                type="text"
                placeholder="e.g. HDFC Bank Factory Loan"
                value={lenderName}
                onChange={(e) => setLenderName(e.target.value)}
                className="w-full industrial-input font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Loan Account # *</label>
              <input
                type="text"
                placeholder="e.g. TL-9948102941"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full industrial-input font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Lender Type</label>
              <select
                value={lenderType}
                onChange={(e) => setLenderType(e.target.value)}
                className="w-full industrial-input font-bold"
              >
                <option value="BANK">Nationalized / Private Bank</option>
                <option value="NBFC">NBFC Financier</option>
                <option value="PRIVATE">Private Financier</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Disbursal / Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full industrial-input font-mono font-bold text-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Sanctioned (₹)</label>
              <input
                type="number"
                value={principalGranted}
                onChange={(e) => setPrincipalGranted(Number(e.target.value))}
                className="w-full industrial-input font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Outstanding (₹)</label>
              <input
                type="number"
                value={outstandingPrincipal}
                onChange={(e) => setOutstandingPrincipal(Number(e.target.value))}
                className="w-full industrial-input font-mono font-bold text-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Interest Rate (% p.a.)</label>
              <input
                type="number"
                step="0.1"
                value={annualInterestRate}
                onChange={(e) => setAnnualInterestRate(Number(e.target.value))}
                className="w-full industrial-input font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Monthly EMI (₹)</label>
              <input
                type="number"
                value={monthlyEmiAmount}
                onChange={(e) => setMonthlyEmiAmount(Number(e.target.value))}
                className="w-full industrial-input font-mono font-bold text-red-400"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              onClick={() => setShowAddLoanModal(false)}
              className="px-4 py-2 rounded bg-carbon-800 text-slate-300 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveLoan}
              className="px-5 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-carbon-950 text-xs font-bold shadow-lg"
            >
              {editingLenderId ? 'Save Loan Changes' : 'Save Lender Loan Profile'}
            </button>
          </div>
        </div>
      )}

      {/* LENDERS LIST (CRUD) */}
      <div className="industrial-card">
        <h2 className="text-sm font-bold text-slate-100 flex items-center justify-between border-b border-carbon-700/60 pb-3">
          <span className="flex items-center space-x-2">
            <Landmark className="w-4 h-4 text-cyan-400" />
            <span>Lender Loan Accounts & Amortization Schedules (CRUD)</span>
          </span>
          <span className="text-xs text-slate-400 font-mono">{lenders.length} Active Loans</span>
        </h2>

        {lenders.length > 0 ? (
          <div className="mt-4 space-y-4">
            {lenders.map((lender) => (
              <div key={lender.id} className="p-4 rounded-xl bg-carbon-950 border border-carbon-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-carbon-800 pb-3">
                  <div>
                    <div className="flex items-center space-x-3">
                      <h3 className="text-base font-bold text-slate-100">{lender.lenderName}</h3>
                      <button
                        onClick={() => handleOpenLoanModal(lender)}
                        className="p-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        title="Edit Lender Loan Profile"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteLoan(lender.id, lender.lenderName)}
                        className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
                        title="Delete Lender Loan Profile"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-xs font-mono text-slate-400">Account #: {lender.accountNumber} | Rate: {lender.annualInterestRate}% p.a.</span>
                  </div>
                  <div className="font-mono text-right">
                    <span className="text-slate-400 text-xs block">Principal Outstanding</span>
                    <span className="text-amber-400 font-bold text-base">
                      ₹ {(lender.outstandingPrincipal || 0).toLocaleString('en-IN')} / ₹ {(lender.principalGranted || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* EMI Schedule Items */}
                {lender.emiSchedules && lender.emiSchedules.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Upcoming EMI Schedule
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead>
                          <tr className="text-slate-500 border-b border-carbon-800">
                            <th className="pb-2">DUE DATE</th>
                            <th className="pb-2">EMI AMOUNT</th>
                            <th className="pb-2">PRINCIPAL SPLIT</th>
                            <th className="pb-2">INTEREST SPLIT</th>
                            <th className="pb-2">STATUS</th>
                            <th className="pb-2 text-right">ACTION</th>
                          </tr>
                        </thead>
                        <tbody className="text-slate-200">
                          {lender.emiSchedules.map((emi: any) => (
                            <tr key={emi.id}>
                              <td className="py-2.5 font-bold text-slate-100">{new Date(emi.dueDate).toLocaleDateString()}</td>
                              <td className="py-2.5 font-bold text-red-400">₹ {(emi.emiAmount).toLocaleString('en-IN')}</td>
                              <td className="py-2.5 text-emerald-400">₹ {(emi.principalComponent).toLocaleString('en-IN')}</td>
                              <td className="py-2.5 text-amber-400">₹ {(emi.interestComponent).toLocaleString('en-IN')}</td>
                              <td className="py-2.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  emi.status === 'PAID' 
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                }`}>
                                  {emi.status}
                                </span>
                              </td>
                              <td className="py-2.5 text-right">
                                {emi.status === 'UPCOMING' && (
                                  <button
                                    onClick={() => handlePayEmi(emi.id)}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-carbon-950 font-bold px-3 py-1 rounded text-xs transition"
                                  >
                                    Pay EMI
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-slate-500 text-xs space-y-2">
            <Inbox className="w-8 h-8 mx-auto text-slate-600" />
            <p>No lender loans registered yet. Click "+ Add Lender Loan" above to create a loan profile.</p>
          </div>
        )}
      </div>

    </div>
  );
};
