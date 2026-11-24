import { createSelector } from '@reduxjs/toolkit';
import { CATEGORIES } from '../../services/initial-data-sample.js';

// Reusable Base Selectors
export const selectAllTasks = (state) => state.tasks.items;
export const selectTasksListStatus = (state) => state.tasks.listStatus;
export const selectTasksListError = (state) => state.tasks.listError;
export const selectTasksDataSource = (state) => state.tasks.dataSource;

export const selectSelectedTask = (state) => state.tasks.selectedTask;
export const selectTaskDetailStatus = (state) => state.tasks.detailStatus;
export const selectTaskDetailError = (state) => state.tasks.detailError;
export const selectTaskDetailSource = (state) => state.tasks.detailDataSource;
export const selectActiveMutationId = (state) => state.tasks.activeMutationId;

export const selectFilters = (state) => state.filters;
export const selectDashboardAssignee = (state) => state.filters.dashboardAssignee;

export const selectPinnedTaskIds = (state) => state.workspace.pinnedTaskIds;
export const selectOnlyPinned = (state) => state.workspace.onlyPinned;
export const selectViewMode = (state) => state.workspace.viewMode;
export const selectToast = (state) => state.workspace.toast;

// Memoized Selector 1: Filtered & Sorted Tasks
export const selectFilteredAndSortedTasks = createSelector(
  [selectAllTasks, selectFilters, selectPinnedTaskIds, selectOnlyPinned],
  (tasks, filters, pinnedIds, onlyPinned) => {
    const query = filters.searchQuery.trim().toLowerCase();
    const pinnedSet = new Set(pinnedIds);

    const filtered = tasks.filter((t) => {
      if (onlyPinned && !pinnedSet.has(t.id)) return false;

      const matchesQuery =
        !query ||
        t.title.toLowerCase().includes(query) ||
        t.id.toLowerCase().includes(query) ||
        t.assignee.toLowerCase().includes(query);

      const matchesCategory = filters.category === 'All' || t.category === filters.category;
      const matchesStatus = filters.status === 'All' || t.status === filters.status;

      return matchesQuery && matchesCategory && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      if (filters.sortBy === 'title') return a.title.localeCompare(b.title);
      if (filters.sortBy === 'hours') return b.estimatedHours - a.estimatedHours;
      return b.id.localeCompare(a.id);
    });
  }
);

// Memoized Selector 2: Paginated Slice & Page Metadata
export const selectPaginatedTasks = createSelector(
  [selectFilteredAndSortedTasks, selectFilters],
  (sortedTasks, filters) => {
    const totalFilteredCount = sortedTasks.length;
    const totalPages = Math.ceil(totalFilteredCount / filters.itemsPerPage) || 1;
    const safePage = Math.min(Math.max(1, filters.page), totalPages);
    const startIndex = (safePage - 1) * filters.itemsPerPage;
    const paginatedItems = sortedTasks.slice(startIndex, startIndex + filters.itemsPerPage);

    return {
      paginatedItems,
      totalFilteredCount,
      totalPages,
      safePage,
    };
  }
);

// Memoized Selector 3: Dashboard Metrics & Breakdowns
export const selectDashboardAnalytics = createSelector(
  [selectAllTasks, selectDashboardAssignee],
  (tasks, selectedAssignee) => {
    const assignees = Array.from(new Set(tasks.map((t) => t.assignee)));
    const scopedTasks =
      selectedAssignee === 'All' ? tasks : tasks.filter((t) => t.assignee === selectedAssignee);

    const totalCount = scopedTasks.length;
    const completedCount = scopedTasks.filter((t) => t.status === 'Completed').length;
    const inProgressCount = scopedTasks.filter((t) => t.status === 'In Progress').length;
    const totalHours = scopedTasks.reduce((acc, t) => acc + t.estimatedHours, 0);
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const categoryBreakdown = CATEGORIES.map((category) => {
      const count = scopedTasks.filter((t) => t.category === category).length;
      const percent = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
      return { category, count, percent };
    });

    const priorityBreakdown = ['Critical', 'High', 'Medium', 'Low'].map((priority) => ({
      priority,
      count: scopedTasks.filter((t) => t.priority === priority).length,
    }));

    return {
      assignees,
      totalCount,
      completedCount,
      inProgressCount,
      totalHours,
      completionRate,
      categoryBreakdown,
      priorityBreakdown,
    };
  }
);
