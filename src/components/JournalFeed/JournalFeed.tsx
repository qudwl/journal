import { Stack, Text } from '@mantine/core';
import { useIntersection } from '@mantine/hooks';
import { FeedEntry } from './FeedEntry';
import { useState, useEffect, useRef } from 'react';
import { useStore, useSortedEntries } from '../../store/useStore';

const ITEMS_PER_PAGE = 5;

export function JournalFeed() {
    const entries = useSortedEntries();
    const activeEntryFilename = useStore(state => state.currentEntry?.filename || null);
    const selectEntry = useStore(state => state.selectEntry);
    const saveEntry = useStore(state => state.saveEntry);

    const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
    const { ref: loadMoreRef, entry: intersectionEntry } = useIntersection({
        threshold: 1,
    });

    // Refs for scrolling to specific entries
    const entryRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // Reset display count when sort order changes (effectively when entries array identity changes)
    // Actually, we probably want to keep showing enough to fill screen, 
    // but resetting to 5 is safe to start.
    useEffect(() => {
        // If the array changes drastically (sort), reset.
        // But we need to distinguish sort from just one new entry added.
        // For simplicity, let's just ensure we have at least ITEMS_PER_PAGE
    }, [entries]);

    // Infinite scroll logic
    useEffect(() => {
        if (intersectionEntry?.isIntersecting) {
            // Load more
            setDisplayCount(prev => Math.min(prev + ITEMS_PER_PAGE, entries.length));
        }
    }, [intersectionEntry?.isIntersecting, entries.length]);

    // Scroll to active entry logic
    useEffect(() => {
        if (activeEntryFilename && entryRefs.current[activeEntryFilename]) {
            // Check if it's currently rendered
            const index = entries.findIndex(e => e.filename === activeEntryFilename);

            // If the target is outside the current display limit, strictly increase limit
            if (index >= displayCount) {
                setDisplayCount(index + ITEMS_PER_PAGE);
                // We'll scroll after render when ref becomes available
                // setTimeout is a hacky but simple way to wait for render
                setTimeout(() => {
                    entryRefs.current[activeEntryFilename]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            } else {
                entryRefs.current[activeEntryFilename]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [activeEntryFilename, entries]); // Dependency on entries important if sorts change

    const displayedEntries = entries.slice(0, displayCount);

    return (
        <Stack gap="sm" pb={100}>
            {entries.length === 0 ? (
                <Text ta="center" c="dimmed" mt="xl">No journal entries yet. Create one!</Text>
            ) : (
                <>
                    {displayedEntries.map(entry => (
                        <div
                            key={entry.filename}
                            ref={el => entryRefs.current[entry.filename] = el}
                        >
                            <FeedEntry
                                entry={entry}
                                isHighlighted={entry.filename === activeEntryFilename}
                                onSelect={selectEntry}
                                onSaveGlobal={saveEntry}
                            />
                        </div>
                    ))}

                    {/* Intersection Anchor */}
                    {displayCount < entries.length && (
                        <div ref={loadMoreRef} style={{ height: 20, textAlign: 'center' }}>
                            <Text size="xs" c="dimmed">Loading more...</Text>
                        </div>
                    )}

                    {displayCount >= entries.length && entries.length > 0 && (
                        <Text size="xs" c="dimmed" ta="center" mt="md">
                            — End of Journal —
                        </Text>
                    )}
                </>
            )}
        </Stack>
    );
}
