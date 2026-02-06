import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ClipboardList, Send, CheckCircle, Plus, X } from 'lucide-react';
import type { IntakeFormData } from '@/types';

function TagInput({ label, tags, onChange }: { label: string; tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const val = input.trim();
    if (val && !tags.includes(val)) {
      onChange([...tags, val]);
      setInput('');
    }
  };

  return (
    <div>
      <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-1 mb-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs border border-emerald-500/30"
          >
            {tag}
            <button onClick={() => onChange(tags.filter(t => t !== tag))} className="hover:text-red-400">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          placeholder={`Add ${label.toLowerCase()}...`}
          className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 placeholder:text-slate-600 focus:border-emerald-500/50 focus:outline-none"
        />
        <button onClick={addTag} className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function IntakePage() {
  const [edipi, setEdipi] = useState('');
  const [formData, setFormData] = useState<IntakeFormData>({
    civilian_certifications: [],
    hobbies_skills: [],
    desired_role: '',
    family_considerations: '',
    career_preferences: '',
  });

  const submitMutation = useMutation({
    mutationFn: () => api.submitIntake(edipi, formData),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!edipi.trim()) return;
    submitMutation.mutate();
  };

  if (submitMutation.isSuccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-200 mb-2">Intake Form Submitted</h2>
            <p className="text-sm text-slate-400">
              Your talent profile has been recorded. Your leadership team will use this
              information to optimize your assignment.
            </p>
            <button
              onClick={() => {
                submitMutation.reset();
                setEdipi('');
                setFormData({ civilian_certifications: [], hobbies_skills: [], desired_role: '', family_considerations: '', career_preferences: '' });
              }}
              className="mt-6 px-4 py-2 bg-slate-800 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Submit Another
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-emerald-500" />
            Hidden Talent Intake Form
          </CardTitle>
          <p className="text-xs text-slate-400 mt-1">
            Help your leadership understand your full capabilities. This information is used to optimize
            talent placement and improve your assignment experience.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* EDIPI */}
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">DoD ID (EDIPI)</label>
              <input
                type="text"
                value={edipi}
                onChange={(e) => setEdipi(e.target.value)}
                placeholder="Enter your 10-digit EDIPI"
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm font-mono text-slate-200 placeholder:text-slate-600 focus:border-emerald-500/50 focus:outline-none"
              />
            </div>

            {/* Civilian Certifications */}
            <TagInput
              label="Civilian Certifications & Tech Skills"
              tags={formData.civilian_certifications || []}
              onChange={(t) => setFormData({ ...formData, civilian_certifications: t })}
            />

            {/* Hobbies */}
            <TagInput
              label="Hobbies & Skills"
              tags={formData.hobbies_skills || []}
              onChange={(t) => setFormData({ ...formData, hobbies_skills: t })}
            />

            {/* Desired Role */}
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Desired Role / Position</label>
              <input
                type="text"
                value={formData.desired_role}
                onChange={(e) => setFormData({ ...formData, desired_role: e.target.value })}
                placeholder="e.g., Team Leader, Instructor, Operations"
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 placeholder:text-slate-600 focus:border-emerald-500/50 focus:outline-none"
              />
            </div>

            {/* Family Considerations */}
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Family Considerations</label>
              <select
                value={formData.family_considerations}
                onChange={(e) => setFormData({ ...formData, family_considerations: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 focus:border-emerald-500/50 focus:outline-none"
              >
                <option value="">Select...</option>
                <option value="None">None</option>
                <option value="EFMP enrolled">EFMP enrolled</option>
                <option value="Spouse active duty">Spouse active duty</option>
                <option value="Dual-military couple">Dual-military couple</option>
                <option value="Single parent">Single parent</option>
                <option value="Spouse employment priority">Spouse employment priority</option>
                <option value="Child special needs">Child special needs</option>
              </select>
            </div>

            {/* Career Preferences */}
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Career Preferences</label>
              <textarea
                value={formData.career_preferences}
                onChange={(e) => setFormData({ ...formData, career_preferences: e.target.value })}
                placeholder="Describe your ideal assignment type, goals, etc."
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 placeholder:text-slate-600 focus:border-emerald-500/50 focus:outline-none resize-none"
              />
            </div>

            {submitMutation.error && (
              <div className="text-sm text-red-400 bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                {(submitMutation.error as Error).message}
              </div>
            )}

            <button
              type="submit"
              disabled={submitMutation.isPending || !edipi.trim()}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all',
                'bg-emerald-500 hover:bg-emerald-600 text-white',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {submitMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Submit Intake Form
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
