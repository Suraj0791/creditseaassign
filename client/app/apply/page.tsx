'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface ApplicationData {
  fullName: string;
  pan: string;
  dob: string;
  monthlySalary: string;
  employmentMode: string;
  loanAmount: number;
  tenure: number;
}

export default function ApplyPage() {
  const { user, token, loading } = useAuth();
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
          fullName: form.fullName,
          pan: form.pan,
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
      setError('Please select a salary slip file');
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

  const interest = (form.loanAmount * 12 * form.tenure) / (365 * 100);
  const totalRepayment = form.loanAmount + interest;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'var(--success-light)' }}>
            <span className="text-2xl">✓</span>
          </div>
          <h1 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Application Submitted
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Your loan application has been submitted and is under review. You will be notified once a decision is made.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Loan Application
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Step {step} of 3
          </p>

          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className="h-1.5 flex-1 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: s <= step ? 'var(--accent)' : 'var(--border-color)',
                }}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}>
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <h2 className="text-base font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
              Personal Details
            </h2>

            {breErrors.length > 0 && (
              <div className="mb-4 px-4 py-3 rounded-lg text-sm space-y-1" style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}>
                {breErrors.map((err, i) => (
                  <p key={i}>• {err}</p>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Full Name</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-lg text-sm"
                  style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>PAN Number</label>
                <input
                  type="text"
                  value={form.pan}
                  onChange={(e) => handleChange('pan', e.target.value.toUpperCase())}
                  required
                  maxLength={10}
                  placeholder="ABCDE1234F"
                  className="w-full px-3 py-2.5 rounded-lg text-sm uppercase"
                  style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Date of Birth</label>
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => handleChange('dob', e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-lg text-sm"
                  style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Monthly Salary (₹)</label>
                <input
                  type="number"
                  value={form.monthlySalary}
                  onChange={(e) => handleChange('monthlySalary', e.target.value)}
                  required
                  min={0}
                  className="w-full px-3 py-2.5 rounded-lg text-sm"
                  style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Employment</label>
                <select
                  value={form.employmentMode}
                  onChange={(e) => handleChange('employmentMode', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm"
                  style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                >
                  <option value="salaried">Salaried</option>
                  <option value="self_employed">Self Employed</option>
                  <option value="unemployed">Unemployed</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleStep1Submit}
              disabled={submitting}
              className="w-full mt-6 py-2.5 rounded-lg text-sm font-medium text-white cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {submitting ? 'Checking...' : 'Check Eligibility & Continue'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <h2 className="text-base font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
              Upload Salary Slip
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Upload your latest salary slip. Accepted formats: PDF, JPG, PNG (max 5 MB).
            </p>

            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors"
              style={{ borderColor: selectedFile ? 'var(--accent)' : 'var(--border-color)' }}
              onClick={() => document.getElementById('fileInput')?.click()}
            >
              {selectedFile ? (
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{selectedFile.name}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Click to select a file</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>PDF, JPG, PNG up to 5 MB</p>
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
                  setError('File must be under 5 MB');
                }
              }}
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium cursor-pointer"
                style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
              >
                Back
              </button>
              <button
                onClick={handleStep2Submit}
                disabled={submitting || !selectedFile}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {submitting ? 'Uploading...' : 'Upload & Continue'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <h2 className="text-base font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
              Loan Configuration
            </h2>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Loan Amount</label>
                  <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                    ₹{form.loanAmount.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min={50000}
                  max={500000}
                  step={10000}
                  value={form.loanAmount}
                  onChange={(e) => handleChange('loanAmount', Number(e.target.value))}
                  className="w-full accent-teal-600"
                />
                <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  <span>₹50,000</span>
                  <span>₹5,00,000</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Tenure</label>
                  <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                    {form.tenure} days
                  </span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={365}
                  step={1}
                  value={form.tenure}
                  onChange={(e) => handleChange('tenure', Number(e.target.value))}
                  className="w-full accent-teal-600"
                />
                <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  <span>30 days</span>
                  <span>365 days</span>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Loan Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Principal</span>
                    <span style={{ color: 'var(--text-primary)' }}>₹{form.loanAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Interest Rate</span>
                    <span style={{ color: 'var(--text-primary)' }}>12% p.a.</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Tenure</span>
                    <span style={{ color: 'var(--text-primary)' }}>{form.tenure} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Simple Interest</span>
                    <span style={{ color: 'var(--text-primary)' }}>₹{Math.round(interest).toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between font-semibold" style={{ borderColor: 'var(--border-color)' }}>
                    <span style={{ color: 'var(--text-primary)' }}>Total Repayment</span>
                    <span style={{ color: 'var(--accent)' }}>₹{Math.round(totalRepayment).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium cursor-pointer"
                style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
              >
                Back
              </button>
              <button
                onClick={handleStep3Submit}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
