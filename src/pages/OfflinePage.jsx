import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function OfflinePage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const onOnline = () => {
      setOnline(true);
      setStatusMessage('✅ Соединение с интернетом восстановлено!');
    };
    const onOffline = () => {
      setOnline(false);
      setStatusMessage('');
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const handleRetryConnection = async () => {
    setChecking(true);
    setStatusMessage('');
    try {
      const res = await fetch(`/manifest.json?ping=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        setOnline(true);
        setStatusMessage('✅ Интернет подключен! Перенаправляем...');
        setTimeout(() => {
          if (window.history.length > 2) {
            navigate(-1);
          } else {
            navigate('/tasks');
          }
        }, 700);
      } else {
        throw new Error('Offline');
      }
    } catch {
      setOnline(false);
      setStatusMessage('⚠️ Сеть по-прежнему недоступна. Вы можете открыть кэшированные задачи.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto glass-card p-5 sm:p-8 rounded-2xl text-center space-y-5 my-6 sm:my-12 border border-slate-800">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-3xl">
        📡
      </div>

      <div className="space-y-2">
        <span
          className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold ${
            online
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          }`}
        >
          {online ? 'Статус: Подключено к сети' : 'Статус: Нет подключения к интернету'}
        </span>

        <h1 className="text-xl sm:text-2xl font-extrabold text-white">
          Вы находитесь в офлайн-режиме
        </h1>

        <p className="text-xs text-slate-400 leading-relaxed">
          Запрошенная страница недоступна без подключения к интернету. Ранее загруженный список задач и открытые карточки сохранены в локальном кэше PWA.
        </p>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200">
          {statusMessage}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
        <button
          onClick={handleRetryConnection}
          disabled={checking}
          className="w-full sm:flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50"
        >
          {checking ? 'Проверка сети...' : '🔄 Повторить подключение'}
        </button>

        <Link
          to="/tasks"
          className="w-full sm:flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 flex items-center justify-center"
        >
          📂 Открыть кэш задач
        </Link>
      </div>
    </div>
  );
}
