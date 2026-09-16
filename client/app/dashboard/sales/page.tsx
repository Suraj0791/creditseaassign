'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useRoleGuard } from '@/lib/useRoleGuard';

interface Lead {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

export default function SalesPage() {
  const { authorized } = useRoleGuard(['admin', 'sales']);
  const { token } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchLeads = () => {
    if (!token || !authorized) return;
    setLoading(true);
    api.get<{ leads: Lead[] }>('/ops/sales', token)
      .then((data) => setLeads(data.leads))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeads();
  }, [token, authorized]);

  const filteredLeads = useMemo(() => leads.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase())
  ), [leads, search]);

  if (!authorized || loading) {
    return (
      <div className="flex items-center gap-2.5 text-sm text-slate-500 font-medium py-16 justify-center">
        <svg className="animate-spin w-4 h-4 text-teal-700" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Loading pipeline leads...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-5" style={{ borderColor: 'var(--border-color)' }}>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
            Sales & Leads Pipeline
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Registered borrowers who signed up but have not submitted a formal loan application yet. Follow up to drive conversions.
          </p>
        </div>

        <button
          onClick={fetchLeads}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors shadow-2xs"
        >
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Refresh Queue
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4.5 rounded-xl border bg-white shadow-2xs" style={{ borderColor: 'var(--border-color)' }}>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Unconverted Leads
          </span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-bold tabular-nums text-slate-900">{leads.length}</span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
              Pending Application
            </span>
          </div>
        </div>

        <div className="p-4.5 rounded-xl border bg-white shadow-2xs" style={{ borderColor: 'var(--border-color)' }}>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Pipeline Stage
          </span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-sm font-bold text-slate-800">Pre-Underwriting</span>
            <span className="text-[10px] font-medium text-slate-400">Step 1 of 4</span>
          </div>
        </div>

        <div className="p-4.5 rounded-xl border bg-white shadow-2xs" style={{ borderColor: 'var(--border-color)' }}>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Department Access
          </span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
              Sales & Admin Only
            </span>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="px-4 py-3 rounded-xl text-xs font-medium border bg-rose-50 border-rose-200 text-rose-700">
          {error}
        </div>
      )}

      {/* Search Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads by name or email address..."
            className="w-full pl-9 pr-3 py-2.5 rounded-lg text-xs font-medium border bg-white transition-all focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
            style={{ borderColor: 'var(--border-color)' }}
          />
        </div>
        <span className="text-xs font-semibold text-slate-500 tabular-nums self-end sm:self-auto">
          Showing {filteredLeads.length} of {leads.length}
        </span>
      </div>

      {/* Leads Table */}
      {leads.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border bg-white shadow-xs" style={{ borderColor: 'var(--border-color)' }}>
          <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <p className="text-sm font-bold text-slate-800">No Pending Leads</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            All registered borrowers have either started an application or there are no new sign-ups in this stage.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white overflow-x-auto shadow-2xs" style={{ borderColor: 'var(--border-color)' }}>
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b bg-slate-50 text-slate-500 uppercase tracking-wider font-bold" style={{ borderColor: 'var(--border-color)' }}>
                <th className="px-5 py-4">Borrower Identity</th>
                <th className="px-5 py-4">Email Address</th>
                <th className="px-5 py-4">Registered On</th>
                <th className="px-5 py-4 text-right">Lead Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.map((lead) => (
                <tr key={lead._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-slate-100 text-slate-700 shrink-0 border border-slate-200">
                        {lead.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-900">{lead.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-600 font-medium">
                    {lead.email}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 font-medium tabular-nums">
                    {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Pending Action
                    </span>
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-xs text-slate-500 font-medium">
                    No leads match your search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
