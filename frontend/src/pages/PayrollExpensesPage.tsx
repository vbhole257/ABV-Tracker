import React, { useState, useEffect } from 'react';
import { Users, Check, Trash2, Edit, UserPlus, DollarSign, CreditCard, Calendar, Inbox, Clock, CheckSquare } from 'lucide-react';

interface PayrollExpensesPageProps {
  onRefresh: () => void;
}

export const PayrollExpensesPage: React.FC<PayrollExpensesPageProps> = ({ onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'STAFF' | 'ATTENDANCE' | 'ADVANCES' | 'PAYROLL' | 'EXPENSES'>('STAFF');
  const [toast, setToast] = useState('');

  // Data States
  const [employees, setEmployees] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);

  // Staff Form State (Add / Edit)
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [empName, setEmpName] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empDesig, setEmpDesig] = useState('');
  const [empWageType, setEmpWageType] = useState('MONTHLY_FIXED');
  const [empBaseRate, setEmpBaseRate] = useState(18000);

  // Attendance Modal State
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attEmpId, setAttEmpId] = useState('');
  const [attDate, setAttDate] = useState(new Date().toISOString().slice(0, 10));
  const [attStatus, setAttStatus] = useState('PRESENT');
  const [attOtHours, setAttOtHours] = useState(0);
  const [attNotes, setAttNotes] = useState('');

  // Salary Advance Deposit Modal State
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advEmpId, setAdvEmpId] = useState('');
  const [advAmount, setAdvAmount] = useState(2000);
  const [advAccountId, setAdvAccountId] = useState('');
  const [advNotes, setAdvNotes] = useState('');

  // Payroll Settlement Modal State
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [payEmpId, setPayEmpId] = useState('');
  const [payMonth, setPayMonth] = useState(new Date().getMonth() + 1);
  const [payYear, setPayYear] = useState(new Date().getFullYear());
  const [payGross, setPayGross] = useState(18000);
  const [payAdvanceDeducted, setPayAdvanceDeducted] = useState(0);
  const [payMode, setPayMode] = useState('CASH');
  const [payAccountId, setPayAccountId] = useState('');

  const loadData = async () => {
    try {
      const [empRes, advRes, payRes, attRes, accRes] = await Promise.all([
        fetch('/api/v1/employees').then((r) => r.json()),
        fetch('/api/v1/employees/salary-advances').then((r) => r.json()),
        fetch('/api/v1/employees/payrolls').then((r) => r.json()),
        fetch('/api/v1/employees/attendance').then((r) => r.json()),
        fetch('/api/v1/accounts').then((r) => r.json()),
      ]);

      if (empRes.success) {
        setEmployees(empRes.data);
        if (empRes.data.length > 0) {
          if (!attEmpId) setAttEmpId(empRes.data[0].id);
          if (!advEmpId) setAdvEmpId(empRes.data[0].id);
          if (!payEmpId) setPayEmpId(empRes.data[0].id);
        }
      }
      if (advRes.success) setAdvances(advRes.data);
      if (payRes.success) setPayrolls(payRes.data);
      if (attRes.success) setAttendances(attRes.data);
      if (accRes.success) {
        setAccounts(accRes.data);
        if (accRes.data.length > 0) {
          setAdvAccountId(accRes.data[0].id);
          setPayAccountId(accRes.data[0].id);
        }
      }
    } catch (e) {
      console.error('Failed loading payroll data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  // STAFF CRUD: Open Add/Edit Modal
  const handleOpenStaffModal = (emp?: any) => {
    if (emp) {
      setEditingEmpId(emp.id);
      setEmpName(emp.name);
      setEmpPhone(emp.phone);
      setEmpDesig(emp.designation);
      setEmpWageType(emp.wageType);
      setEmpBaseRate(emp.baseRate);
    } else {
      setEditingEmpId(null);
      setEmpName('');
      setEmpPhone('');
      setEmpDesig('');
      setEmpWageType('MONTHLY_FIXED');
      setEmpBaseRate(18000);
    }
    setShowStaffModal(true);
  };

  // STAFF CRUD: Save (Create / Update)
  const handleSaveStaff = async () => {
    if (!empName || !empPhone || !empDesig) {
      alert('Please enter Name, Phone, and Designation');
      return;
    }

    try {
      const endpoint = editingEmpId ? `/api/v1/employees/${editingEmpId}` : '/api/v1/employees';
      const method = editingEmpId ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
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
        triggerToast(`Staff member "${empName}" ${editingEmpId ? 'updated' : 'added'} successfully!`);
        setShowStaffModal(false);
        loadData();
        onRefresh();
      } else {
        alert(json.message || 'Error saving staff');
      }
    } catch (e) {
      alert('Network error saving staff profile');
    }
  };

  // STAFF CRUD: Delete
  const handleDeleteEmployee = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete staff member "${name}"? This will also purge their advances & payroll history.`)) return;

    try {
      const res = await fetch(`/api/v1/employees/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        triggerToast(`Staff "${name}" deleted successfully.`);
        loadData();
        onRefresh();
      }
    } catch (e) {
      alert('Error deleting staff member');
    }
  };

  // ATTENDANCE CRUD: Mark Attendance
  const handleMarkAttendance = async () => {
    if (!attEmpId) {
      alert('Please select a staff member');
      return;
    }

    try {
      const res = await fetch('/api/v1/employees/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: attEmpId,
          attDate,
          status: attStatus,
          overtimeHours: Number(attOtHours),
          notes: attNotes,
        }),
      });

      const json = await res.json();
      if (json.success) {
        const emp = employees.find((e) => e.id === attEmpId);
        triggerToast(`Attendance marked as ${attStatus} for ${emp?.name || 'Staff'}.`);
        setShowAttendanceModal(false);
        loadData();
        onRefresh();
      } else {
        alert(json.message || 'Error marking attendance');
      }
    } catch (e) {
      alert('Network error recording attendance');
    }
  };

  // ATTENDANCE CRUD: Delete Record
  const handleDeleteAttendance = async (id: string) => {
    if (!confirm('Are you sure you want to delete this attendance entry?')) return;

    try {
      const res = await fetch(`/api/v1/employees/attendance/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        triggerToast('Attendance record deleted.');
        loadData();
        onRefresh();
      }
    } catch (e) {
      alert('Error deleting attendance entry');
    }
  };

  // SALARY ADVANCE CRUD: Open Modal
  const handleOpenAdvanceModal = (empId?: string) => {
    const selected = employees.find((e) => e.id === empId) || employees[0];
    if (selected) {
      setAdvEmpId(selected.id);
    }
    setAdvAmount(2000);
    setAdvNotes('Emergency salary advance');
    setShowAdvanceModal(true);
  };

  // SALARY ADVANCE CRUD: Deposit Advance
  const handleDepositAdvance = async () => {
    if (!advEmpId) {
      alert('Please select a staff member');
      return;
    }
    if (advAmount <= 0) {
      alert('Advance amount must be greater than 0');
      return;
    }

    try {
      const res = await fetch('/api/v1/employees/salary-advances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: advEmpId,
          amount: advAmount,
          accountId: advAccountId || undefined,
          notes: advNotes,
        }),
      });

      const json = await res.json();
      if (json.success) {
        const emp = employees.find((e) => e.id === advEmpId);
        triggerToast(`Salary advance of ₹${advAmount.toLocaleString()} paid to ${emp?.name || 'Staff'}.`);
        setShowAdvanceModal(false);
        loadData();
        onRefresh();
      } else {
        alert(json.message || 'Error depositing salary advance');
      }
    } catch (e) {
      alert('Network error issuing salary advance');
    }
  };

  // SALARY ADVANCE CRUD: Delete Advance
  const handleDeleteAdvance = async (id: string, amount: number) => {
    if (!confirm(`Are you sure you want to delete/rollback this ₹${amount} advance entry?`)) return;

    try {
      const res = await fetch(`/api/v1/employees/salary-advances/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        triggerToast('Salary advance record deleted & staff balance restored.');
        loadData();
        onRefresh();
      }
    } catch (e) {
      alert('Error deleting advance record');
    }
  };

  // Helper: Calculate attendance-based salary with 2 allowed paid holidays
  const calculateSalaryBreakdown = (empId: string, month: number, year: number) => {
    const selectedEmp = employees.find((e) => e.id === empId);
    const baseRate = selectedEmp?.baseRate || 0;

    // Filter attendance records for selected employee & period
    const empAttendances = attendances.filter((att) => {
      if (att.employeeId !== empId) return false;
      const d = new Date(att.attDate);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    });

    let fullDaysAbsent = 0;
    let halfDaysCount = 0;
    let presentDaysCount = 0;
    let overtimeDaysCount = 0;
    let totalOtHours = 0;

    empAttendances.forEach((att) => {
      if (att.status === 'ABSENT') fullDaysAbsent += 1;
      else if (att.status === 'HALF_DAY') halfDaysCount += 1;
      else if (att.status === 'PRESENT') presentDaysCount += 1;
      else if (att.status === 'OVERTIME') {
        overtimeDaysCount += 1;
        totalOtHours += att.overtimeHours || 0;
      }
    });

    const totalAbsentEquivalent = fullDaysAbsent + halfDaysCount * 0.5;
    const allowedHolidays = 2; // 2 allowed paid holidays per month
    const excessAbsents = Math.max(0, totalAbsentEquivalent - allowedHolidays);

    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyRate = daysInMonth > 0 ? baseRate / daysInMonth : 0;
    const deductionAmount = Math.round(excessAbsents * dailyRate);
    const recommendedGross = Math.max(0, Math.round(baseRate - deductionAmount));

    return {
      baseRate,
      daysInMonth,
      fullDaysAbsent,
      halfDaysCount,
      presentDaysCount,
      overtimeDaysCount,
      totalOtHours,
      totalAbsentEquivalent,
      allowedHolidays,
      excessAbsents,
      dailyRate,
      deductionAmount,
      recommendedGross,
    };
  };

  const updatePayrollForEmployeeAndPeriod = (empId: string, month: number, year: number) => {
    const breakdown = calculateSalaryBreakdown(empId, month, year);
    setPayGross(breakdown.recommendedGross);
    const selectedEmp = employees.find((e) => e.id === empId);
    const advBal = selectedEmp?.advanceBalance || 0;
    setPayAdvanceDeducted(Math.min(breakdown.recommendedGross, advBal));
  };

  // PAYROLL CRUD: Open Modal
  const handleOpenPayrollModal = (empId?: string) => {
    const selected = employees.find((e) => e.id === empId) || employees[0];
    if (selected) {
      setPayEmpId(selected.id);
      updatePayrollForEmployeeAndPeriod(selected.id, payMonth, payYear);
    }
    setShowPayrollModal(true);
  };

  const handlePayEmpChange = (empId: string) => {
    setPayEmpId(empId);
    updatePayrollForEmployeeAndPeriod(empId, payMonth, payYear);
  };

  const handlePayMonthChange = (m: number) => {
    setPayMonth(m);
    if (payEmpId) updatePayrollForEmployeeAndPeriod(payEmpId, m, payYear);
  };

  const handlePayYearChange = (y: number) => {
    setPayYear(y);
    if (payEmpId) updatePayrollForEmployeeAndPeriod(payEmpId, payMonth, y);
  };

  // PAYROLL CRUD: Process Settlement
  const handleProcessPayroll = async () => {
    if (!payEmpId) {
      alert('Please select a staff member');
      return;
    }

    try {
      const res = await fetch('/api/v1/employees/payrolls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: payEmpId,
          periodMonth: Number(payMonth),
          periodYear: Number(payYear),
          grossSalary: Number(payGross),
          advanceDeducted: Number(payAdvanceDeducted),
          paymentMode: payMode,
          accountId: payAccountId || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        const emp = employees.find((e) => e.id === payEmpId);
        triggerToast(`Payroll settled for ${emp?.name || 'Staff'} (Net Paid: ₹${(payGross - payAdvanceDeducted).toLocaleString()}).`);
        setShowPayrollModal(false);
        loadData();
        onRefresh();
      } else {
        alert(json.message || 'Error processing payroll');
      }
    } catch (e) {
      alert('Network error processing payroll');
    }
  };

  // PAYROLL CRUD: Rollback / Delete Payroll
  const handleDeletePayroll = async (id: string) => {
    if (!confirm('Are you sure you want to rollback this payroll settlement?')) return;

    try {
      const res = await fetch(`/api/v1/employees/payrolls/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        triggerToast('Payroll record rolled back & deducted advance restored.');
        loadData();
        onRefresh();
      }
    } catch (e) {
      alert('Error deleting payroll record');
    }
  };

  // Calculate Metrics
  const totalAdvancesOutstanding = employees.reduce((acc, curr) => acc + (curr.advanceBalance || 0), 0);
  const totalPayrollPaid = payrolls.reduce((acc, curr) => acc + (curr.netPaid || 0), 0);

  return (
    <div className="space-y-6">
      
      {toast && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-sm font-bold flex items-center space-x-2">
          <Check className="w-5 h-5" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-50 tracking-tight">Staff Attendance, Advances & Payroll CRUD</h1>
          <p className="text-xs text-slate-400 mt-1">
            Staff attendance tracker, worker roster, salary advance debits & deposits, and wage calculations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAttendanceModal(true)}
            className="bg-cyan-500 hover:bg-cyan-400 text-carbon-950 font-bold text-xs px-3.5 py-2.5 rounded-lg shadow-lg transition flex items-center space-x-1.5"
          >
            <CheckSquare className="w-4 h-4" />
            <span>+ Mark Attendance</span>
          </button>
          <button
            onClick={() => handleOpenStaffModal()}
            className="bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold text-xs px-3.5 py-2.5 rounded-lg shadow-lg transition flex items-center space-x-1.5"
          >
            <UserPlus className="w-4 h-4 text-cyan-400" />
            <span>+ Add Staff</span>
          </button>
          <button
            onClick={() => handleOpenAdvanceModal()}
            className="bg-amber-500 hover:bg-amber-400 text-carbon-950 font-bold text-xs px-3.5 py-2.5 rounded-lg shadow-lg transition flex items-center space-x-1.5"
          >
            <DollarSign className="w-4 h-4" />
            <span>+ Give Advance</span>
          </button>
          <button
            onClick={() => handleOpenPayrollModal()}
            className="bg-emerald-500 hover:bg-emerald-400 text-carbon-950 font-bold text-xs px-3.5 py-2.5 rounded-lg shadow-lg transition flex items-center space-x-1.5"
          >
            <CreditCard className="w-4 h-4" />
            <span>+ Settle Payroll</span>
          </button>
        </div>
      </div>

      {/* Top Industrial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="industrial-card border-cyan-500/30">
          <span className="text-xs font-semibold text-slate-400">REGISTERED STAFF ROSTER</span>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">{employees.length} Active Staff</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Monthly & Daily wage workers</span>
        </div>

        <div className="industrial-card border-amber-500/30">
          <span className="text-xs font-semibold text-slate-400">TOTAL OUTSTANDING SALARY ADVANCES</span>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            ₹{totalAdvancesOutstanding.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-amber-500/80 mt-1 block">To be deducted from monthly wages</span>
        </div>

        <div className="industrial-card border-emerald-500/30">
          <span className="text-xs font-semibold text-slate-400">TOTAL PAYROLL DISBURSED</span>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            ₹{totalPayrollPaid.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">{payrolls.length} Payroll Settlements logged</span>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-carbon-800 space-x-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('STAFF')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'STAFF'
              ? 'bg-carbon-800 text-cyan-400 border-t-2 border-cyan-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff Roster ({employees.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ATTENDANCE')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'ATTENDANCE'
              ? 'bg-carbon-800 text-cyan-400 border-t-2 border-cyan-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Attendance Log ({attendances.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ADVANCES')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'ADVANCES'
              ? 'bg-carbon-800 text-amber-400 border-t-2 border-amber-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Salary Advance Ledger ({advances.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('PAYROLL')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'PAYROLL'
              ? 'bg-carbon-800 text-emerald-400 border-t-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payroll Settlements ({payrolls.length})</span>
        </button>
      </div>

      {/* TAB 1: STAFF ROSTER (CRUD) */}
      {activeTab === 'STAFF' && (
        <div className="industrial-card">
          <div className="flex items-center justify-between border-b border-carbon-700/60 pb-3">
            <h2 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Staff & Worker Roster (CRUD)</span>
            </h2>
            <button
              onClick={() => handleOpenStaffModal()}
              className="text-xs font-bold text-cyan-400 hover:underline"
            >
              + Add New Staff
            </button>
          </div>

          {employees.length > 0 ? (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-slate-400 border-b border-carbon-800">
                    <th className="pb-3">NAME & PHONE</th>
                    <th className="pb-3">DESIGNATION</th>
                    <th className="pb-3">WAGE TYPE</th>
                    <th className="pb-3">BASE RATE</th>
                    <th className="pb-3">ADVANCE BALANCE</th>
                    <th className="pb-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-carbon-800/60 text-slate-200">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-carbon-800/40">
                      <td className="py-3">
                        <div className="font-bold text-slate-100">{emp.name}</div>
                        <div className="text-[11px] text-slate-400">{emp.phone}</div>
                      </td>
                      <td className="py-3 text-slate-300">{emp.designation}</td>
                      <td className="py-3 font-bold text-cyan-400">
                        {emp.wageType === 'DAILY_WAGE' ? 'Daily Wage' : 'Monthly Fixed'}
                      </td>
                      <td className="py-3 text-slate-200">
                        ₹{(emp.baseRate || 0).toLocaleString('en-IN')} {emp.wageType === 'DAILY_WAGE' ? '/day' : '/mo'}
                      </td>
                      <td className="py-3 font-bold text-amber-400">
                        ₹{(emp.advanceBalance || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 text-right space-x-1">
                        <button
                          onClick={() => handleOpenAdvanceModal(emp.id)}
                          className="px-2 py-1 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 text-[11px] font-bold"
                          title="Give Salary Advance"
                        >
                          + Advance
                        </button>
                        <button
                          onClick={() => handleOpenPayrollModal(emp.id)}
                          className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 text-[11px] font-bold"
                          title="Pay Salary"
                        >
                          Pay Salary
                        </button>
                        <button
                          onClick={() => handleOpenStaffModal(emp)}
                          className="p-1.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                          title="Edit Staff"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                          className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
                          title="Delete Staff"
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
              <p>No staff or workers registered yet. Click "+ Add Staff" above.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STAFF ATTENDANCE LOG (CRUD) */}
      {activeTab === 'ATTENDANCE' && (
        <div className="industrial-card">
          <div className="flex items-center justify-between border-b border-carbon-700/60 pb-3">
            <h2 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <CheckSquare className="w-4 h-4 text-cyan-400" />
              <span>Daily Staff Attendance & Overtime Log</span>
            </h2>
            <button
              onClick={() => setShowAttendanceModal(true)}
              className="text-xs font-bold text-cyan-400 hover:underline"
            >
              + Mark Daily Attendance
            </button>
          </div>

          {attendances.length > 0 ? (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-slate-400 border-b border-carbon-800">
                    <th className="pb-3">DATE</th>
                    <th className="pb-3">STAFF MEMBER</th>
                    <th className="pb-3">DESIGNATION</th>
                    <th className="pb-3">ATTENDANCE STATUS</th>
                    <th className="pb-3">OVERTIME HOURS</th>
                    <th className="pb-3">NOTES</th>
                    <th className="pb-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-carbon-800/60 text-slate-200">
                  {attendances.map((att) => (
                    <tr key={att.id} className="hover:bg-carbon-800/40">
                      <td className="py-3 text-slate-300">{new Date(att.attDate || att.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 font-bold text-slate-100">{att.employee?.name || 'Staff Member'}</td>
                      <td className="py-3 text-slate-400">{att.employee?.designation || '-'}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            att.status === 'PRESENT'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : att.status === 'ABSENT'
                              ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : att.status === 'HALF_DAY'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                          }`}
                        >
                          {att.status}
                        </span>
                      </td>
                      <td className="py-3 font-bold text-cyan-400">
                        {att.overtimeHours > 0 ? `${att.overtimeHours} hrs` : '-'}
                      </td>
                      <td className="py-3 text-slate-400">{att.notes || '-'}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDeleteAttendance(att.id)}
                          className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
                          title="Delete Attendance Entry"
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
              <p>No attendance records logged yet. Click "+ Mark Daily Attendance".</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SALARY ADVANCES LEDGER (CRUD) */}
      {activeTab === 'ADVANCES' && (
        <div className="industrial-card">
          <div className="flex items-center justify-between border-b border-carbon-700/60 pb-3">
            <h2 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span>Salary Advance Transaction Log (CRUD)</span>
            </h2>
            <button
              onClick={() => handleOpenAdvanceModal()}
              className="text-xs font-bold text-amber-400 hover:underline"
            >
              + Issue Salary Advance
            </button>
          </div>

          {advances.length > 0 ? (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-slate-400 border-b border-carbon-800">
                    <th className="pb-3">STAFF MEMBER</th>
                    <th className="pb-3">DATE</th>
                    <th className="pb-3">ADVANCE AMOUNT</th>
                    <th className="pb-3">NOTES</th>
                    <th className="pb-3">STATUS</th>
                    <th className="pb-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-carbon-800/60 text-slate-200">
                  {advances.map((adv) => (
                    <tr key={adv.id} className="hover:bg-carbon-800/40">
                      <td className="py-3 font-bold text-slate-100">{adv.employee?.name || 'Staff Member'}</td>
                      <td className="py-3 text-slate-400">
                        {new Date(adv.advanceDate || adv.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 font-bold text-amber-400">₹{(adv.amount || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 text-slate-300">{adv.notes || '-'}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          {adv.status || 'OPEN'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDeleteAdvance(adv.id, adv.amount)}
                          className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
                          title="Delete / Rollback Advance"
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
              <p>No salary advances issued yet. Click "+ Issue Salary Advance" to deposit an advance.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PAYROLL SETTLEMENT HISTORY (CRUD) */}
      {activeTab === 'PAYROLL' && (
        <div className="industrial-card">
          <div className="flex items-center justify-between border-b border-carbon-700/60 pb-3">
            <h2 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Monthly Payroll & Wage Settlements (CRUD)</span>
            </h2>
            <button
              onClick={() => handleOpenPayrollModal()}
              className="text-xs font-bold text-emerald-400 hover:underline"
            >
              + Settle Monthly Salary
            </button>
          </div>

          {payrolls.length > 0 ? (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-slate-400 border-b border-carbon-800">
                    <th className="pb-3">STAFF MEMBER</th>
                    <th className="pb-3">PERIOD</th>
                    <th className="pb-3">GROSS SALARY</th>
                    <th className="pb-3">ADVANCE DEDUCTED</th>
                    <th className="pb-3">NET PAID</th>
                    <th className="pb-3">MODE</th>
                    <th className="pb-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-carbon-800/60 text-slate-200">
                  {payrolls.map((pay) => (
                    <tr key={pay.id} className="hover:bg-carbon-800/40">
                      <td className="py-3 font-bold text-slate-100">{pay.employee?.name || 'Staff Member'}</td>
                      <td className="py-3 text-cyan-400 font-bold">
                        {pay.periodMonth}/{pay.periodYear}
                      </td>
                      <td className="py-3 text-slate-300">₹{(pay.grossSalary || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 text-amber-400">₹{(pay.advanceDeducted || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 font-bold text-emerald-400">₹{(pay.netPaid || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 text-slate-400">{pay.paymentMode}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDeletePayroll(pay.id)}
                          className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
                          title="Rollback Payroll"
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
              <p>No payroll settlements logged yet. Click "+ Settle Monthly Salary".</p>
            </div>
          )}
        </div>
      )}

      {/* MODAL: MARK ATTENDANCE */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="industrial-card border-cyan-500/40 w-full max-w-lg space-y-4">
            <h2 className="text-sm font-bold text-cyan-400 border-b border-carbon-700/60 pb-2 flex items-center space-x-2">
              <CheckSquare className="w-4 h-4" />
              <span>Mark Staff Daily Attendance</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Select Staff Member *</label>
                <select
                  value={attEmpId}
                  onChange={(e) => setAttEmpId(e.target.value)}
                  className="w-full industrial-input font-bold text-cyan-400"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.designation}) — {emp.wageType}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Attendance Date</label>
                  <input
                    type="date"
                    value={attDate}
                    onChange={(e) => setAttDate(e.target.value)}
                    className="w-full industrial-input font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Status *</label>
                  <select
                    value={attStatus}
                    onChange={(e) => setAttStatus(e.target.value)}
                    className="w-full industrial-input font-bold text-emerald-400"
                  >
                    <option value="PRESENT">PRESENT (Full Day)</option>
                    <option value="ABSENT">ABSENT</option>
                    <option value="HALF_DAY">HALF DAY</option>
                    <option value="OVERTIME">OVERTIME</option>
                  </select>
                </div>
              </div>

              {attStatus === 'OVERTIME' && (
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Overtime Hours</label>
                  <input
                    type="number"
                    value={attOtHours}
                    onChange={(e) => setAttOtHours(Number(e.target.value))}
                    className="w-full industrial-input font-mono font-bold text-cyan-400"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Notes / Shift Details</label>
                <input
                  type="text"
                  placeholder="e.g. Night shift / Machine maintenance extra hours"
                  value={attNotes}
                  onChange={(e) => setAttNotes(e.target.value)}
                  className="w-full industrial-input"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-carbon-800">
              <button
                onClick={() => setShowAttendanceModal(false)}
                className="px-4 py-2 rounded bg-carbon-800 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAttendance}
                className="px-5 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-carbon-950 text-xs font-bold shadow-lg"
              >
                Save Attendance Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT STAFF */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="industrial-card border-cyan-500/40 w-full max-w-lg space-y-4">
            <h2 className="text-sm font-bold text-cyan-400 border-b border-carbon-700/60 pb-2 flex items-center space-x-2">
              <UserPlus className="w-4 h-4" />
              <span>{editingEmpId ? 'Edit Staff Profile' : 'Add New Staff / Worker'}</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  className="w-full industrial-input"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Phone Number *</label>
                <input
                  type="text"
                  placeholder="e.g. +91 98111 22334"
                  value={empPhone}
                  onChange={(e) => setEmpPhone(e.target.value)}
                  className="w-full industrial-input"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Designation *</label>
                <input
                  type="text"
                  placeholder="e.g. Factory Operator / Machine Specialist"
                  value={empDesig}
                  onChange={(e) => setEmpDesig(e.target.value)}
                  className="w-full industrial-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Wage Structure</label>
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
                  <label className="block text-slate-300 mb-1 font-semibold">Base Rate (₹)</label>
                  <input
                    type="number"
                    value={empBaseRate}
                    onChange={(e) => setEmpBaseRate(Number(e.target.value))}
                    className="w-full industrial-input font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-carbon-800">
              <button
                onClick={() => setShowStaffModal(false)}
                className="px-4 py-2 rounded bg-carbon-800 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStaff}
                className="px-5 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-carbon-950 text-xs font-bold shadow-lg"
              >
                {editingEmpId ? 'Save Changes' : 'Create Staff Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ISSUE SALARY ADVANCE */}
      {showAdvanceModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="industrial-card border-amber-500/40 w-full max-w-lg space-y-4">
            <h2 className="text-sm font-bold text-amber-400 border-b border-carbon-700/60 pb-2 flex items-center space-x-2">
              <DollarSign className="w-4 h-4" />
              <span>Issue Salary Advance Deposit</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Select Staff Member *</label>
                <select
                  value={advEmpId}
                  onChange={(e) => setAdvEmpId(e.target.value)}
                  className="w-full industrial-input font-bold text-cyan-400"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.designation}) — Curr. Adv: ₹{(emp.advanceBalance || 0).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Advance Amount (₹) *</label>
                <input
                  type="number"
                  value={advAmount}
                  onChange={(e) => setAdvAmount(Number(e.target.value))}
                  className="w-full industrial-input font-mono font-bold text-amber-400 text-base"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Pay Out From Account</label>
                <select
                  value={advAccountId}
                  onChange={(e) => setAdvAccountId(e.target.value)}
                  className="w-full industrial-input"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountName} (Balance: ₹{(acc.balance || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Notes / Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Festival advance / Medical emergency"
                  value={advNotes}
                  onChange={(e) => setAdvNotes(e.target.value)}
                  className="w-full industrial-input"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-carbon-800">
              <button
                onClick={() => setShowAdvanceModal(false)}
                className="px-4 py-2 rounded bg-carbon-800 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleDepositAdvance}
                className="px-5 py-2 rounded bg-amber-500 hover:bg-amber-400 text-carbon-950 text-xs font-bold shadow-lg"
              >
                Issue Advance & Disburse Cash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PAYROLL SETTLEMENT */}
      {showPayrollModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="industrial-card border-emerald-500/40 w-full max-w-lg space-y-4">
            <h2 className="text-sm font-bold text-emerald-400 border-b border-carbon-700/60 pb-2 flex items-center space-x-2">
              <CreditCard className="w-4 h-4" />
              <span>Settle Monthly Salary & Deduct Advances</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Select Staff Member *</label>
                <select
                  value={payEmpId}
                  onChange={(e) => handlePayEmpChange(e.target.value)}
                  className="w-full industrial-input font-bold text-cyan-400"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.designation}) — Adv Balance: ₹{(emp.advanceBalance || 0).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Period Month (1-12)</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={payMonth}
                    onChange={(e) => handlePayMonthChange(Number(e.target.value))}
                    className="w-full industrial-input font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Period Year</label>
                  <input
                    type="number"
                    value={payYear}
                    onChange={(e) => handlePayYearChange(Number(e.target.value))}
                    className="w-full industrial-input font-mono"
                  />
                </div>
              </div>

              {/* Attendance-Based Salary Auto-Calculation Breakdown */}
              {payEmpId && (() => {
                const b = calculateSalaryBreakdown(payEmpId, payMonth, payYear);
                return (
                  <div className="p-3 rounded-lg bg-carbon-900 border border-cyan-500/30 space-y-1.5 text-[11px]">
                    <div className="flex justify-between items-center text-cyan-400 font-bold border-b border-carbon-800 pb-1">
                      <span>⚡ Attendance-Based Wage Calculation ({payMonth}/{payYear})</span>
                      <span>{b.daysInMonth} Days in Month</span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-300">
                      <div className="flex justify-between">
                        <span>Base Rate:</span>
                        <span className="font-mono font-semibold">₹{b.baseRate.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Daily Rate:</span>
                        <span className="font-mono font-semibold">₹{Math.round(b.dailyRate)}/day</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Absents Logged:</span>
                        <span className="font-mono font-semibold text-rose-400">{b.totalAbsentEquivalent} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Allowed Free Holidays:</span>
                        <span className="font-mono font-semibold text-emerald-400">2 days</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Deductible Absents:</span>
                        <span className="font-mono text-amber-400">{b.excessAbsents} days</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Salary Deduction:</span>
                        <span className="font-mono text-rose-400">-₹{b.deductionAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    {b.totalAbsentEquivalent <= 2 && (
                      <div className="text-[10px] text-emerald-400/90 font-medium italic pt-1">
                        ✓ Within 2 allowed free holidays limit. Full base salary applies!
                      </div>
                    )}
                    {b.totalAbsentEquivalent > 2 && (
                      <div className="text-[10px] text-amber-400/90 font-medium italic pt-1">
                        ⚠️ {b.totalAbsentEquivalent} absents logged. First 2 free; {b.excessAbsents} day(s) deducted.
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Gross Salary (₹)</label>
                  <input
                    type="number"
                    value={payGross}
                    onChange={(e) => setPayGross(Number(e.target.value))}
                    className="w-full industrial-input font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Advance Deducted (₹)</label>
                  <input
                    type="number"
                    value={payAdvanceDeducted}
                    onChange={(e) => setPayAdvanceDeducted(Number(e.target.value))}
                    className="w-full industrial-input font-mono font-bold text-amber-400"
                  />
                </div>
              </div>

              <div className="p-3 rounded bg-carbon-900 border border-carbon-800 flex justify-between items-center">
                <span className="text-slate-400 font-bold">NET PAYABLE AMOUNT:</span>
                <span className="text-base font-bold text-emerald-400 font-mono">
                  ₹{Math.max(0, payGross - payAdvanceDeducted).toLocaleString('en-IN')}
                </span>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Payment Account</label>
                <select
                  value={payAccountId}
                  onChange={(e) => setPayAccountId(e.target.value)}
                  className="w-full industrial-input"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountName} (Balance: ₹{(acc.balance || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-carbon-800">
              <button
                onClick={() => setShowPayrollModal(false)}
                className="px-4 py-2 rounded bg-carbon-800 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessPayroll}
                className="px-5 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-carbon-950 text-xs font-bold shadow-lg"
              >
                Confirm Payroll Settlement
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
