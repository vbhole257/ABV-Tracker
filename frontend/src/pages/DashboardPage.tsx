import React from 'react';
import { 
  Wallet, 
  Building2, 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  CheckCircle2, 
  ArrowUpRight, 
  Clock, 
  Inbox 
} from 'lucide-react';

interface DashboardPageProps {
  summary: any;
  onNavigateTab: (tab: string) => void;
  onOpenNewSale: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ 
  summary, 
  onNavigateTab,
  onOpenNewSale 
}) => {
  const pulse = summary?.financialPulse || {};
  const today = summary?.todaySummary || {};
  const target = summary?.targetMeter;
  const alerts = summary?.inventoryAlerts || {};
  const emis = summary?.upcomingEmis || [];

  return (
    <div className="space-y-6">
      
      {/* 1. FINANCIAL PULSE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-50 tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time financial pulse, target status, and factory operational summary
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={onOpenNewSale}
            className="bg-cyan-500 hover:bg-cyan-400 text-carbon-950 font-bold text-xs px-4 py-2.5 rounded-lg shadow-lg shadow-cyan-500/10 transition"
          >
            + Quick Wholesale Order
          </button>
        </div>
      </div>

      {/* 2. 4 FINANCIAL CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Available Cash & Bank */}
        <div className="industrial-card relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>AVAILABLE LIQUIDITY</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-50 font-mono">
            ₹ {(pulse.totalAvailableBalance || 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-3 pt-3 border-t border-carbon-700/60 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Cash: <strong className="text-emerald-400">₹{(pulse.totalCash || 0).toLocaleString('en-IN')}</strong></span>
            <span>Bank: <strong className="text-cyan-400">₹{(pulse.totalBank || 0).toLocaleString('en-IN')}</strong></span>
          </div>
        </div>

        {/* Card 2: Customer Outstanding */}
        <div className="industrial-card">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>CUSTOMER RECEIVABLES</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-cyan-400 font-mono">
            ₹ {(pulse.customerReceivables || 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-3 pt-3 border-t border-carbon-700/60 flex items-center justify-between text-xs text-slate-400">
            <span>Wholesaler Balances</span>
            <button 
              onClick={() => onNavigateTab('sales')}
              className="text-cyan-400 hover:underline font-semibold flex items-center"
            >
              View Ledgers <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>

        {/* Card 3: Total Loan Debt */}
        <div className="industrial-card">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>OUTSTANDING LOAN DEBT</span>
            <Building2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-amber-400 font-mono">
            ₹ {(pulse.totalLoanOutstanding || 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-3 pt-3 border-t border-carbon-700/60 flex items-center justify-between text-xs text-slate-400">
            <span>Supplier Payables</span>
            <span className="font-mono text-slate-300">₹{(pulse.supplierPayables || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Card 4: Upcoming 30-Day EMI */}
        <div className="industrial-card">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>30-DAY EMI OBLIGATION</span>
            <Clock className="w-4 h-4 text-red-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-red-400 font-mono">
            ₹ {(pulse.emiDue30Days || 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-3 pt-3 border-t border-carbon-700/60 flex items-center justify-between text-xs text-slate-400">
            <span>Upcoming Due Dates</span>
            <button 
              onClick={() => onNavigateTab('finance')}
              className="text-red-400 hover:underline font-semibold"
            >
              Loans & EMIs
            </button>
          </div>
        </div>

      </div>

      {/* 3. TARGET METER SECTION */}
      {target ? (
        <div className="industrial-card bg-gradient-to-r from-carbon-900 to-carbon-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 uppercase tracking-wider">
                  Target Progress
                </span>
                <span className="text-xs text-slate-400 font-mono">Period: {target.period}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-100 mt-1">
                Sales Target Progress: {target.percentAchieved}% Achieved
              </h2>
            </div>
            
            <div className="flex items-center space-x-6 text-xs font-mono">
              <div>
                <span className="text-slate-400 block">Cases Sold</span>
                <span className="text-slate-100 font-bold text-sm">
                  {(target.achievedCases || 0).toLocaleString()} / {(target.targetCases || 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Revenue Achieved</span>
                <span className="text-emerald-400 font-bold text-sm">
                  ₹{(target.achievedRevenue || 0).toLocaleString('en-IN')} / ₹{(target.targetRevenue || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 relative w-full h-3 bg-carbon-950 rounded-full overflow-hidden border border-carbon-700">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(target.percentAchieved || 0, 100)}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="industrial-card p-4 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>No active target set for current month.</span>
          <button onClick={() => onNavigateTab('sales')} className="text-cyan-400 hover:underline">
            + Create Monthly Sales Target
          </button>
        </div>
      )}

      {/* 4. TWO COLUMN OPERATIONAL FEED & ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Today's Operations Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="industrial-card">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2 border-b border-carbon-700/60 pb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Today's Operational Summary</span>
            </h3>

            {today.ordersCount > 0 ? (
              <div className="mt-4 p-4 rounded-lg bg-carbon-950 border border-carbon-800 text-xs font-mono flex justify-between">
                <div>
                  <span className="text-slate-400 block">Orders Generated Today</span>
                  <span className="text-slate-100 font-bold text-base">{today.ordersCount} Orders</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Total Cases Sold</span>
                  <span className="text-cyan-400 font-bold text-base">{today.casesSold} Cases</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Total Revenue</span>
                  <span className="text-emerald-400 font-bold text-base">₹{(today.revenue || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs space-y-2">
                <Inbox className="w-8 h-8 mx-auto text-slate-600" />
                <p>No sales dispatches recorded today yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Low Stock Alerts & EMIs */}
        <div className="space-y-4">
          
          <div className="industrial-card">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2 border-b border-carbon-700/60 pb-3">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Low Raw Material Alerts</span>
            </h3>

            {(alerts.lowStockMaterials || []).length > 0 ? (
              <div className="mt-3 space-y-2">
                {alerts.lowStockMaterials.map((m: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded bg-carbon-950 border border-amber-500/30 text-xs flex justify-between items-center">
                    <div>
                      <span className="font-bold text-amber-400 block">{m.name}</span>
                      <span className="text-slate-400 text-[11px]">Reorder Min: {m.reorder} {m.unit}</span>
                    </div>
                    <span className="font-mono text-xs px-2 py-1 rounded bg-amber-500/10 text-amber-300 font-bold">
                      {m.current} {m.unit} Left
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-500 text-xs">
                No raw material low-stock alerts.
              </div>
            )}
          </div>

          <div className="industrial-card border-red-500/30">
            <h3 className="text-sm font-bold text-slate-100 flex items-center justify-between border-b border-carbon-700/60 pb-3">
              <span className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-red-400" />
                <span>Upcoming EMI Payment</span>
              </span>
            </h3>

            {emis.length > 0 ? (
              emis.map((emi: any) => (
                <div key={emi.id} className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Lender:</span>
                    <strong className="text-slate-100">{emi.lenderName}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300 font-mono">
                    <span>EMI Amount:</span>
                    <strong className="text-red-400 text-sm">₹ {(emi.amount).toLocaleString('en-IN')}</strong>
                  </div>
                  <button
                    onClick={() => onNavigateTab('finance')}
                    className="w-full mt-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold text-xs py-2 rounded-lg border border-red-500/40 transition"
                  >
                    Pay EMI Now
                  </button>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-slate-500 text-xs">
                No upcoming EMIs due in the next 30 days.
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
