import { create } from 'zustand';
import { JournalEntry, StorageService } from '../services/storage';

export type SortOption = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc';

interface JournalState {
    // UI State
    sidebarOpened: boolean;
    mobileOpened: boolean;
    sortOrder: SortOption;
    viewMode: 'feed' | 'single';

    // Data State
    entries: JournalEntry[];
    currentEntry: JournalEntry | null;
    isLoading: boolean;
    initialLoadDone: boolean;

    // Actions
    toggleSidebar: () => void;
    toggleMobile: () => void;
    closeMobile: () => void;
    setSortOrder: (order: SortOption) => void;
    setViewMode: (mode: 'feed' | 'single') => void;

    loadEntries: () => Promise<void>;
    createEntry: () => Promise<void>;
    selectEntry: (entry: JournalEntry) => Promise<void>;
    renameEntry: (entry: JournalEntry, newName: string) => Promise<void>;
    deleteEntry: (entry: JournalEntry) => Promise<void>;
    saveEntry: (filename: string, content: string) => Promise<void>;
}

export const useStore = create<JournalState>((set, get) => ({
    // UI State
    sidebarOpened: true,
    mobileOpened: false,
    sortOrder: 'date-desc',
    viewMode: 'feed',

    // Data State
    entries: [],
    currentEntry: null,
    isLoading: false,
    initialLoadDone: false,

    // Actions
    toggleSidebar: () => set(state => ({ sidebarOpened: !state.sidebarOpened })),
    toggleMobile: () => set(state => ({ mobileOpened: !state.mobileOpened })),
    closeMobile: () => set({ mobileOpened: false }),
    setSortOrder: (order) => set({ sortOrder: order }),
    setViewMode: (mode) => {
        set({ viewMode: mode });
        StorageService.saveSettings({ viewMode: mode });
    },

    loadEntries: async () => {
        try {
            set({ isLoading: true });
            const list = await StorageService.listEntries();
            set({ entries: list });

            if (!get().initialLoadDone) {
                set({ initialLoadDone: true });

                const settings = await StorageService.loadSettings();
                if (settings?.viewMode) {
                    set({ viewMode: settings.viewMode });
                }

                const lastOpenedFilename = await StorageService.loadLastOpenedEntry();

                if (lastOpenedFilename) {
                    const lastEntry = list.find(e => e.filename === lastOpenedFilename);
                    if (lastEntry) {
                        await get().selectEntry(lastEntry);
                        return;
                    }
                }

                if (list.length > 0) {
                    await get().selectEntry(list[0]);
                } else {
                    await get().createEntry();
                }
            }
        } catch (error) {
            console.error('[Store] Failed to load entries:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    selectEntry: async (entry) => {
        try {
            // We don't strictly *need* to load content here if each FeedEntry loads its own,
            // but setting currentEntry updates the header title, etc.
            // FeedEntry loading content is separate component local state or we could cache it here.
            // For now, let's just set the current entry reference.
            set({ currentEntry: entry });

            // Update window title
            const { getCurrentWindow } = await import('@tauri-apps/api/window');
            const title = entry.displayName ? `${entry.displayName} - Journal` : 'Journal';
            await getCurrentWindow().setTitle(title);

            await StorageService.saveLastOpenedEntry(entry.filename);
        } catch (error) {
            console.error('Failed to select entry:', error);
        }
    },

    createEntry: async () => {
        try {
            const now = new Date();
            const filename = `entry_${now.getTime()}.json`;
            const displayName = now.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });

            const newEntry: JournalEntry = {
                filename,
                displayName,
                content: '',
                date: now,
                lastModified: now
            };

            await StorageService.saveEntry(filename, '[]');
            await StorageService.saveMetadata(filename, displayName, now, now);
            await StorageService.saveLastOpenedEntry(filename);

            // Update list and select
            await get().loadEntries(); // To refresh list properly
            await get().selectEntry(newEntry);

        } catch (error) {
            console.error('Failed to create entry:', error);
        }
    },

    renameEntry: async (entry, newName) => {
        try {
            await StorageService.renameEntry(entry.filename, newName);

            set(state => ({
                entries: state.entries.map(e =>
                    e.filename === entry.filename ? { ...e, displayName: newName } : e
                ),
                currentEntry: state.currentEntry?.filename === entry.filename
                    ? { ...state.currentEntry, displayName: newName }
                    : state.currentEntry
            }));
        } catch (error) {
            console.error('Failed to rename entry:', error);
        }
    },

    deleteEntry: async (entry) => {
        try {
            await StorageService.deleteEntry(entry.filename);

            set(state => {
                const newEntries = state.entries.filter(e => e.filename !== entry.filename);
                return {
                    entries: newEntries,
                    currentEntry: state.currentEntry?.filename === entry.filename ? null : state.currentEntry
                };
            });
        } catch (error) {
            console.error('Failed to delete entry:', error);
        }
    },

    saveEntry: async (filename, content) => {
        try {
            await StorageService.saveEntry(filename, content);

            // We need to find the entry to update its metadata
            const state = get();
            const entry = state.entries.find(e => e.filename === filename);

            if (entry) {
                const lastModified = new Date();
                await StorageService.saveMetadata(
                    entry.filename,
                    entry.displayName,
                    entry.date,
                    lastModified
                );

                // Update store
                set(s => ({
                    entries: s.entries.map(e => e.filename === filename ? { ...e, lastModified } : e),
                    currentEntry: s.currentEntry?.filename === filename ? { ...s.currentEntry!, lastModified } : s.currentEntry
                }));
            }
        } catch (error) {
            console.error('Failed to save entry content:', error);
        }
    }
}));

// Derived selector for sorted entries
export const useSortedEntries = () => {
    const entries = useStore(state => state.entries);
    const sortOrder = useStore(state => state.sortOrder);

    return [...entries].sort((a, b) => {
        switch (sortOrder) {
            case 'date-desc':
                return new Date(b.lastModified || b.date).getTime() - new Date(a.lastModified || a.date).getTime();
            case 'date-asc':
                return new Date(a.lastModified || a.date).getTime() - new Date(b.lastModified || b.date).getTime();
            case 'title-asc':
                return a.displayName.localeCompare(b.displayName);
            case 'title-desc':
                return b.displayName.localeCompare(a.displayName);
            default:
                return 0;
        }
    });
};
