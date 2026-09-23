import React from 'react';
import { 
  BarChart3, 
  ShoppingCart, 
  Factory, 
  Package, 
  Landmark, 
  Users, 
  PlusCircle, 
  Wallet, 
  Building2 
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  summaryData: any;
  onOpenNewSale: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  setActiveTab, 
  summaryData,
  onOpenNewSale 
}) => {
  const cash = summaryData?.financialPulse?.totalCash ?? 140000;
  const bank = summaryData?.financialPulse?.totalBank ?? 820000;

  const navItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: BarChart3 },
    { id: 'sales', label: 'Sales & Wholesalers', icon: ShoppingCart },
    { id: 'production', label: 'Production & Recipes', icon: Factory },
    { id: 'inventory', label: 'Stock & Purchases', icon: Package },
    { id: 'finance', label: 'Loans & Cash/Bank', icon: Landmark },
    { id: 'payroll', label: 'Payroll & Expenses', icon: Users },
  ];

  return (
    <header className="sticky top-0 z-50 bg-carbon-900/95 border-b border-carbon-700/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center font-bold text-carbon-950 shadow-md">
              AF
            </div>
            <div>
              <span className="text-lg font-extrabold text-slate-50 tracking-tight">ABVFOODS</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                TRACKER v1.1
              </span>
            </div>
          </div>

          {/* Quick Cash & Bank Pulse Pills */}
          <div className="hidden md:flex items-center space-x-4 font-mono text-xs">
            <div className="flex items-center space-x-2 bg-carbon-950 px-3 py-1.5 rounded-lg border border-carbon-700">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">Cash:</span>
              <span className="font-semibold text-emerald-400">₹ {(cash).toLocaleString('en-IN')}</span>
            </div>

            <div className="flex items-center space-x-2 bg-carbon-950 px-3 py-1.5 rounded-lg border border-carbon-700">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Bank:</span>
              <span className="font-semibold text-cyan-400">₹ {(bank).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenNewSale}
              className="flex items-center space-x-2 bg-cyan-500 hover:bg-cyan-400 text-carbon-950 font-bold px-4 py-2 rounded-lg text-sm transition shadow-lg shadow-cyan-500/10"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ New Sale</span>
            </button>
          </div>

        </div>

        {/* Tab Navigation Menu */}
        <nav className="flex space-x-1 overflow-x-auto pb-2 pt-1 border-t border-carbon-800/60 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-carbon-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

      </div>
    </header>
  );
};
