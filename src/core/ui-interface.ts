import React from 'react';

// Core data interfaces
export interface Course {
  id: string;
  title: string;
  description: string;
  coverImage: string | null;
  progress: number;
  modules: any[];
  isTemplate?: boolean;
  tags?: string[];
}

export interface CourseListState {
  courses: Course[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  filterType: 'all' | 'courses' | 'templates';
  selectedCourseId: string | null;
}

// UI Component interfaces
export interface CourseListUI {
  name: string;
  description: string;
  component: React.ComponentType<CourseListUIProps>;
}

export interface CourseListUIProps {
  state: CourseListState;
  config: CourseListConfig;
  actions: CourseListActions;
}

export interface CourseListConfig {
  // Layout configuration
  layout?: {
    mode?: 'grid' | 'list' | 'cards' | 'skool';
    columns?: number;
    cardStyle?: 'compact' | 'full' | 'minimal';
    showProgress?: boolean;
    showImages?: boolean;
    showSearch?: boolean;
    showFilters?: boolean;
  };
  
  // Feature configuration
  features?: {
    creation?: boolean;
    editing?: boolean;
    deletion?: boolean;
    duplication?: boolean;
    sharing?: boolean;
    hoverMenu?: boolean;
    contextActions?: boolean;
    modalEdit?: boolean;
  };
  
  // Permissions
  permissions?: {
    canCreate?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    canManage?: boolean;
  };
  
  // Custom actions
  customActions?: Array<{
    id: string;
    label: string;
    icon?: string;
    handler: (courseId: string) => void;
    condition?: (course: Course) => boolean;
  }>;
  
  // Styling
  theme?: {
    primaryColor?: string;
    backgroundColor?: string;
    borderRadius?: string;
    cardShadow?: string;
  };
}

export interface CourseListActions {
  // Course selection
  onCourseSelect: (courseId: string) => void;
  onCourseEdit: (courseId: string) => void;
  onCourseDelete: (courseId: string) => void;
  onCourseCreate: () => void;
  
  // State updates
  onSearchChange: (term: string) => void;
  onFilterChange: (filter: 'all' | 'courses' | 'templates') => void;
  
  // Custom actions
  onCustomAction: (actionId: string, courseId: string) => void;
}

// UI Registry
export class UIRegistry {
  private static instance: UIRegistry;
  private uis: Map<string, CourseListUI> = new Map();

  static getInstance(): UIRegistry {
    if (!UIRegistry.instance) {
      UIRegistry.instance = new UIRegistry();
    }
    return UIRegistry.instance;
  }

  register(ui: CourseListUI): void {
    this.uis.set(ui.name, ui);
  }

  get(name: string): CourseListUI | undefined {
    return this.uis.get(name);
  }

  list(): CourseListUI[] {
    return Array.from(this.uis.values());
  }

  getDefault(): CourseListUI {
    return this.get('default') || this.list()[0];
  }
}

// Factory for creating UI configurations
export class UIConfigFactory {
  static createSkoolConfig(overrides?: Partial<CourseListConfig>): CourseListConfig {
    return {
      layout: {
        mode: 'skool',
        showProgress: true,
        showImages: true,
        showSearch: false,
        showFilters: false,
      },
      features: {
        creation: true,
        editing: true,
        hoverMenu: true,
        contextActions: true,
        modalEdit: true,
      },
      ...overrides,
    };
  }

  static createGridConfig(overrides?: Partial<CourseListConfig>): CourseListConfig {
    return {
      layout: {
        mode: 'grid',
        columns: 3,
        cardStyle: 'full',
        showProgress: true,
        showImages: true,
        showSearch: true,
        showFilters: true,
      },
      features: {
        creation: true,
        editing: true,
        deletion: true,
      },
      ...overrides,
    };
  }

  static createListConfig(overrides?: Partial<CourseListConfig>): CourseListConfig {
    return {
      layout: {
        mode: 'list',
        showProgress: true,
        showImages: false,
        showSearch: true,
        showFilters: true,
      },
      features: {
        creation: true,
        editing: true,
      },
      ...overrides,
    };
  }

  static createMinimalConfig(overrides?: Partial<CourseListConfig>): CourseListConfig {
    return {
      layout: {
        mode: 'cards',
        cardStyle: 'minimal',
        showProgress: false,
        showImages: false,
        showSearch: false,
        showFilters: false,
      },
      features: {
        creation: false,
        editing: false,
      },
      ...overrides,
    };
  }
}