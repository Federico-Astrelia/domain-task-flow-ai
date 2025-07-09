
export interface UserPreferences {
  sortBy: string;
  searchQuery: string;
  showClosedDomains: boolean;
  domainFilters?: {
    sortBy: string;
    filterTag: string;
    filterDependency: string;
  };
}

const PREFERENCES_KEY = 'domain-task-flow-preferences';

export const savePreferences = (preferences: Partial<UserPreferences>) => {
  try {
    const existing = getPreferences();
    const updated = { ...existing, ...preferences };
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving preferences:', error);
  }
};

export const getPreferences = (): UserPreferences => {
  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading preferences:', error);
  }
  
  return {
    sortBy: 'created_at',
    searchQuery: '',
    showClosedDomains: false,
    domainFilters: {
      sortBy: 'created_at',
      filterTag: 'all',
      filterDependency: 'all'
    }
  };
};

export const saveDomainFilters = (filters: { sortBy: string; filterTag: string; filterDependency: string }) => {
  savePreferences({ domainFilters: filters });
};

export const getDomainFilters = () => {
  const prefs = getPreferences();
  return prefs.domainFilters || {
    sortBy: 'created_at',
    filterTag: 'all',
    filterDependency: 'all'
  };
};
