import { Paper, Title, Text, Group, Box, Loader } from '@mantine/core';
import { JournalEntry, StorageService } from '../../services/storage';
import { Editor } from '../Editor/Editor';
import { useState, useEffect, useCallback } from 'react';

interface FeedEntryProps {
    entry: JournalEntry;
    isHighlighted?: boolean;
    onSelect?: (entry: JournalEntry) => void;
    onSaveGlobal?: (filename: string, content: string) => Promise<void>;
    expanded?: boolean;
    hideHeader?: boolean;
}

export function FeedEntry({ entry, isHighlighted, onSelect, onSaveGlobal, expanded, hideHeader }: FeedEntryProps) {
    const [content, setContent] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadContent();
    }, [entry.filename]);

    const loadContent = async () => {
        try {
            const data = await StorageService.loadEntry(entry.filename);
            setContent(data);
        } catch (error) {
            console.error(`Failed to load content for ${entry.filename}`, error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = useCallback(async (newContent: string) => {
        // Select entry on save/edit interaction if not already
        if (onSelect) {
            onSelect(entry);
        }

        // Save content
        if (onSaveGlobal) {
            await onSaveGlobal(entry.filename, newContent);
        } else {
            try {
                await StorageService.saveEntry(entry.filename, newContent);
                const lastModified = new Date();
                await StorageService.saveMetadata(
                    entry.filename,
                    entry.displayName,
                    entry.date,
                    lastModified
                );
            } catch (error) {
                console.error("Failed to save entry", error);
            }
        }
    }, [entry, onSaveGlobal, onSelect]);

    return (
        <Paper
            shadow="xs"
            p="xl"
            withBorder
            mb={expanded ? 0 : "xl"}
            style={{
                transition: 'border-color 0.3s',
                borderColor: isHighlighted ? 'var(--mantine-primary-color)' : undefined
            }}
            onClick={() => onSelect?.(entry)}
        >
            {!hideHeader && (
                <Box mb="md">
                    <Title order={3}>{entry.displayName}</Title>
                    <Text size="sm" c="dimmed">
                        {new Date(entry.date).toLocaleString(undefined, {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                        })}
                    </Text>
                </Box>
            )}

            {isLoading ? (
                <Group justify="center" p="xl">
                    <Loader size="sm" type="dots" />
                </Group>
            ) : (
                <div style={{ minHeight: '200px' }}>
                    <Editor
                        key={entry.filename}
                        initialContent={content || undefined}
                        onSave={handleSave}
                        onFocus={() => onSelect?.(entry)}
                    />
                </div>
            )}
        </Paper>
    );
}
