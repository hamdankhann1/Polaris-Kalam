import React, { useState, useEffect, useMemo } from 'react';
import {
  Lock,
  Unlock,
  Key,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  ArrowRight,
  Eye,
  EyeOff,
  Building,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  Download,
  Database,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { RevenueService, computeSha256 } from '../../services/revenueService';
import { getTodayYMD, addDaysYMD, formatYMD, diffDaysYMD } from '../../utils/dateUtils';

// Target Cryptographic Hashes for verification
const PORTAL_PASS_HASH = '8f08510feb936a3ff75c2c16255459150bed23671610c4d0757d83337c980a39';
const DELETE_PASS_HASH = 'ad4f5e421139b0458296d03ff8925292a4566862d6000789b8aaf1d437968a6d';

function formatPKR(num) {
  if (num === null || num === undefined || isNaN(num)) return 'PKR 0';
  return 'PKR ' + Number(num).toLocaleString('en-PK');
}

export default function RevenueMasterLook({ onReturnHome }) {
  // Session Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => RevenueService.isAuthenticated());
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Date Range Filter
  const [activePreset, setActivePreset] = useState('month'); // 'today', 'yesterday', 'week', 'month', '30days', 'all', 'custom'
  const [startDate, setStartDate] = useState(() => getTodayYMD().substring(0, 8) + '01');
  const [endDate, setEndDate] = useState(() => getTodayYMD());

  // Revenue Data State
  const [revenueData, setRevenueData] = useState({
    summary: {
      dayRevenue: 0,
      dayBookingsCount: 0,
      weeklyRevenue: 0,
      weeklyBookingsCount: 0,
      monthlyRevenue: 0,
      monthlyBookingsCount: 0,
      totalRevenueInRange: 0,
      totalBookingsInRange: 0,
      averageBookingValue: 0
    },
    dailyTimeline: [],
    categoryBreakdown: {},
    paymentMethodBreakdown: {},
    records: [],
    dbConnected: true,
    source: 'mongodb'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'range' | 'single', id?: string, record?: object }
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // New Record Form State
  const [newRecord, setNewRecord] = useState({
    date: getTodayYMD(),
    guestName: '',
    phone: '',
    bookingRef: '',
    roomName: '',
    category: 'Executive Suite',
    floor: 'Floor 1',
    checkIn: getTodayYMD(),
    checkOut: addDaysYMD(getTodayYMD(), 1),
    nights: 1,
    nightlyRate: 45000,
    amount: 45000,
    paymentMethod: 'Bank Transfer',
    status: 'paid',
    notes: ''
  });

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // -------------------------------------------------------------------------
  // Fetch Revenue Data
  // -------------------------------------------------------------------------
  const fetchRevenue = async (force = false) => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const data = await RevenueService.getRevenueData({
        startDate: activePreset === 'all' ? '' : startDate,
        endDate: activePreset === 'all' ? '' : endDate,
        force
      });
      setRevenueData(data);
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') {
        setIsAuthenticated(false);
        setLoginError('Your master session has expired. Please enter password again.');
      } else {
        showToast(err.message || 'Error fetching revenue ledger', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchRevenue(true);
    }
  }, [isAuthenticated, startDate, endDate, activePreset]);

  // -------------------------------------------------------------------------
  // Preset Range Handlers
  // -------------------------------------------------------------------------
  const handleSelectPreset = (preset) => {
    setActivePreset(preset);
    const todayStr = getTodayYMD();

    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'yesterday') {
      const yStr = addDaysYMD(todayStr, -1);
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === 'week') {
      const wStr = addDaysYMD(todayStr, -6);
      setStartDate(wStr);
      setEndDate(todayStr);
    } else if (preset === 'month') {
      setStartDate(todayStr.substring(0, 8) + '01');
      setEndDate(todayStr);
    } else if (preset === '30days') {
      const d30Str = addDaysYMD(todayStr, -29);
      setStartDate(d30Str);
      setEndDate(todayStr);
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  // -------------------------------------------------------------------------
  // Login Handler (Portal Password: Polar1s@Asif@Master@PortalPass26/12)
  // -------------------------------------------------------------------------
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginPassword.trim() || isLoggingIn) return;
    setIsLoggingIn(true);
    setLoginError('');

    try {
      await RevenueService.login(loginPassword);
      setIsAuthenticated(true);
      setLoginPassword('');
      showToast('Master Revenue Portal Unlocked', 'success');
    } catch (err) {
      setLoginError(err.message || 'Invalid Master Portal Access Password.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    RevenueService.logout();
    setIsAuthenticated(false);
    setLoginPassword('');
    showToast('Master Revenue Portal Locked', 'info');
  };

  // -------------------------------------------------------------------------
  // Add Record Handler
  // -------------------------------------------------------------------------
  const handleNightlyCalc = (nights, rate) => {
    const n = Math.max(1, Number(nights) || 1);
    const r = Math.max(0, Number(rate) || 0);
    return n * r;
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const amount = Number(newRecord.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid positive revenue amount in PKR.');
      }

      await RevenueService.addRecord({
        ...newRecord,
        amount,
        nights: Number(newRecord.nights) || 1,
        nightlyRate: Number(newRecord.nightlyRate) || amount
      });

      setIsAddModalOpen(false);
      showToast('Booking revenue recorded to MongoDB Atlas', 'success');
      // Reset form
      setNewRecord({
        date: getTodayYMD(),
        guestName: '',
        phone: '',
        bookingRef: '',
        roomName: '',
        category: 'Executive Suite',
        floor: 'Floor 1',
        checkIn: getTodayYMD(),
        checkOut: addDaysYMD(getTodayYMD(), 1),
        nights: 1,
        nightlyRate: 45000,
        amount: 45000,
        paymentMethod: 'Bank Transfer',
        status: 'paid',
        notes: ''
      });
      fetchRevenue(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // -------------------------------------------------------------------------
  // 1-Click Sync from Confirmed Bookings
  // -------------------------------------------------------------------------
  const handleSyncBookings = async () => {
    setIsSyncing(true);
    try {
      const res = await RevenueService.syncFromBookings();
      showToast(res.message || 'Synced confirmed bookings successfully', 'success');
      fetchRevenue(true);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // -------------------------------------------------------------------------
  // Delete / Reset Handler (Password: Polar1s@Asif@Master@26/12)
  // -------------------------------------------------------------------------
  const handleOpenResetModal = () => {
    setDeleteTarget({
      type: 'range',
      startDate: startDate || 'Beginning',
      endDate: endDate || 'Today'
    });
    setDeletePassword('');
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const handleOpenDeleteSingleModal = (record) => {
    setDeleteTarget({
      type: 'single',
      record
    });
    setDeletePassword('');
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (e) => {
    e.preventDefault();
    if (!deletePassword.trim() || isDeleting) return;
    setIsDeleting(true);
    setDeleteError('');

    try {
      if (deleteTarget.type === 'range') {
        const start = startDate || '2000-01-01';
        const end = endDate || '2099-12-31';
        const res = await RevenueService.resetRangeRevenue(start, end, deletePassword);
        showToast(`Reset ${res.deletedCount} revenue records in MongoDB`, 'success');
      } else if (deleteTarget.type === 'single') {
        await RevenueService.deleteRecord(deleteTarget.record.id, deletePassword);
        showToast('Revenue record permanently deleted from MongoDB', 'success');
      }

      setIsDeleteModalOpen(false);
      setDeletePassword('');
      fetchRevenue(true);
    } catch (err) {
      setDeleteError(err.message || 'Invalid Master Deletion Password.');
    } finally {
      setIsDeleting(false);
    }
  };

  // -------------------------------------------------------------------------
  // Filtered Ledger Records
  // -------------------------------------------------------------------------
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return revenueData.records || [];
    const q = searchQuery.toLowerCase().trim();
    return (revenueData.records || []).filter((r) => {
      return (
        (r.guestName && r.guestName.toLowerCase().includes(q)) ||
        (r.bookingRef && r.bookingRef.toLowerCase().includes(q)) ||
        (r.roomName && r.roomName.toLowerCase().includes(q)) ||
        (r.category && r.category.toLowerCase().includes(q)) ||
        (r.paymentMethod && r.paymentMethod.toLowerCase().includes(q)) ||
        (r.date && r.date.includes(q))
      );
    });
  }, [revenueData.records, searchQuery]);

  // -------------------------------------------------------------------------
  // Export CSV
  // -------------------------------------------------------------------------
  const handleExportCSV = () => {
    const records = filteredRecords;
    if (records.length === 0) {
      showToast('No records to export', 'error');
      return;
    }

    const headers = [
      'Date',
      'Booking Ref',
      'Guest Name',
      'Phone',
      'Room/Suite',
      'Category',
      'Floor',
      'Check-In',
      'Check-Out',
      'Nights',
      'Nightly Rate (PKR)',
      'Total Amount (PKR)',
      'Payment Method',
      'Status',
      'Notes'
    ];

    const rows = records.map((r) => [
      r.date || '',
      r.bookingRef || '',
      `"${(r.guestName || '').replace(/"/g, '""')}"`,
      r.phone || '',
      `"${(r.roomName || '').replace(/"/g, '""')}"`,
      `"${(r.category || '').replace(/"/g, '""')}"`,
      r.floor || '',
      r.checkIn || '',
      r.checkOut || '',
      r.nights || 1,
      r.nightlyRate || 0,
      r.amount || 0,
      r.paymentMethod || '',
      r.status || 'paid',
      `"${(r.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Polaris_Revenue_${startDate || 'All'}_to_${endDate || 'Today'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Revenue ledger exported to CSV', 'success');
  };

  // =========================================================================
  // VIEW: LOGIN GATE (When not authenticated)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0D12] text-stone-100 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-4 shadow-xl">
              <Key className="w-7 h-7" />
            </div>
            <p className="text-[11px] tracking-[0.3em] uppercase text-amber-400 font-semibold mb-1">
              POLARIS KALAM HOTEL & SANCTUARY
            </p>
            <h1 className="text-2xl font-light tracking-wide text-white font-serif">
              Master Revenue Intelligence
            </h1>
            <p className="text-xs text-stone-400 mt-2">
              Confidential Fiscal Vault • Encrypted Ledger Gate
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-[#12161F]/90 backdrop-blur-xl border border-stone-800 rounded-2xl p-8 shadow-2xl">
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-300 font-medium mb-2">
                  Master Portal Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      if (loginError) setLoginError('');
                    }}
                    placeholder="Enter Master Portal Password"
                    autoFocus
                    className="w-full bg-[#1A202C]/90 border border-stone-700/80 rounded-xl pl-10 pr-11 py-3 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-200 transition"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-xs text-red-300">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn || !loginPassword.trim()}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-medium text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Cryptographic Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Unlock Master Revenue Look</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-stone-800/80 text-center">
              <button
                type="button"
                onClick={onReturnHome}
                className="text-xs text-stone-400 hover:text-amber-400 transition underline underline-offset-4"
              >
                ← Return to Sanctuary Website
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-[11px] text-stone-500">
            Protected by SHA-256 Cryptographic Authentication & Serverless Cloud Ledger
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: MASTER REVENUE DASHBOARD (Authenticated)
  // =========================================================================
  const { summary } = revenueData;

  return (
    <div className="min-h-screen bg-[#0A0D12] text-stone-100 flex flex-col font-sans selection:bg-amber-400 selection:text-stone-950">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 animate-fade-in">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-2.5 text-xs font-medium ${
              toastMessage.type === 'error'
                ? 'bg-red-950/90 border-red-500/50 text-red-200'
                : toastMessage.type === 'info'
                ? 'bg-stone-900/90 border-stone-700 text-stone-200'
                : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-red-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span>{toastMessage.message}</span>
          </div>
        </div>
      )}

      {/* Top Architectural Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#0E121A]/95 backdrop-blur-md border-b border-stone-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold tracking-wide text-white uppercase">
                  POLARIS REVENUE MASTER LOOK
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  MongoDB Atlas
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                Live Booking Revenue Vault • Kalam Valley, Swat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleSyncBookings}
              disabled={isSyncing}
              title="Import all accepted guest bookings into the revenue ledger"
              className="px-3.5 py-2 rounded-xl bg-stone-800/90 hover:bg-stone-700/90 text-stone-200 text-xs font-medium border border-stone-700 flex items-center gap-2 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Reservations'}</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-medium shadow-md shadow-amber-500/10 flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Record Booking Amount</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-stone-300 text-xs font-medium border border-stone-700 flex items-center gap-1.5 transition"
              title="Export revenue records to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/50 text-red-300 text-xs font-medium border border-red-800/40 flex items-center gap-1.5 transition"
              title="Lock master portal"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 space-y-6">
        {/* =================================================================== */}
        {/* SECTION 1: MASTER KPI CARDS (Day, Week, Month, Selected Range)       */}
        {/* =================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. DAY REVENUE */}
          <div className="bg-[#12161F] border border-stone-800/90 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition">
            <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
              <span className="uppercase tracking-wider font-medium text-stone-300">Day Revenue</span>
              <span className="px-2 py-0.5 rounded-md bg-stone-800/80 text-[10px] text-stone-300 font-mono">Today</span>
            </div>
            <div className="text-2xl font-serif text-white tracking-wide font-light">
              {formatPKR(summary.dayRevenue)}
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs text-stone-400">
              <span>{summary.dayBookingsCount} bookings today</span>
              <span className="text-[11px] text-amber-400 font-mono">{getTodayYMD()}</span>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none group-hover:bg-amber-500/10 transition" />
          </div>

          {/* 2. WEEKLY REVENUE */}
          <div className="bg-[#12161F] border border-stone-800/90 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition">
            <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
              <span className="uppercase tracking-wider font-medium text-stone-300">Weekly Revenue</span>
              <span className="px-2 py-0.5 rounded-md bg-stone-800/80 text-[10px] text-stone-300 font-mono">Last 7 Days</span>
            </div>
            <div className="text-2xl font-serif text-white tracking-wide font-light">
              {formatPKR(summary.weeklyRevenue)}
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs text-stone-400">
              <span>{summary.weeklyBookingsCount} bookings</span>
              <span className="text-[11px] text-emerald-400 font-mono">Past 7d Total</span>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:bg-emerald-500/10 transition" />
          </div>

          {/* 3. MONTHLY REVENUE */}
          <div className="bg-[#12161F] border border-stone-800/90 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition">
            <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
              <span className="uppercase tracking-wider font-medium text-stone-300">Monthly Revenue</span>
              <span className="px-2 py-0.5 rounded-md bg-stone-800/80 text-[10px] text-stone-300 font-mono">Current Month</span>
            </div>
            <div className="text-2xl font-serif text-white tracking-wide font-light">
              {formatPKR(summary.monthlyRevenue)}
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs text-stone-400">
              <span>{summary.monthlyBookingsCount} bookings</span>
              <span className="text-[11px] text-blue-400 font-mono">30-Day Window</span>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none group-hover:bg-blue-500/10 transition" />
          </div>

          {/* 4. TOTAL RANGE REVENUE */}
          <div className="bg-gradient-to-br from-[#12161F] to-[#1A202C] border border-amber-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
            <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
              <span className="uppercase tracking-wider font-medium text-amber-300">Selected Range Total</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-[10px] text-amber-300 font-mono">Aggregated</span>
            </div>
            <div className="text-2xl font-serif text-amber-400 tracking-wide font-light">
              {formatPKR(summary.totalRevenueInRange)}
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs text-stone-300">
              <span>{summary.totalBookingsInRange} Bookings</span>
              <span>Avg: {formatPKR(summary.averageBookingValue)}</span>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-full pointer-events-none" />
          </div>
        </div>

        {/* =================================================================== */}
        {/* SECTION 2: DATE RANGE CONTROLS & RESET BUTTON                       */}
        {/* =================================================================== */}
        <div className="bg-[#12161F] border border-stone-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-stone-400 font-medium mr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                Range:
              </span>
              {[
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: 'week', label: 'Last 7 Days' },
                { id: 'month', label: 'This Month' },
                { id: '30days', label: 'Last 30 Days' },
                { id: 'all', label: 'All Time' }
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                    activePreset === p.id
                      ? 'bg-amber-500 text-stone-950 shadow-md font-semibold'
                      : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700/80 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Reset for Specified Dates Button */}
            <button
              onClick={handleOpenResetModal}
              title="Delete and reset revenue records for the specified date range (Password Protected)"
              className="px-3.5 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-700/50 text-red-300 text-xs font-medium flex items-center gap-1.5 transition ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Reset Revenue for Specified Dates</span>
            </button>
          </div>

          {/* Custom Date Pickers */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-stone-800/80 text-xs">
            <span className="text-stone-400">Custom Dates:</span>
            <div className="flex items-center gap-2">
              <span className="text-stone-500">From</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActivePreset('custom');
                }}
                className="bg-[#1A202C] border border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-200 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-stone-500">To</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActivePreset('custom');
                }}
                className="bg-[#1A202C] border border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-200 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              onClick={() => fetchRevenue(true)}
              className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium transition flex items-center gap-1 ml-auto"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Ledger</span>
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* SECTION 3: VISUAL REVENUE ANALYTICS & TIMELINE                      */}
        {/* =================================================================== */}
        {revenueData.dailyTimeline && revenueData.dailyTimeline.length > 0 && (
          <div className="bg-[#12161F] border border-stone-800 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-wider text-stone-300 font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                Daily Revenue Trajectory (Selected Range)
              </h3>
              <span className="text-[11px] text-stone-500 font-mono">
                {revenueData.dailyTimeline.length} active dates
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-10 gap-2 pt-2">
              {revenueData.dailyTimeline.map((item) => (
                <div
                  key={item.date}
                  className="bg-[#1A202C]/60 border border-stone-800/80 rounded-xl p-2.5 text-center hover:border-amber-500/40 transition group"
                >
                  <p className="text-[10px] text-stone-400 font-mono">{item.date.slice(5)}</p>
                  <p className="text-xs font-semibold text-amber-400 mt-1 font-mono">
                    {formatPKR(item.total).replace('PKR ', '')}
                  </p>
                  <p className="text-[10px] text-stone-500 mt-0.5">{item.count} bkg</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SECTION 4: BOOKING AMOUNTS LEDGER TABLE                             */}
        {/* =================================================================== */}
        <div className="bg-[#12161F] border border-stone-800 rounded-2xl shadow-lg overflow-hidden">
          {/* Table Header Controls */}
          <div className="p-5 border-b border-stone-800/90 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400" />
                Booking Amounts & Revenue Ledger
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                {filteredRecords.length} records totaling {formatPKR(summary.totalRevenueInRange)}
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="text"
                placeholder="Search guest, ref, room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1A202C] border border-stone-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0E121A] text-stone-400 uppercase tracking-wider text-[10px] border-b border-stone-800 font-medium">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4">Guest Details</th>
                  <th className="py-3 px-4">Room & Category</th>
                  <th className="py-3 px-4">Stay & Nights</th>
                  <th className="py-3 px-4 text-right">Amount (PKR)</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-sans">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-stone-500 text-xs">
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                          <span>Loading revenue records from MongoDB Atlas...</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p>No revenue records found in this date range.</p>
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleSelectPreset('all')}
                              className="text-amber-400 hover:underline"
                            >
                              View All Time
                            </button>
                            <span>•</span>
                            <button
                              onClick={handleSyncBookings}
                              className="text-amber-400 hover:underline"
                            >
                              Sync Confirmed Bookings
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-stone-800/40 transition group"
                    >
                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono text-stone-300 whitespace-nowrap">
                        {record.date || record.checkIn || formatYMD(record.createdAt)}
                      </td>

                      {/* Booking Ref */}
                      <td className="py-3.5 px-4 font-mono text-amber-400 font-medium whitespace-nowrap">
                        {record.bookingRef || '—'}
                      </td>

                      {/* Guest */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-white">{record.guestName || 'VIP Guest'}</div>
                        {record.phone && <div className="text-[10px] text-stone-500 font-mono">{record.phone}</div>}
                      </td>

                      {/* Room & Category */}
                      <td className="py-3.5 px-4">
                        <div className="text-stone-200">
                          {record.roomNumber ? `#${record.roomNumber} • ` : ''}
                          {record.roomName || 'Polaris Suite'}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          {record.category || 'Executive Suite'}
                          {record.floor ? ` (${record.floor})` : ''}
                        </div>
                      </td>

                      {/* Stay & Nights */}
                      <td className="py-3.5 px-4 text-stone-300 whitespace-nowrap">
                        <div>
                          {record.nights || 1} Night{record.nights > 1 ? 's' : ''}
                        </div>
                        <div className="text-[10px] text-stone-500 font-mono">
                          {record.checkIn} → {record.checkOut}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right font-serif text-sm font-semibold text-emerald-400 whitespace-nowrap">
                        {formatPKR(record.amount)}
                      </td>

                      {/* Payment */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-stone-800 text-stone-300 border border-stone-700/80">
                          {record.paymentMethod || 'Bank Wire'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleOpenDeleteSingleModal(record)}
                          title="Delete this revenue record (requires Master Deletion Password)"
                          className="p-1.5 rounded-lg text-stone-400 hover:text-red-400 hover:bg-red-500/10 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* =================================================================== */}
      {/* MODAL 1: ADD BOOKING REVENUE RECORD                                 */}
      {/* =================================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12161F] border border-stone-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <Plus className="w-5 h-5" />
                <h3 className="text-base font-semibold text-white">Record Booking Amount</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newRecord.date}
                    onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                    className="w-full bg-[#1A202C] border border-stone-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1">Booking Ref (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. PK-9081"
                    value={newRecord.bookingRef}
                    onChange={(e) => setNewRecord({ ...newRecord, bookingRef: e.target.value })}
                    className="w-full bg-[#1A202C] border border-stone-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1">Guest Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Guest full name"
                    value={newRecord.guestName}
                    onChange={(e) => setNewRecord({ ...newRecord, guestName: e.target.value })}
                    className="w-full bg-[#1A202C] border border-stone-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+92 300 0000000"
                    value={newRecord.phone}
                    onChange={(e) => setNewRecord({ ...newRecord, phone: e.target.value })}
                    className="w-full bg-[#1A202C] border border-stone-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1">Suite / Room Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Celestial Penthouse"
                    value={newRecord.roomName}
                    onChange={(e) => setNewRecord({ ...newRecord, roomName: e.target.value })}
                    className="w-full bg-[#1A202C] border border-stone-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1">Room Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Executive Suite"
                    value={newRecord.category}
                    onChange={(e) => setNewRecord({ ...newRecord, category: e.target.value })}
                    className="w-full bg-[#1A202C] border border-stone-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1">Nights</label>
                  <input
                    type="number"
                    min="1"
                    value={newRecord.nights}
                    onChange={(e) => {
                      const nights = Number(e.target.value);
                      const amount = handleNightlyCalc(nights, newRecord.nightlyRate);
                      setNewRecord({ ...newRecord, nights, amount });
                    }}
                    className="w-full bg-[#1A202C] border border-stone-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1">Nightly Rate (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    value={newRecord.nightlyRate}
                    onChange={(e) => {
                      const nightlyRate = Number(e.target.value);
                      const amount = handleNightlyCalc(newRecord.nights, nightlyRate);
                      setNewRecord({ ...newRecord, nightlyRate, amount });
                    }}
                    className="w-full bg-[#1A202C] border border-stone-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-amber-400 font-semibold mb-1">Total Amount (PKR)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newRecord.amount}
                    onChange={(e) => setNewRecord({ ...newRecord, amount: Number(e.target.value) })}
                    className="w-full bg-[#1A202C] border border-amber-500/80 rounded-xl px-3 py-2 text-amber-400 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-400 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1">Payment Method</label>
                  <select
                    value={newRecord.paymentMethod}
                    onChange={(e) => setNewRecord({ ...newRecord, paymentMethod: e.target.value })}
                    className="w-full bg-[#1A202C] border border-stone-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Bank Transfer">Bank Wire Transfer</option>
                    <option value="Cash at Desk">Cash (Front Desk)</option>
                    <option value="Credit Card">Credit / Debit Card</option>
                    <option value="Online Reservation">Online Reservation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-400 mb-1">Notes / Remarks</label>
                  <input
                    type="text"
                    placeholder="Optional details"
                    value={newRecord.notes}
                    onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                    className="w-full bg-[#1A202C] border border-stone-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 hover:bg-stone-700 text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-medium text-xs shadow-lg transition"
                >
                  Save Record to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: PASSWORD-PROTECTED DELETION / RESET MODAL                   */}
      {/* (Requires Deletion Password: Polar1s@Asif@Master@26/12)             */}
      {/* =================================================================== */}
      {isDeleteModalOpen && deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141824] border border-red-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">
                  {deleteTarget.type === 'range'
                    ? 'Confirm Revenue Reset'
                    : 'Delete Revenue Record'}
                </h3>
                <p className="text-xs text-stone-400">
                  Strict Master Password Authorization Required
                </p>
              </div>
            </div>

            <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-3 text-xs text-red-300 space-y-1">
              {deleteTarget.type === 'range' ? (
                <>
                  <p className="font-semibold text-red-200">
                    You are about to reset/delete all revenue records between:
                  </p>
                  <p className="font-mono text-white text-xs">
                    {deleteTarget.startDate} → {deleteTarget.endDate}
                  </p>
                  <p className="text-[11px] text-stone-400 mt-1">
                    This permanently deletes the amounts and records from MongoDB Atlas.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-red-200">
                    Delete Record: {deleteTarget.record?.bookingRef || deleteTarget.record?.id}
                  </p>
                  <p className="text-xs text-stone-300">
                    Guest: {deleteTarget.record?.guestName} • {formatPKR(deleteTarget.record?.amount)}
                  </p>
                </>
              )}
            </div>

            <form onSubmit={handleConfirmDelete} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-300 font-medium mb-1.5">
                  Master Deletion Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type={showDeletePassword ? 'text' : 'password'}
                    required
                    value={deletePassword}
                    onChange={(e) => {
                      setDeletePassword(e.target.value);
                      if (deleteError) setDeleteError('');
                    }}
                    placeholder="Enter Master Deletion Password"
                    autoFocus
                    className="w-full bg-[#1C2333] border border-stone-700 rounded-xl pl-9 pr-10 py-2.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePassword(!showDeletePassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-200"
                  >
                    {showDeletePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {deleteError && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-xs text-red-300">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 hover:bg-stone-700 text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeleting || !deletePassword.trim()}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-xs shadow-lg transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Authorize & Delete</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-stone-800/60 text-center text-xs text-stone-500">
        POLARIS KALAM HOTEL & SANCTUARY • MASTER FISCAL LEDGER • ENCRYPTED CLOUD PERSISTENCE
      </footer>
    </div>
  );
}
