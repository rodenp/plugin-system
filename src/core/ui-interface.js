// UI Registry
export class UIRegistry {
    static instance;
    uis = new Map();
    static getInstance() {
        if (!UIRegistry.instance) {
            UIRegistry.instance = new UIRegistry();
        }
        return UIRegistry.instance;
    }
    register(ui) {
        this.uis.set(ui.name, ui);
    }
    get(name) {
        return this.uis.get(name);
    }
    list() {
        return Array.from(this.uis.values());
    }
    getDefault() {
        return this.get('default') || this.list()[0];
    }
}
// Factory for creating UI configurations
export class UIConfigFactory {
    static createSkoolConfig(overrides) {
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
    static createGridConfig(overrides) {
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
    static createListConfig(overrides) {
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
    static createMinimalConfig(overrides) {
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
