import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import NavBar from '../components/NavBar.jsx';
import { usePWA } from '../hooks/usePWA.js';
import { selectToast } from '../store/selectors/taskSelectors.js';
import { clearToast } from '../store/slices/workspaceSlice.js';

export default function RootLayout() {
  const dispatch = useDispatch();
  const toast = useSelector(selectToast);
  const { isOnline, updateAvailable, applyUpdate, canInstall, triggerInstall } = usePWA();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => dispatch(clearToast()), 3000);
    return () => clearTimeout(timer);
  }, [toast, dispatch]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white flex flex-col">
      <NavBar isOnline={isOnline} canInstall={canInstall} onInstall={triggerInstall} />

      {!isOnline && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-3 py-2 text-center text-[11px] text-amber-200">
          ⚠️ Вы работаете в автономном режиме (Offline). Доступны ранее открытые страницы и кэшированные задачи.
        </div>
      )}

      {updateAvailable && (
        <div className="bg-indigo-600 text-white px-4 py-2.5 flex flex-wrap items-center justify-center gap-3 text-xs shadow-lg">
          <span className="font-medium">🚀 Доступна новая версия приложения DevTask Hub!</span>
          <button
            onClick={applyUpdate}
            className="px-3 py-1 bg-white text-indigo-700 font-bold rounded-lg hover:bg-indigo-50 transition-colors"
          >
            Обновить сейчас
          </button>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5">
        <Outlet context={{ isOnline, canInstall, triggerInstall }} />
      </main>

      {toast && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 glass-card border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-xl text-xs font-bold shadow-2xl flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
            <span>{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => dispatch(clearToast())}
            className="text-slate-400 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
      )}

      <footer className="border-t border-slate-900 py-4 px-3 text-center text-[11px] text-slate-500">
        DevTask Hub © 2026 — Medeu Seidali. Redux Toolkit • Installable PWA.
      </footer>
    </div>
  );
}
