import React, { useState, useEffect } from 'react';
import { Users, Check, Trash2, UserPlus, Inbox } from 'lucide-react';

interface PayrollExpensesPageProps {
  onRefresh: () => void;
}

export const PayrollExpensesPage: React.FC<PayrollExpensesPageProps> = ({ onRefresh }) => {
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Staff Form State
  const [empName, setEmpName] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empDesig, setEmpDesig] = useState('');
  const [empWageType, setEmpWageType] = useState('MONTHLY_FIXED');
  const [empBaseRate, setEmpBaseRate] = useState(18000);

  const [expCategory, setExpCategory] = useState('ELECTRICITY');
  const [expAmount, setExpAmount] = useState(0);
  const [employees, setEmployees] = useState<any[]>([]);
  const [toast, setToast] = useState('');

  const loadEmployees = () => {
    fetch('/api/v1/employees')
      .then((res) => res.json())
      .then((json) => json.success && setEmployees(json.data))
      .catch(() => {});
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  // ADD EMPLOYEE CRUD
  const handleAddEmployee = async () => {
    if (!empName || !empPhone || !empDesig) {
      alert('Please fill in Employee Name, Phone, and Designation');
      return;
    }

    try {
      const res = await fetch('/api/v1/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: empName,
          phone: empPhone,
          designation: empDesig,
          wageType: empWageType,
          baseRate: empBaseRate,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setToast(`Staff member "${empName}" added successfully!`);
        setShowAddStaffModal(false);
        setEmpName('');
        setEmpPhone('');
        setEmpDesig('');
        loadEmployees();
        setTimeout(() => setToast(''), 4000);
      }
    } catch (e) {
      alert('Error adding employee');
    }
  };

  // DELETE EMPLOYEE CRUD
  const handleDeleteEmployee = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete employee "${name}"?`)) return;

    try {
      const res = await fetch(`/api/v1/employees/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setToast(`Employee "${name}" deleted!`);
        loadEmployees();
        setTimeout(() => setToast(''), 4000);
      }
    } catch (e) {
      alert('Error deleting employee');
    }
  };

  const handleExpense = () => {
    setToast(`Factory Expense of ₹${expAmount.toLocaleString()} logged under ${expCategory}.`);
    setShowExpenseModal(false);
    setTimeout(() => setToast(''), 4000);
  };

  return (
    <div className="space-y-6">
      
      {toast && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-sm font-bold flex items-center space-x-2">
          <Check className="w-5 h-5" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header & CRUD Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-50 tracking-tight">Payroll, Advances & Factory Expenses</h1>
          <p className="text-xs text-slate-400 mt-1">
            Worker roster (CRUD), salary advance debits, monthly wage calculations, and factory expense logging
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddStaffModal(!showAddStaffModal)}
            className="bg-cyan-500 hover:bg-cyan-400 text-carbon-950 font-bold text-xs px-3.5 py-2.5 rounded-lg shadow-lg transition flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Employee</span>
          </button>
          <button
            onClick={() => setShowExpenseModal(!showExpenseModal)}
            className="bg-emerald-500 hover:bg-emerald-400 text-carbon-950 font-bold text-xs px-3.5 py-2.5 rounded-lg shadow-lg transition"
          >
            + Log Factory Expense
          </button>
        </div>
      </div>

      {/* ADD EMPLOYEE MODAL (CRUD) */}
      {showAddStaffModal && (
        <div className="industrial-card border-cyan-500/40 space-y-4">
          <h2 className="text-sm font-bold text-cyan-400 border-b border-carbon-700/60 pb-2 flex items-center space-x-2">
            <UserPlus className="w-4 h-4" />
            <span>Add New Employee / Worker Profile</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
              <input
                type="text"
                placeholder="e.g. Ramesh Kumar"
                value={empName}
                onChange={(e) => setEmpName(e.target.value)}
                className="w-full industrial-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number *</label>
              <input
                type="text"
                placeholder="e.g. +91 98111 22334"
                value={empPhone}
                onChange={(e) => setEmpPhone(e.target.value)}
                className="w-full industrial-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Designation *</label>
              <input
                type="text"
                placeholder="e.g. Factory Supervisor / Operator"
                value={empDesig}
                onChange={(e) => setEmpDesig(e.target.value)}
                className="w-full industrial-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Wage Type</label>
              <select
                value={empWageType}
                onChange={(e) => setEmpWageType(e.target.value)}
                className="w-full industrial-input font-bold text-cyan-400"
              >
                <option value="MONTHLY_FIXED">Monthly Fixed Salary</option>
                <option value="DAILY_WAGE">Daily Wage Laborer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Base Rate (₹)</label>
              <input
                type="number"
                value={empBaseRate}
                onChange={(e) => setEmpBaseRate(Number(e.target.value))}
                className="w-full industrial-input font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              onClick={() => setShowAddStaffModal(false)}
              className="px-4 py-2 rounded bg-carbon-800 text-slate-300 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleAddEmployee}
              className="px-5 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-carbon-950 text-xs font-bold shadow-lg"
            >
              Save Employee Profile
            </button>
          </div>
        </div>
      )}

      {/* EXPENSE LOG MODAL */}
      {showExpenseModal && (
        <div className="industrial-card border-emerald-500/30 space-y-4">
          <h2 className="text-sm font-bold text-emerald-400 border-b border-carbon-700/60 pb-2">
            Log Factory Expense Entry
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Expense Category</label>
              <select
                value={expCategory}
                onChange={(e) => setExpCategory(e.target.value)}
                className="w-full industrial-input"
              >
                <option value="ELECTRICITY">Electricity & Power</option>
                <option value="DIESEL">Diesel / Generator Fuel</option>
                <option value="FREIGHT">Freight & Delivery Transport</option>
                <option value="MAINTENANCE">Factory Machine Maintenance</option>
                <option value="SUPPLIES">Factory Supplies</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Amount (₹)</label>
              <input
                type="number"
                value={expAmount}
                onChange={(e) => setExpAmount(Number(e.target.value))}
                className="w-full industrial-input font-bold text-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Mode</label>
              <select className="w-full industrial-input">
                <option value="CASH">Factory Cash Box</option>
                <option value="BANK">HDFC Bank Account</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleExpense}
              className="bg-emerald-500 hover:bg-emerald-400 text-carbon-950 font-bold text-xs px-5 py-2.5 rounded-lg shadow-lg"
            >
              Save Expense Entry
            </button>
          </div>
        </div>
      )}

      {/* WORKERS & PAYROLL TABLE (CRUD) */}
      <div className="industrial-card">
        <h2 className="text-sm font-bold text-slate-100 flex items-center justify-between border-b border-carbon-700/60 pb-3">
          <span className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Employee Roster & Salary Advance Ledgers (CRUD)</span>
          </span>
          <span className="text-xs text-slate-400 font-mono">{employees.length} Staff Members</span>
        </h2>

        {employees.length > 0 ? (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-slate-400 border-b border-carbon-800">
                  <th className="pb-3">EMPLOYEE NAME</th>
                  <th className="pb-3">DESIGNATION</th>
                  <th className="pb-3">WAGE TYPE</th>
                  <th className="pb-3">BASE WAGE</th>
                  <th className="pb-3">ADVANCE BALANCE</th>
                  <th className="pb-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-carbon-800/60 text-slate-200">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-carbon-800/40">
                    <td className="py-3 font-bold text-slate-100">{emp.name}</td>
                    <td className="py-3 text-slate-400">{emp.designation}</td>
                    <td className="py-3 text-cyan-400 font-bold">{emp.wageType}</td>
                    <td className="py-3 text-slate-300">₹{(emp.baseRate || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3 text-amber-400 font-bold">₹{(emp.advanceBalance || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                        className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
                        title="Delete Employee"
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
            <p>No staff or workers registered yet. Click "+ Add Employee" above to register staff.</p>
          </div>
        )}
      </div>

    </div>
  );
};
