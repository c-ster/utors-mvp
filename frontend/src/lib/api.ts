const API_BASE = '/api/v1';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const persona = localStorage.getItem('utors_persona') || 'BN_CMDR_USER';
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Mock-User': persona,
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `API error: ${res.status}`);
  }
  return res.json();
}

// Auth
export const api = {
  getPersonas: () => fetchJson<{ personas: Array<{ key: string; name: string; rank: string; role: string }> }>('/auth/personas'),

  // Units
  getUnit: (uic: string) => fetchJson<import('@/types').Unit>(`/unit/${uic}`),
  getUnitRoster: (uic: string) => fetchJson<import('@/types').UnitRoster>(`/unit/${uic}/roster`),
  getUnitGaps: (uic: string) => fetchJson<import('@/types').UnitGaps>(`/unit/${uic}/gaps`),

  // Soldiers
  getSoldier: (edipi: string) => fetchJson<import('@/types').Soldier>(`/soldier/${edipi}`),
  updateSoldier: (edipi: string, data: Record<string, unknown>) =>
    fetchJson<import('@/types').Soldier>(`/soldier/${edipi}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  submitIntake: (edipi: string, data: import('@/types').IntakeFormData) =>
    fetchJson<import('@/types').Soldier>(`/soldier/${edipi}/intake`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Slating
  generateSlate: (uic: string, includeIncoming = true) =>
    fetchJson<import('@/types').SlateResponse>('/slate/generate', {
      method: 'POST',
      body: JSON.stringify({ uic, include_incoming: includeIncoming }),
    }),
  commitSlate: (uic: string, assignments: Array<{ soldier_edipi: string; billet_id: string }>) =>
    fetchJson<{ committed: number }>('/slate/commit', {
      method: 'POST',
      body: JSON.stringify({ uic, assignments }),
    }),

  // Dashboard
  getDashboardMetrics: (uic: string) =>
    fetchJson<import('@/types').DashboardMetrics>(`/dashboard/metrics?uic=${uic}`),
};
