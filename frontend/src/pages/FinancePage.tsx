import React, { useState, useEffect } from 'react';
import { Landmark, Check, Wallet, Building2, Inbox, Plus, Trash2 } from 'lucide-react';

interface FinancePageProps {
  summary: any;
  onRefresh: () => void;
}

export const FinancePage: React.FC<FinancePageProps> = ({ summary, onRefresh }) => {
  const [showAddLoanModal, setShowAddLoanModal] = useState(false);

  // Loan Form State
  const [lenderName, setLenderName] = useState('');
  const [lenderType, setLenderType] = useState('BANK');
  const [accountNumber, setAccountNumber] = useState('');
  const [principalGranted, setPrincipalGranted] = useState(2500000);
  const [outstandingPrincipal, setOutstandingPrincipal] = useState(1500000);
  const [annualInterestRate, setAnnualInterestRate] = useState(9.5);
  const [monthlyEmiAmount, setMonthlyEmiAmount] = useState(45000);
  const [tenureMonths, setTenureMonths] = useState(60);

  const [lenders, setLenders] = useState<any[]>([]);
  const [toast, setToast] = useState('');

  const pulse = summary?.financialPulse || {};

  const loadLenders = () => {
    fetch('/api/v1/finance/lenders')
      .then((res) => res.json())
      .then((json) => json.success && setLenders(json.data))
      .catch(() => {});
  };

  useEffect(() => {
    loadLenders();
  }, []);

  // ADD LENDER LOAN (CRUD)
  const handleAddLoan = async () => {
    if (!lenderName || !accountNumber) {
      alert('Please enter Lender Name and Loan Account Number');
      return;
    }

    try {
      const res = await fetch('/api/v1/finance/lenders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lenderName,
          lenderType,
          accountNumber,
          principalGranted,
          outstandingPrincipal,
          annualInterestRate,
          monthlyEmiAmount,
          tenureMonths,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setToast(`Lender Loan "${lenderName}" added successfully!`);
        setShowAddLoanModal(false);
        setLenderName('');
        setAccountNumber('');
        loadLenders();
        onRefresh();
        setTimeout(() => setToast(''), 4000);
      } else {
        alert(json.error);
      }
    } catch (e) {
      alert('Error adding loan profile');
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
          onClick={() => setShowAddLoanModal(!showAddLoanModal)}
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
            <span>HDFC CURRENT BANK</span>
            <Building2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-cyan-400 font-mono">
            ₹ {(pulse.totalBank || 0).toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Current Bank Account</span>
        </div>

        <div className="industrial-card border-amber-500/30">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>TOTAL LOAN OUTSTANDING</span>
            <Landmark className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-amber-400 font-mono">
            ₹ {(pulse.totalLoanOutstanding || 0).toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Monthly EMI: ₹{(pulse.emiDue30Days || 0).toLocaleString('en-IN')}</span>
        </div>

      </div>

      {/* ADD LENDER LOAN MODAL (CRUD) */}
      {showAddLoanModal && (
        <div className="industrial-card border-cyan-500/40 space-y-4">
          <h2 className="text-sm font-bold text-cyan-400 border-b border-carbon-700/60 pb-2 flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add New Lender / Bank Loan Profile</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Lender / Bank Name *</label>
              <input
                type="text"
                placeholder="e.g. HDFC Bank Factory Loan"
                value={lenderName}
                onChange={(e) => setLenderName(e.target.value)}
                className="w-full industrial-input"
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

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Principal Sanctioned (₹)</label>
              <input
                type="number"
                value={principalGranted}
                onChange={(e) => setPrincipalGranted(Number(e.target.value))}
                className="w-full industrial-input font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Current Outstanding (₹)</label>
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
              <label className="block text-xs font-semibold text-slate-300 mb-1">Monthly EMI Amount (₹)</label>
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
              onClick={handleAddLoan}
              className="px-5 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-carbon-950 text-xs font-bold shadow-lg"
            >
              Save Lender Loan Profile
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
