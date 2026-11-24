import React from 'react';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto glass-card p-5 sm:p-6 rounded-xl space-y-5">
      <h1 className="text-lg sm:text-xl font-bold text-white border-b border-slate-800 pb-3">
        О проекте DevTask Hub (Redux Toolkit + PWA)
      </h1>

      <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
        <p>
          <strong>DevTask Hub</strong> — инженерный трекер задач, переведенный на глобальное управление состоянием через <strong>Redux Toolkit</strong> с сохранением всех функций предыдущих этапов.
        </p>
      </div>

      <div className="bg-slate-900/80 p-4 sm:p-5 rounded-xl border border-slate-800 text-xs space-y-2 text-slate-300">
        <h3 className="font-bold text-indigo-400 mb-2">Архитектура приложения:</h3>
        <div><strong>Студент:</strong> Медеу Сейдали</div>
        <div><strong>Redux Store:</strong> 3 слайса (`tasks`, `filters`, `workspace`), асинхронные thunks (`fetchTasks`, `fetchTaskById`, `createTask`, `updateTask`, `deleteTask`, `resetTasks`) и 3 мемоизированных селектора (`createSelector`)</div>
        <div><strong>PWA & Offline:</strong> Web App Manifest, Service Worker, Cache-First & Network-First стратегии, страница `/offline`</div>
        <div><strong>Авторизация:</strong> Firebase Auth (Email/Пароль + Google Sign-In) и защищенные маршруты</div>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
        <Link
          to="/tasks"
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold text-center"
        >
          Перейти к списку задач
        </Link>
        <Link
          to="/"
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs border border-slate-700 text-center"
        >
          На главную
        </Link>
      </div>
    </div>
  );
}
