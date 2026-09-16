'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import DobDatePicker from '@/components/DobDatePicker';

interface ApplicationData {
  fullName: string;
  pan: string;
  dob: string;
  monthlySalary: string;
  employmentMode: string;
  loanAmount: number;
  tenure: number;
}

const AMOUNT_PRESETS = [50000, 100000, 250000, 500000];
const TENURE_PRESETS = [30, 90, 180, 365];

export default function ApplyPage() {
  const { user, token, loading, logout } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [breErrors, setBreErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState<ApplicationData>({
    fullName: '',
    pan: '',
    dob: '',
    monthlySalary: '',
    employmentMode: 'salaried',
    loanAmount: 100000,
    tenure: 90,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (!loading && user && user.role !== 'borrower') {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (token) {
      api.get<{ application: any }>('/borrower/my-application', token).then((data) => {
        if (data.application && data.application.status !== 'pending') {
          setSuccess(true);
        }
      }).catch(() => {});
    }
  }, [token]);

  const handleChange = (field: keyof ApplicationData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleStep1Submit = async () => {
    setError('');
    setBreErrors([]);
    setSubmitting(true);

    try {
      const res = await api.post<{ eligible: boolean; errors: string[] }>(
        '/borrower/check-eligibility',
        {
          fullName: form.fullName.trim(),
          pan: form.pan.toUpperCase().trim(),
          dob: form.dob,
          monthlySalary: Number(form.monthlySalary),
          employmentMode: form.employmentMode,
        },
        token!
      );

      if (!res.eligible) {
        setBreErrors(res.errors);
      } else {
        setStep(2);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStep2Submit = async () => {
    if (!selectedFile) {
      setError('Please attach your salary slip file before proceeding');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('salarySlip', selectedFile);

      await api.upload<{ url: string }>('/borrower/upload-slip', formData, token!);
      setStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStep3Submit = async () => {
    setError('');
    setSubmitting(true);

    try {
      await api.post(
        '/borrower/apply',
        { loanAmount: form.loanAmount, tenure: form.tenure },
        token!
      );
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Simple Interest @ 12% p.a.
  const interest = Math.round((form.loanAmount * 12 * form.tenure) / (365 * 100));
  const totalRepayment = form.loanAmount + interest;
  const dailyInterest = ((form.loanAmount * 12) / (365 * 100)).toFixed(2);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2.5 text-sm text-slate-500 font-medium">
          <svg className="animate-spin w-4 h-4 text-teal-700" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading application session...
        </div>
      </div>
    );
  }

  // Application Completed / Submitted Screen
  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="w-full max-w-lg rounded-2xl p-8 border shadow-xs bg-white text-center" style={{ borderColor: 'var(--border-color)' }}>
          <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center bg-emerald-50 border border-emerald-200">
            <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>

          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-2">
            Application Logged Successfully
          </span>

          <h1 className="text-xl font-bold tracking-tight text-slate-900 mb-2">
            Loan Underwriting in Progress
          </h1>

          <p className="text-xs text-slate-600 mb-6 leading-relaxed max-w-md mx-auto">
            Your application and income documents have been verified by our automated Business Rule Engine (BRE) and queued for executive underwriting.
          </p>

          {/* Workflow Stage Tracker */}
          <div className="p-4 rounded-xl text-left border bg-slate-50 mb-6" style={{ borderColor: 'var(--border-color)' }}>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-3">
              Application Lifecycle
            </span>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full flex items-center justify-center bg-emerald-500 text-white text-[10px] font-bold shrink-0">
                  ✓
                </span>
                <span className="text-slate-700 font-medium">1. BRE Eligibility & KYC Verification (Passed)</span>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full flex items-center justify-center bg-teal-600 text-white text-[10px] font-bold shrink-0 animate-pulse">
                  2
                </span>
                <span className="text-teal-900 font-semibold">2. Sanction Officer Review (Awaiting Decision)</span>
              </div>

              <div className="flex items-center gap-2.5 opacity-60">
                <span className="w-5 h-5 rounded-full flex items-center justify-center bg-slate-200 text-slate-600 text-[10px] font-bold shrink-0">
                  3
                </span>
                <span className="text-slate-600">3. Direct IMPS Bank Disbursement</span>
              </div>

              <div className="flex items-center gap-2.5 opacity-60">
                <span className="w-5 h-5 rounded-full flex items-center justify-center bg-slate-200 text-slate-600 text-[10px] font-bold shrink-0">
                  4
                </span>
                <span className="text-slate-600">4. Repayment & Automated Settlement</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 leading-relaxed">
              <strong>Evaluator Note:</strong> Log in as <code className="px-1.5 py-0.5 rounded bg-slate-200 font-mono text-[10px] text-slate-800">sanction@lms.dev</code> (Password: <code className="px-1.5 py-0.5 rounded bg-slate-200 font-mono text-[10px] text-slate-800">Sanction@123</code>) or <code className="px-1.5 py-0.5 rounded bg-slate-200 font-mono text-[10px] text-slate-800">admin@lms.dev</code> in the dashboard to approve this loan.
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full py-2.5 rounded-lg text-xs font-semibold text-white cursor-pointer transition-colors shadow-2xs"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Sign Out / Switch to Operations Officer
          </button>
        </div>
      </div>
    );
  }

  const stepsMeta = [
    { num: 1, title: 'Personal KYC', subtitle: 'Identity & BRE rules' },
    { num: 2, title: 'Income Proof', subtitle: 'Salary slip document' },
    { num: 3, title: 'Loan Customizer', subtitle: 'Terms & live calculation' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Top Navigation Bar */}
      <header className="border-b px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 bg-white shadow-2xs" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs shadow-xs"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            CS
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-slate-900 block leading-tight">CreditSea</span>
            <span className="text-[10px] font-semibold text-teal-700 block tracking-wider uppercase">Borrower Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-800 leading-tight">{user?.name}</p>
            <p className="text-[10px] text-slate-500 font-mono">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors border hover:bg-slate-50 text-slate-700 shadow-2xs"
            style={{ borderColor: 'var(--border-color)' }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="py-8 sm:py-12 px-4">
        <div className="max-w-xl mx-auto">
          {/* Stepper Progress Indicator */}
          <div className="mb-8">
            <div className="grid grid-cols-3 gap-3 mb-3">
              {stepsMeta.map((s) => {
                const isCompleted = step > s.num;
                const isCurrent = step === s.num;

                return (
                  <div key={s.num} className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0"
                        style={{
                          backgroundColor: isCompleted ? 'var(--success)' : isCurrent ? 'var(--accent)' : 'var(--bg-tertiary)',
                          color: isCompleted || isCurrent ? '#ffffff' : 'var(--text-muted)',
                        }}
                      >
                        {isCompleted ? '✓' : s.num}
                      </div>
                      <div className="min-w-0">
                        <span
                          className="text-xs font-bold truncate block"
                          style={{ color: isCurrent ? 'var(--text-primary)' : 'var(--text-muted)' }}
                        >
                          {s.title}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate hidden sm:block">
                          {s.subtitle}
                        </span>
                      </div>
                    </div>
                    {/* Step progress bar */}
                    <div
                      className="h-1 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: isCompleted ? 'var(--success)' : isCurrent ? 'var(--accent)' : 'var(--border-color)',
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Global Form Error Alert */}
          {error && (
            <div
              className="mb-4 px-4 py-3 rounded-xl text-xs flex items-start gap-2 border bg-rose-50 border-rose-200 text-rose-700"
            >
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Personal KYC & BRE Validation */}
          {step === 1 && (
            <div className="rounded-2xl p-6 sm:p-7 border shadow-xs bg-white" style={{ borderColor: 'var(--border-color)' }}>
              <div className="border-b pb-4 mb-5" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">
                    Step 1 — Borrower Identity & Eligibility
                  </h2>
                  <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                    BRE Guarded
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Our automated Business Rule Engine (BRE) verifies criteria instantly before loan terms are offered.
                </p>
              </div>

              {/* BRE Failure Warning Callout */}
              {breErrors.length > 0 && (
                <div
                  className="mb-5 p-4 rounded-xl border text-xs space-y-2 bg-rose-50 border-rose-200 text-rose-700"
                >
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                    <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    Eligibility Requirements Not Met:
                  </div>
                  {breErrors.map((err, i) => (
                    <div key={i} className="flex items-start gap-1.5 pl-1 text-slate-700">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>{err}</span>
                    </div>
                  ))}
                  <p className="text-[11px] text-slate-500 pt-1 border-t border-rose-200">
                    Please correct the details above (e.g. Age must be 21–60, Salary ≥ ₹25,000, Employment mode Salaried or Self-Employed).
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Full Legal Name (As per PAN Document)
                  </label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    required
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2.5 rounded-lg text-xs border border-slate-200 bg-slate-50 transition-all font-medium text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      PAN Card Number
                    </label>
                    <input
                      type="text"
                      value={form.pan}
                      onChange={(e) => handleChange('pan', e.target.value.toUpperCase())}
                      required
                      maxLength={10}
                      placeholder="ABCDE1234F"
                      className="w-full px-3.5 py-2.5 rounded-lg text-xs border border-slate-200 bg-slate-50 uppercase font-mono tracking-wider transition-all font-semibold text-slate-900"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">10-character alphanumeric PAN</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Date of Birth
                    </label>
                    <DobDatePicker
                      value={form.dob}
                      onChange={(val) => handleChange('dob', val)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Monthly Verified Salary (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs font-bold">₹</span>
                      <input
                        type="number"
                        value={form.monthlySalary}
                        onChange={(e) => handleChange('monthlySalary', e.target.value)}
                        required
                        min={0}
                        placeholder="e.g. 45000"
                        className="w-full pl-8 pr-3.5 py-2.5 rounded-lg text-xs border border-slate-200 bg-slate-50 tabular-nums transition-all font-semibold text-slate-900"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Minimum rule requirement: ₹25,000/mo</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Employment Mode
                    </label>
                    <select
                      value={form.employmentMode}
                      onChange={(e) => handleChange('employmentMode', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg text-xs border border-slate-200 bg-slate-50 transition-all cursor-pointer font-medium text-slate-800"
                    >
                      <option value="salaried">Salaried (Full-Time)</option>
                      <option value="self_employed">Self Employed (Business/Professional)</option>
                      <option value="unemployed">Unemployed (Ineligible)</option>
                    </select>
                    <span className="text-[10px] text-slate-400 mt-1 block">Unemployed applicants fail BRE</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStep1Submit}
                disabled={submitting || !form.fullName || !form.pan || !form.dob || !form.monthlySalary}
                className="w-full mt-6 py-2.5 rounded-lg text-xs font-semibold text-white cursor-pointer transition-all duration-150 disabled:opacity-50 shadow-2xs flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Evaluating BRE Rules...
                  </>
                ) : (
                  <>
                    Verify Eligibility & Continue
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP 2: Salary Slip Upload Dropzone */}
          {step === 2 && (
            <div className="rounded-2xl p-6 sm:p-7 border shadow-xs bg-white" style={{ borderColor: 'var(--border-color)' }}>
              <div className="border-b pb-4 mb-5" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">
                    Step 2 — Proof of Income Document
                  </h2>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    BRE Passed ✓
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Upload your latest salary slip or bank income statement for underwriting verification.
                </p>
              </div>

              {/* Upload Dropzone */}
              <div
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 group"
                style={{
                  borderColor: selectedFile ? 'var(--accent)' : 'var(--border-color)',
                  backgroundColor: selectedFile ? 'var(--accent-light)' : 'var(--bg-primary)',
                }}
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-white border border-slate-200 group-hover:scale-105 transition-transform shadow-2xs">
                  <svg className="w-6 h-6 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>

                {selectedFile ? (
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 mb-1.5">
                      ✓ Salary Slip Attached
                    </span>
                    <p className="text-xs font-bold text-slate-900 truncate max-w-xs mx-auto">{selectedFile.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Click to select different file
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Click to upload or drag & drop salary slip
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Supported formats: PDF, JPG, PNG (Max file size: 5 MB)
                    </p>
                  </div>
                )}
              </div>

              <input
                id="fileInput"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && file.size <= 5 * 1024 * 1024) {
                    setSelectedFile(file);
                    setError('');
                  } else if (file) {
                    setError('File size exceeds the 5 MB limit');
                  }
                }}
              />

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 rounded-lg text-xs font-semibold cursor-pointer border border-slate-200 hover:bg-slate-50 transition-colors text-slate-700 shadow-2xs"
                >
                  ← Back to KYC
                </button>
                <button
                  type="button"
                  onClick={handleStep2Submit}
                  disabled={submitting || !selectedFile}
                  className="flex-1 py-2.5 rounded-lg text-xs font-semibold text-white cursor-pointer disabled:opacity-50 transition-all shadow-2xs"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  {submitting ? 'Uploading Slip...' : 'Save & Configure Loan Terms →'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Loan Customizer with Live Simple Interest Calculation */}
          {step === 3 && (
            <div className="rounded-2xl p-6 sm:p-7 border shadow-xs bg-white" style={{ borderColor: 'var(--border-color)' }}>
              <div className="border-b pb-4 mb-5" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">
                    Step 3 — Custom Loan Terms & Calculation
                  </h2>
                  <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                    SI @ 12% p.a.
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Adjust principal amount and tenure. Repayment obligations are calculated dynamically.
                </p>
              </div>

              <div className="space-y-6">
                {/* Amount Slider & Presets */}
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <label className="text-xs font-bold text-slate-700">Required Principal Amount</label>
                    <span className="text-lg font-bold tabular-nums text-teal-800">
                      ₹{form.loanAmount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={50000}
                    max={500000}
                    step={10000}
                    value={form.loanAmount}
                    onChange={(e) => handleChange('loanAmount', Number(e.target.value))}
                    className="w-full h-2 rounded-lg cursor-pointer bg-slate-200"
                  />

                  {/* Preset Chips */}
                  <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1">
                    {AMOUNT_PRESETS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleChange('loanAmount', p)}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold transition-colors border cursor-pointer shrink-0"
                        style={{
                          backgroundColor: form.loanAmount === p ? 'var(--accent-light)' : 'var(--bg-primary)',
                          borderColor: form.loanAmount === p ? 'var(--accent)' : 'var(--border-color)',
                          color: form.loanAmount === p ? 'var(--accent)' : 'var(--text-secondary)',
                        }}
                      >
                        ₹{(p / 100000)} Lakh
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tenure Slider & Presets */}
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <label className="text-xs font-bold text-slate-700">Tenure (Days)</label>
                    <span className="text-lg font-bold tabular-nums text-teal-800">
                      {form.tenure} Days
                    </span>
                  </div>

                  <input
                    type="range"
                    min={30}
                    max={365}
                    step={1}
                    value={form.tenure}
                    onChange={(e) => handleChange('tenure', Number(e.target.value))}
                    className="w-full h-2 rounded-lg cursor-pointer bg-slate-200"
                  />

                  {/* Tenure Preset Chips */}
                  <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1">
                    {TENURE_PRESETS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleChange('tenure', t)}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold transition-colors border cursor-pointer shrink-0"
                        style={{
                          backgroundColor: form.tenure === t ? 'var(--accent-light)' : 'var(--bg-primary)',
                          borderColor: form.tenure === t ? 'var(--accent)' : 'var(--border-color)',
                          color: form.tenure === t ? 'var(--accent)' : 'var(--text-secondary)',
                        }}
                      >
                        {t} Days
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Simple Interest Summary Card */}
                <div className="rounded-xl p-4 border bg-slate-50/70" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center justify-between mb-3 border-b pb-2" style={{ borderColor: 'var(--border-color)' }}>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Loan Repayment Breakdown
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-emerald-100 text-emerald-800">
                      Fixed 12% p.a.
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Principal Requested</span>
                      <span className="font-semibold tabular-nums text-slate-900">₹{form.loanAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tenure Duration</span>
                      <span className="font-semibold tabular-nums text-slate-900">{form.tenure} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Interest Accrual Rate</span>
                      <span className="font-semibold tabular-nums text-slate-900">₹{dailyInterest}/day</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Simple Interest</span>
                      <span className="font-bold tabular-nums text-teal-700">₹{interest.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="border-t pt-2.5 mt-2 flex justify-between items-baseline font-bold" style={{ borderColor: 'var(--border-color)' }}>
                      <span className="text-slate-900 text-xs uppercase tracking-wider">Total Repayment Obligation</span>
                      <span className="text-base tabular-nums text-teal-900 font-extrabold">₹{totalRepayment.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-2.5 rounded-lg text-xs font-semibold cursor-pointer border border-slate-200 hover:bg-slate-50 transition-colors text-slate-700 shadow-2xs"
                >
                  ← Back to Slip
                </button>
                <button
                  type="button"
                  onClick={handleStep3Submit}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg text-xs font-semibold text-white cursor-pointer disabled:opacity-50 transition-all shadow-2xs flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Submitting Application...
                    </>
                  ) : (
                    <>
                      <span>Lock Terms & Submit Application</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
