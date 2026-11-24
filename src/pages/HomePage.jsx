import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function HomePage() {
  const { currentUser } = useAuth();
  const outletContext = useOutletContext() || {};
  const { canInstall, triggerInstall, isInstalled } = outletContext;

  return (
    <div className="max-w-4xl mx-auto glass-card p-5 sm:p-8 rounded-2xl text-center space-y-5 my-4 sm:my-8">
      <div className="inline-block px-3.5 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-[11px] sm:text-xs">
        🚀 DevTask Hub • Redux Toolkit & Installable PWA
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
        Система управления разработкой и задачами
      </h1>

      <p className="text-slate-400 text-xs leading-relaxed max-w-2xl mx-auto">
        Архитектура построена на Redux Toolkit (3 feature-слайса, асинхронные createAsyncThunk, мемоизированные селекторы createSelector) с поддержкой Firebase Auth и автономного PWA-режима.
      </p>

      {currentUser && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl max-w-md mx-auto text-xs text-emerald-300 break-words">
          ✅ Вы авторизованы как <strong>{currentUser.email}</strong>.
        </div>
      )}

      <div className="my-4 rounded-xl overflow-hidden border border-slate-800 bg-slate-900/60 p-2.5 sm:p-4 max-w-xl mx-auto">
        <img
          src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80"
          alt="Developer Code Editor"
          className="w-full h-40 sm:h-48 object-cover rounded-lg opacity-90 hover:opacity-100 transition-opacity"
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
        <Link
          to="/tasks"
          className="w-full sm:w-auto px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
        >
          Перейти к задачам →
        </Link>
        <Link
          to="/dashboard"
          className="w-full sm:w-auto px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700"
        >
          Дашборд {currentUser ? '' : '🔒'}
        </Link>
        {canInstall && (
          <button
            onClick={triggerInstall}
            className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg"
          >
            📲 Установить приложение
          </button>
        )}
        {isInstalled && (
          <span className="px-4 py-3 text-xs text-emerald-400 font-semibold">
            ✓ Установлено как PWA
          </span>
        )}
      </div>
    </div>
  );
}
