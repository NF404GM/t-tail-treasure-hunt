import React, { useRef } from 'react';
import { Download, Trash2 } from 'lucide-react';
import type { GameState, SpeechTarget } from '../../types';
import { MINIMAL_PAIRS, SPEECH_TARGET_LABELS, DEFAULT_CALIBRATION, getActivePairs } from '../../types';
import { cn } from '../../lib/utils';
import { Card } from '../Card';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const Dashboard = ({
  state,
  setState,
}: {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const exportPDF = async () => {
    if (!printRef.current) return;
    try {
      const canvas = await html2canvas(printRef.current);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(imgData, 'PNG', 10, 10, 190, 0);
      pdf.save('T-Tail-Cards.pdf');
    } catch (err) {
      console.error('PDF export failed:', err);
    }
  };

  const activePairs = getActivePairs(state.settings.activeCategories);

  const updateCalibration = (key: keyof typeof state.settings.audioCalibration, value: number) => {
    setState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        audioCalibration: { ...prev.settings.audioCalibration, [key]: value },
      },
    }));
  };

  const toggleCategory = (cat: SpeechTarget) => {
    setState(prev => {
      const current = prev.settings.activeCategories;
      const next = current.includes(cat)
        ? current.filter(c => c !== cat)
        : [...current, cat];
      return {
        ...prev,
        settings: { ...prev.settings, activeCategories: next },
      };
    });
  };

  const resetCalibration = () => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, audioCalibration: { ...DEFAULT_CALIBRATION } },
    }));
  };

  const clearSessions = () => {
    setState(prev => ({ ...prev, sessions: [] }));
  };

  // Session stats
  const totalSessions = state.sessions.length;
  const totalSuccesses = state.sessions.reduce((sum, s) => sum + s.successes, 0);
  const totalTimeMs = state.sessions.reduce((sum, s) => sum + s.durationMs, 0);
  const recentSessions = state.sessions.slice(-10).reverse();

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-slate-800">Therapist Dashboard</h2>
        <button
          onClick={exportPDF}
          className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-white hover:bg-slate-700"
        >
          <Download size={18} aria-hidden="true" /> PRINT CARDS
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Settings */}
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><span aria-hidden="true">&#x2699;&#xFE0F;</span> Settings</h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-medium text-slate-600">Show Word Labels</span>
              <input
                type="checkbox"
                checked={state.settings.showLabels}
                onChange={(e) => setState(prev => ({ ...prev, settings: { ...prev.settings, showLabels: e.target.checked } }))}
                className="h-6 w-6 rounded border-slate-300 text-slate-800 focus:ring-slate-800"
              />
            </label>
          </div>
        </div>

        {/* Progress */}
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><span aria-hidden="true">&#x1F4C8;</span> Progress</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {activePairs.map(pair => (
              <div key={pair.id} className="flex items-center justify-between">
                <span className="text-slate-600 text-sm">{pair.errorWord} → {pair.targetWord}</span>
                <div className="flex gap-1" aria-label={`${state.progress[pair.id] || 0} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <span key={star} className={cn("text-lg", star <= (state.progress[pair.id] || 0) ? "grayscale-0" : "grayscale opacity-20")} aria-hidden="true">&#x2B50;</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Speech Target Categories */}
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><span aria-hidden="true">&#x1F3AF;</span> Active Categories</h3>
          <p className="text-sm text-slate-500 mb-3">Select which speech targets to practice. All are active when none are selected.</p>
          <div className="space-y-3">
            {(Object.entries(SPEECH_TARGET_LABELS) as [SpeechTarget, string][]).map(([key, label]) => {
              const count = MINIMAL_PAIRS.filter(p => p.category === key).length;
              const isActive = state.settings.activeCategories.includes(key);
              return (
                <label key={key} className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-medium text-slate-700">{label}</span>
                    <span className="text-sm text-slate-400 ml-2">({count} pairs)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => toggleCategory(key)}
                    className="h-5 w-5 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                  />
                </label>
              );
            })}
          </div>
        </div>

        {/* Audio Calibration */}
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><span aria-hidden="true">&#x1F3A4;</span> Audio Calibration</h3>
          <p className="text-sm text-slate-500 mb-4">Adjust microphone sensitivity for each control type.</p>
          <div className="space-y-5">
            <CalibrationSlider
              label="Jump Sensitivity"
              hint="How easy it is to trigger a jump with 'T!'"
              value={state.settings.audioCalibration.jumpSensitivity}
              onChange={(v) => updateCalibration('jumpSensitivity', v)}
            />
            <CalibrationSlider
              label="Shield Sensitivity"
              hint="How easy it is to activate the shield by humming"
              value={state.settings.audioCalibration.shieldSensitivity}
              onChange={(v) => updateCalibration('shieldSensitivity', v)}
            />
            <CalibrationSlider
              label="Boost Sensitivity"
              hint="How easy it is to trigger boost by yelling"
              value={state.settings.audioCalibration.boostSensitivity}
              onChange={(v) => updateCalibration('boostSensitivity', v)}
            />
          </div>
          <button
            onClick={resetCalibration}
            className="mt-4 text-sm text-slate-400 hover:text-slate-600 underline"
          >
            Reset to defaults
          </button>
        </div>
      </div>

      {/* Session History */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2"><span aria-hidden="true">&#x1F4CB;</span> Session History</h3>
          {totalSessions > 0 && (
            <button
              onClick={clearSessions}
              className="flex items-center gap-1 text-sm text-red-400 hover:text-red-600"
            >
              <Trash2 size={14} /> Clear
            </button>
          )}
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-slate-50 rounded-xl">
            <div className="text-2xl font-black text-slate-800">{totalSessions}</div>
            <div className="text-xs text-slate-500 uppercase font-bold">Sessions</div>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-xl">
            <div className="text-2xl font-black text-green-600">{totalSuccesses}</div>
            <div className="text-xs text-slate-500 uppercase font-bold">Successes</div>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-xl">
            <div className="text-2xl font-black text-blue-600">{Math.round(totalTimeMs / 60000)}m</div>
            <div className="text-xs text-slate-500 uppercase font-bold">Total Time</div>
          </div>
        </div>

        {recentSessions.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">No sessions recorded yet. Play a game to start tracking!</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentSessions.map(session => (
              <div key={session.id} className="flex items-center justify-between text-sm p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="font-bold text-slate-700 capitalize">{session.gameMode}</span>
                  <span className="text-slate-400 ml-2">{new Date(session.timestamp).toLocaleDateString()} {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-600 font-bold">{session.successes} hits</span>
                  <span className="text-slate-400">{Math.round(session.durationMs / 1000)}s</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden Print Area */}
      <div className="hidden">
        <div ref={printRef} className="p-8 bg-white grid grid-cols-2 gap-8 w-[210mm]">
          {activePairs.flatMap(pair => [
            <div key={`${pair.id}-error`}><Card pair={pair} type="error" className="h-64 border-black" /></div>,
            <div key={`${pair.id}-target`}><Card pair={pair} type="target" className="h-64 border-black" /></div>,
          ])}
        </div>
      </div>
    </div>
  );
};

const CalibrationSlider = ({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
}) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <span className="text-sm font-bold text-orange-500">{value}/10</span>
    </div>
    <input
      type="range"
      min={1}
      max={10}
      step={1}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
      aria-label={label}
    />
    <p className="text-xs text-slate-400 mt-1">{hint}</p>
  </div>
);
