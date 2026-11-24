export const API_CONFIG = {
  STORAGE_KEY: 'devtask_hub_mutations_v1',
  DELAY_MS: Number(import.meta.env.VITE_API_DELAY) || 250,
  CACHE_TTL_MS: Number(import.meta.env.VITE_CACHE_TTL_MS) || 60000,
};
