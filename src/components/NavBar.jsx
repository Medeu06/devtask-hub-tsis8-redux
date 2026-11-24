import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAuth } from '../context/AuthContext.jsx';
import { selectPinnedTaskIds } from '../store/selectors/taskSelectors.js';

export default function NavBar({ isOnline, canInstall, onInstall }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const pinnedIds = useSelector(selectPinnedTaskIds);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setMobileMenuOpen(false);
      navigate('/login');
    } catch (err) {
      alert(`Ошибка при выходе: ${err.message}`);
    }
  };

  const closeMenu = () => setMobileMenuOpen(false);

  const linkStyle = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-xs font-semibold transition-all min-h-[38px] flex items-center gap-1.5 ${
      isActive
        ? 'bg-indigo-600 text-white shadow-md'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-30 glass-card border-b border-slate-800 px-3 sm:px-6 lg:px-8 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <NavLink to="/" onClick={closeMenu} className="flex items-center space-x-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-black text-lg shadow-lg text-white">
            D
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white leading-tight">DevTask Hub</h1>
            <p className="text-[10px] text-slate-400 hidden sm:block">Redux Toolkit • PWA</p>
          </div>
        </NavLink>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            to="/offline"
            title={isOnline ? 'Подключено к сети' : 'Нет интернета'}
            className={`px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 border transition-colors ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </Link>

          {canInstall && (
            <button
              onClick={onInstall}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-all"
            >
              + App
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Открыть меню"
            className="md:hidden w-10 h-10 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-200 text-base"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        <nav className="hidden md:flex items-center space-x-1.5">
          <NavLink to="/" end className={linkStyle}>Главная</NavLink>
          <NavLink to="/tasks" className={linkStyle}>
            <span>Задачи</span>
            {pinnedIds.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                📌{pinnedIds.length}
              </span>
            )}
          </NavLink>
          <NavLink to="/dashboard" className={linkStyle}>
            Дашборд {currentUser ? '' : '🔒'}
          </NavLink>
          <NavLink to="/about" className={linkStyle}>О проекте</NavLink>

          {currentUser ? (
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
              <NavLink to="/profile" className={linkStyle}>
                👤 {currentUser.email?.split('@')[0]}
              </NavLink>
              <button
                onClick={handleLogout}
                className="px-3 py-2 text-xs font-semibold bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/60 rounded-lg transition-colors"
              >
                Выйти
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-800">
              <NavLink to="/login" className={linkStyle}>Войти</NavLink>
              <NavLink
                to="/signup"
                className="px-3 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md"
              >
                Регистрация
              </NavLink>
            </div>
          )}
        </nav>
      </div>

      {mobileMenuOpen && (
        <nav className="md:hidden mt-3 pt-3 border-t border-slate-800 flex flex-col space-y-1.5">
          <NavLink to="/" end onClick={closeMenu} className={linkStyle}>Главная</NavLink>
          <NavLink to="/tasks" onClick={closeMenu} className={linkStyle}>
            Каталог задач {pinnedIds.length > 0 ? `(📌 ${pinnedIds.length})` : ''}
          </NavLink>
          <NavLink to="/dashboard" onClick={closeMenu} className={linkStyle}>
            Дашборд {currentUser ? '' : '🔒'}
          </NavLink>
          <NavLink to="/about" onClick={closeMenu} className={linkStyle}>О проекте</NavLink>
          <NavLink to="/offline" onClick={closeMenu} className={linkStyle}>Офлайн-статус</NavLink>

          <div className="pt-2 border-t border-slate-800/80 flex flex-col space-y-2">
            {currentUser ? (
              <>
                <NavLink to="/profile" onClick={closeMenu} className={linkStyle}>
                  👤 Профиль ({currentUser.email})
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 px-3 text-left text-xs font-semibold bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/60 rounded-lg"
                >
                  Выйти из аккаунта
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <NavLink
                  to="/login"
                  onClick={closeMenu}
                  className="py-2.5 text-center rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700"
                >
                  Войти
                </NavLink>
                <NavLink
                  to="/signup"
                  onClick={closeMenu}
                  className="py-2.5 text-center rounded-lg text-xs font-bold bg-indigo-600 text-white"
                >
                  Регистрация
                </NavLink>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
