'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { getStoredCredentials, setStoredCredentials, clearStoredCredentials } from '@/lib/api/client';
import { getEventStatus } from '@/lib/api/event';
import { CheckCircle2, AlertCircle, RefreshCw, Key, Server, Shield } from 'lucide-react';

export default function SettingsPage() {
  const currentCreds = getStoredCredentials();
  const [username, setUsername] = useState(currentCreds.username || 'admin');
  const [password, setPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setStatusMessage({ type: 'error', text: 'Both username and password are required.' });
      return;
    }
    const token = btoa(`${username.trim()}:${password.trim()}`);
    setStoredCredentials(username.trim(), token);
    setStatusMessage({ type: 'success', text: 'Organizer credentials updated successfully.' });
    setPassword('');
  };

  const handleResetDefaults = () => {
    clearStoredCredentials();
    setUsername('admin');
    setPassword('');
    setStatusMessage({ type: 'success', text: 'Reset to default credentials from environment.' });
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setStatusMessage(null);
    try {
      const res = await getEventStatus();
      setStatusMessage({
        type: 'success',
        text: `Successfully connected to backend. Event Status: ${res.eventStatus}, Teams: ${res.teamCount}.`,
      });
    } catch (err: unknown) {
      const error = err as Error;
      setStatusMessage({
        type: 'error',
        text: `Connection test failed: ${error.message || 'Unable to connect to port 8085.'}`,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title="Settings & System Configuration"
        subtitle="Manage backend API connection and organizer credentials"
      />

      <div className="flex-1 p-6 space-y-6 max-w-4xl mx-auto w-full">
        {statusMessage && (
          <div
            className={`rounded-xl p-4 border text-xs flex items-center gap-3 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-red-50 text-red-900 border-red-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Backend Connection Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1B2560] text-white">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1F2937]">Backend Service Status</h3>
              <p className="text-xs text-slate-500">Configured endpoint connection details</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                API Base URL
              </span>
              <p className="mt-1 font-mono font-bold text-[#1B2560]">
                {process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8085'}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Routed through Next.js proxy to prevent CORS restrictions
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Authentication Scheme
              </span>
              <p className="mt-1 font-bold text-slate-800">
                HTTP Basic Authentication
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Default: admin / admin123
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Test connection with active backend server:
            </span>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1B2560] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#2E45A2] disabled:opacity-50 transition-colors shadow-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${testing ? 'animate-spin' : ''}`} />
              Test Connection
            </button>
          </div>
        </div>

        {/* Organizer Credentials Configuration */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2E45A2] text-white">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1F2937]">Organizer Credentials</h3>
              <p className="text-xs text-slate-500">
                Manage Basic Auth credentials passed to the backend API
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveCredentials} className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="auth-username"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
              >
                Admin Username
              </label>
              <input
                id="auth-username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#1B2560] focus:ring-1 focus:ring-[#1B2560]"
              />
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
              >
                Admin Password
              </label>
              <input
                id="auth-password"
                type="password"
                placeholder="Enter new password to update..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#1B2560] focus:ring-1 focus:ring-[#1B2560]"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Reset to Default (admin:admin123)
              </button>

              <button
                type="submit"
                disabled={!password.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1B2560] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2E45A2] disabled:opacity-50 transition-colors shadow-xs"
              >
                <Shield className="h-3.5 w-3.5" />
                Update Credentials
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
