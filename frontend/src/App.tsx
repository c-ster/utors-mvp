import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { SlateGeneratorPage } from '@/features/SlateGenerator';
import { RosterPage } from '@/features/roster/RosterPage';
import { IntakePage } from '@/features/intake/IntakePage';
import { WargamePage } from '@/features/wargame/WargamePage';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Sparkles, Users, ClipboardList, Swords,
  ChevronDown, Shield, LogIn,
} from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
});

const NAV_ITEMS: { path: string; label: string; icon: React.ElementType }[] = [
  { path: '/', label: "Commander's Dashboard", icon: LayoutDashboard },
  { path: '/slate', label: 'Slate Generator', icon: Sparkles },
  { path: '/roster', label: 'Unit Roster', icon: Users },
  { path: '/intake', label: 'Intake Form', icon: ClipboardList },
  { path: '/wargame', label: 'Wargame', icon: Swords },
];

const PERSONAS = [
  { key: 'BN_CMDR_USER', label: 'BN Commander (O-6)', icon: '★' },
  { key: 'CO_CMDR_USER', label: 'CO Commander (O-3)', icon: '◆' },
  { key: 'S1_USER', label: 'S-1 Staff (O-3)', icon: '●' },
  { key: 'SOLDIER_USER', label: 'Soldier (E-4)', icon: '▪' },
];

const DEFAULT_UIC = 'W1SF00';

function Sidebar() {
  const location = useLocation();
  const [persona, setPersona] = useState(localStorage.getItem('utors_persona') || 'BN_CMDR_USER');
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  const handlePersonaChange = (key: string) => {
    setPersona(key);
    localStorage.setItem('utors_persona', key);
    setShowPersonaMenu(false);
    queryClient.invalidateQueries();
  };

  const currentPersona = PERSONAS.find(p => p.key === persona) || PERSONAS[0];

  return (
    <aside className="w-56 bg-slate-900/80 border-r border-slate-700/50 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="p-4 border-b border-slate-700/50">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-emerald-500" />
          <div>
            <h1 className="text-sm font-bold text-slate-100 tracking-tight">UTORS</h1>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest">MVP v0.1.0</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all',
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 font-medium'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200',
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Persona Selector (Dev Mode) */}
      <div className="p-2 border-t border-slate-700/50">
        <div className="relative">
          <button
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:bg-slate-800/50 transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="flex-1 text-left truncate">{currentPersona.label}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {showPersonaMenu && (
            <div className="absolute bottom-full left-0 w-full mb-1 rounded-lg border border-slate-700 bg-slate-900 shadow-xl z-50">
              <div className="px-3 py-1.5 border-b border-slate-700/50">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Dev Mode: Select Persona</span>
              </div>
              {PERSONAS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => handlePersonaChange(p.key)}
                  className={cn(
                    'w-full px-3 py-2 text-xs text-left hover:bg-slate-800 transition-colors flex items-center gap-2',
                    persona === p.key ? 'text-emerald-400' : 'text-slate-300',
                  )}
                >
                  <span>{p.icon}</span>
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="mt-1 px-3">
          <span className="text-[9px] text-amber-500/60 uppercase tracking-wider">
            DEV MODE &bull; ENV=development
          </span>
        </div>
      </div>
    </aside>
  );
}

function AppLayout() {
  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<DashboardPage uic={DEFAULT_UIC} />} />
          <Route path="/slate" element={<SlateGeneratorPage />} />
          <Route path="/roster" element={<RosterPage uic={DEFAULT_UIC} />} />
          <Route path="/intake" element={<IntakePage />} />
          <Route path="/wargame" element={<WargamePage uic={DEFAULT_UIC} />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
