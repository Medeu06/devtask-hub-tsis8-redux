import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  searchQuery: '',
  category: 'All',
  status: 'All',
  sortBy: 'newest',
  page: 1,
  itemsPerPage: 9,
  dashboardAssignee: 'All',
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setSearchQuery(state, action) {
      if (state.searchQuery !== action.payload) {
        state.searchQuery = action.payload;
        state.page = 1;
      }
    },
    setCategoryFilter(state, action) {
      state.category = action.payload;
      state.page = 1;
    },
    setStatusFilter(state, action) {
      state.status = action.payload;
      state.page = 1;
    },
    setSortBy(state, action) {
      state.sortBy = action.payload;
      state.page = 1;
    },
    setPage(state, action) {
      state.page = Math.max(1, Number(action.payload) || 1);
    },
    setDashboardAssignee(state, action) {
      state.dashboardAssignee = action.payload;
    },
    syncFiltersFromUrl(state, action) {
      const { q = '', category = 'All', status = 'All', sort = 'newest', page = 1 } = action.payload;
      state.searchQuery = q;
      state.category = category;
      state.status = status;
      state.sortBy = sort;
      state.page = Math.max(1, Number(page) || 1);
    },
    resetFilters(state) {
      state.searchQuery = '';
      state.category = 'All';
      state.status = 'All';
      state.sortBy = 'newest';
      state.page = 1;
    },
  },
});

export const {
  setSearchQuery,
  setCategoryFilter,
  setStatusFilter,
  setSortBy,
  setPage,
  setDashboardAssignee,
  syncFiltersFromUrl,
  resetFilters,
} = filtersSlice.actions;

export default filtersSlice.reducer;
