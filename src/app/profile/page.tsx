'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';


interface UserProfile {
  id: string;
  name: string;
  phone: string;
  default_vpa: string;
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [name, setName] = useState('');
  const [vpa, setVpa] = useState('');

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setProfile(data);
          setName(data.name);
          setVpa(data.default_vpa);
        } else {
          router.push('/login');
        }
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), default_vpa: vpa.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to update');
      }
      const updated = await res.json();
      setProfile(updated);
      setSuccess('Profile updated');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-border" />
          <div className="mx-auto h-4 w-32 rounded bg-border" />
          <div className="h-24 rounded-xl bg-surface-secondary" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-subtle text-xl font-bold text-primary">
          {profile?.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <h1 className="mt-3 text-xl font-bold text-text-heading">{profile?.name}</h1>
        <p className="text-sm text-text-muted">{profile?.phone}</p>
      </div>

      <div className="space-y-5 rounded-xl border border-border bg-surface p-6">
        {/* Name */}
        <div>
          <label className="mb-1 block text-sm font-medium text-text-body">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* UPI VPA */}
        <div>
          <label className="mb-1 block text-sm font-medium text-text-body">Default UPI VPA</label>
          <input
            type="text"
            value={vpa}
            onChange={(e) => setVpa(e.target.value)}
            placeholder="example@paytm"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <p className="mt-1 text-xs text-text-muted">Your UPI ID for receiving payments. e.g., name@paytm</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-danger">{error}</div>
        )}

        {success && (
          <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-success">{success}</div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Danger zone */}
      <div className="mt-6">
        <button
          onClick={handleLogout}
          className="w-full rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-red-50"
        >
          Logout
        </button>
      </div>

      <p className="mt-8 text-center text-xs text-text-muted">Splitup v0.1.0</p>
    </div>
  );
}
