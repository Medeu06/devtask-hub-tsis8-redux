import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { CATEGORIES, PRIORITIES, STATUSES } from '../services/initial-data-sample.js';
import { useDebounce } from '../hooks/useDebounce.js';
import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  resetTasks,
} from '../store/slices/tasksSlice.js';
import {
  setSearchQuery,
  setCategoryFilter,
  setStatusFilter,
  setSortBy,
  setPage,
  syncFiltersFromUrl,
  resetFilters,
} from '../store/slices/filtersSlice.js';
import {
  togglePinTask,
  setOnlyPinned,
  setViewMode,
  showToast,
} from '../store/slices/workspaceSlice.js';
import {
  selectTasksListStatus,
  selectTasksListError,
  selectTasksDataSource,
  selectActiveMutationId,
  selectFilters,
  selectPinnedTaskIds,
  selectOnlyPinned,
  selectViewMode,
  selectPaginatedTasks,
} from '../store/selectors/taskSelectors.js';
import TaskCard from '../components/TaskCard.jsx';

export default function TaskListPage() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  // Global state via Redux selectors
  const listStatus = useSelector(selectTasksListStatus);
  const listError = useSelector(selectTasksListError);
  const dataSource = useSelector(selectTasksDataSource);
  const activeMutationId = useSelector(selectActiveMutationId);
  const filters = useSelector(selectFilters);
  const pinnedTaskIds = useSelector(selectPinnedTaskIds);
  const onlyPinned = useSelector(selectOnlyPinned);
  const viewMode = useSelector(selectViewMode);
  const { paginatedItems, totalFilteredCount, totalPages, safePage } = useSelector(selectPaginatedTasks);

  // Local state for instant search input & modal visibility
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // 1. Fetch tasks via Redux Toolkit thunk
  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  // 2. Sync URL search params -> Redux filtersSlice
  useEffect(() => {
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || 'All';
    const status = searchParams.get('status') || 'All';
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1', 10);

    dispatch(syncFiltersFromUrl({ q, category, status, sort, page }));
    setSearchInput(q);
  }, [searchParams, dispatch]);

  // Helper to update URL search params
  const updateUrlParam = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value && value !== 'All' && value !== '1' && value !== 'newest') {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    if (key !== 'page') nextParams.delete('page');
    setSearchParams(nextParams);
  };

  // 3. Apply debounced search input -> Redux + URL
  useEffect(() => {
    const currentUrlQ = searchParams.get('q') || '';
    if (debouncedSearch !== currentUrlQ) {
      dispatch(setSearchQuery(debouncedSearch));
      updateUrlParam('q', debouncedSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const handleCategoryChange = (value) => {
    dispatch(setCategoryFilter(value));
    updateUrlParam('category', value);
  };

  const handleStatusChange = (value) => {
    dispatch(setStatusFilter(value));
    updateUrlParam('status', value);
  };

  const handleSortChange = (value) => {
    dispatch(setSortBy(value));
    updateUrlParam('sort', value);
  };

  const handlePageChange = (nextPage) => {
    dispatch(setPage(nextPage));
    updateUrlParam('page', nextPage.toString());
  };

  const handleResetAllFilters = () => {
    setSearchInput('');
    dispatch(resetFilters());
    dispatch(setOnlyPinned(false));
    setSearchParams(new URLSearchParams());
  };

  const handleResetSeed = async () => {
    const result = await dispatch(resetTasks());
    if (resetTasks.fulfilled.match(result)) {
      dispatch(showToast('База и кэш сброшены до исходных 100 записей!'));
    }
  };

  const handleToggleStatus = async (targetId, currentStatus) => {
    if (activeMutationId) return;
    const nextStatus = currentStatus === 'Completed' ? 'In Progress' : 'Completed';
    const result = await dispatch(updateTask({ id: targetId, partialData: { status: nextStatus } }));
    if (updateTask.fulfilled.match(result)) {
      dispatch(showToast(`Статус задачи ${targetId} изменен на ${nextStatus}!`));
    }
  };

  const handleDelete = async (targetId) => {
    if (!window.confirm(`Удалить задачу ${targetId}?`)) return;
    const result = await dispatch(deleteTask(targetId));
    if (deleteTask.fulfilled.match(result)) {
      dispatch(showToast(`Задача ${targetId} удалена.`));
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newTask = {
      title: formData.get('title'),
      category: formData.get('category'),
      priority: formData.get('priority'),
      status: formData.get('status'),
      assignee: formData.get('assignee'),
      estimatedHours: Number(formData.get('estimatedHours')),
      description: formData.get('description'),
    };
    const result = await dispatch(createTask(newTask));
    if (createTask.fulfilled.match(result)) {
      setIsCreateOpen(false);
      dispatch(showToast(`Создана задача ${result.payload.id}`));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingTask) return;
    const formData = new FormData(e.target);
    const updatedFields = {
      title: formData.get('title'),
      category: formData.get('category'),
      priority: formData.get('priority'),
      status: formData.get('status'),
      assignee: formData.get('assignee'),
      estimatedHours: Number(formData.get('estimatedHours')),
      description: formData.get('description'),
    };
    const targetId = editingTask.id;
    const result = await dispatch(updateTask({ id: targetId, partialData: updatedFields }));
    if (updateTask.fulfilled.match(result)) {
      setEditingTask(null);
      dispatch(showToast(`Задача ${targetId} обновлена!`));
    }
  };

  const isLoading = listStatus === 'loading' && paginatedItems.length === 0;
  const isError = listStatus === 'failed';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-card p-4 rounded-xl">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white">Каталог задач (Redux Store)</h2>
            {listStatus === 'succeeded' && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  dataSource === 'cache'
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {dataSource === 'cache' ? '⚡ Кэш' : '🌐 Сервер'}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Redux Toolkit Slices + Memoized Selectors + Debounced URL Sync
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => dispatch(setViewMode(viewMode === 'grid' ? 'compact' : 'grid'))}
            className="px-3 py-2 text-xs bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-slate-300"
          >
            {viewMode === 'grid' ? '☰ Компактно' : '⊞ Сетка'}
          </button>
          <button
            onClick={handleResetSeed}
            className="flex-1 sm:flex-initial px-3 py-2 text-xs bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-slate-300"
          >
            Сброс (100)
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex-1 sm:flex-initial px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white shadow-md"
          >
            + Задача
          </button>
        </div>
      </div>

      {/* Filters & Debounced Search */}
      <div className="glass-card p-3.5 sm:p-4 rounded-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Поиск по названию, ID, автору..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
          <select
            value={filters.category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="All">Все категории</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="All">Все статусы</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={filters.sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="newest">Сначала новые (ID)</option>
            <option value="title">По названию (A-Z)</option>
            <option value="hours">По часам (убывание)</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
          <button
            type="button"
            onClick={() => dispatch(setOnlyPinned(!onlyPinned))}
            className={`px-3 py-1.5 rounded-lg border font-semibold transition-colors ${
              onlyPinned
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            📌 Закрепленные ({pinnedTaskIds.length})
          </button>

          {(filters.searchQuery || filters.category !== 'All' || filters.status !== 'All' || onlyPinned) && (
            <button
              type="button"
              onClick={handleResetAllFilters}
              className="text-indigo-400 hover:underline text-xs"
            >
              Сбросить фильтры
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="glass-card h-40 rounded-xl animate-pulse bg-slate-900"></div>
          ))}
        </div>
      )}

      {/* Error State with Retry Action */}
      {isError && (
        <div className="p-6 glass-card border border-red-500/40 rounded-xl text-center space-y-3">
          <p className="text-red-400 text-xs">⚠️ {listError}</p>
          <button
            type="button"
            onClick={() => dispatch(fetchTasks({ force: true }))}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg"
          >
            🔄 Повторить запрос
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && paginatedItems.length === 0 && (
        <div className="p-10 glass-card rounded-xl text-center space-y-3">
          <p className="text-slate-400 text-xs">Задач по выбранным фильтрам не найдено.</p>
          <button
            type="button"
            onClick={handleResetAllFilters}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700"
          >
            Показать все задачи
          </button>
        </div>
      )}

      {/* Task Grid & Pagination */}
      {!isLoading && !isError && paginatedItems.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {paginatedItems.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isPinned={pinnedTaskIds.includes(task.id)}
                viewMode={viewMode}
                isActionBusy={activeMutationId === task.id}
                onTogglePin={(id) => dispatch(togglePinTask(id))}
                onToggleStatus={handleToggleStatus}
                onEdit={setEditingTask}
                onDelete={handleDelete}
              />
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800 pt-4 text-xs">
            <span className="text-slate-400">
              Показано {paginatedItems.length} из {totalFilteredCount} (Стр. {safePage} из {totalPages})
            </span>
            <div className="flex space-x-2 w-full sm:w-auto">
              <button
                disabled={safePage <= 1}
                onClick={() => handlePageChange(safePage - 1)}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-slate-800 disabled:opacity-40 text-slate-200 border border-slate-700"
              >
                ← Назад
              </button>
              <button
                disabled={safePage >= totalPages}
                onClick={() => handlePageChange(safePage + 1)}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-slate-800 disabled:opacity-40 text-slate-200 border border-slate-700"
              >
                Вперед →
              </button>
            </div>
          </div>
        </>
      )}

      {/* Create Modal (temporary form state kept local) */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="glass-card max-w-md w-full p-5 sm:p-6 rounded-xl border border-slate-700 my-auto">
            <h2 className="text-base font-bold text-white mb-4">Создать новую задачу</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Title *</label>
                <input required name="title" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-300 mb-1">Category</label>
                  <select name="category" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Priority</label>
                  <select name="priority" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white">
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-300 mb-1">Status</label>
                  <select name="status" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Assignee</label>
                  <input required name="assignee" defaultValue="Medeu Seidali" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Estimated Hours</label>
                <input required type="number" name="estimatedHours" defaultValue="4" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Description</label>
                <textarea required name="description" rows="3" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="px-3 py-2 text-slate-400">Отмена</button>
                <button type="submit" disabled={activeMutationId === 'CREATE'} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold">
                  {activeMutationId === 'CREATE' ? 'Сохранение...' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="glass-card max-w-md w-full p-5 sm:p-6 rounded-xl border border-slate-700 my-auto">
            <h2 className="text-base font-bold text-white mb-4">Редактирование: {editingTask.id}</h2>
            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Title</label>
                <input required name="title" defaultValue={editingTask.title} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-300 mb-1">Category</label>
                  <select name="category" defaultValue={editingTask.category} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Priority</label>
                  <select name="priority" defaultValue={editingTask.priority} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white">
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-300 mb-1">Status</label>
                  <select name="status" defaultValue={editingTask.status} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Assignee</label>
                  <input required name="assignee" defaultValue={editingTask.assignee} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Estimated Hours</label>
                <input required type="number" name="estimatedHours" defaultValue={editingTask.estimatedHours} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Description</label>
                <textarea required name="description" rows="3" defaultValue={editingTask.description} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingTask(null)} className="px-3 py-2 text-slate-400">Отмена</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
