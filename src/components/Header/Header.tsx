import { Group, Burger, ActionIcon, Button, TextInput, Title, Box, Stack, Text } from '@mantine/core';
import { IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand, IconSettings } from '@tabler/icons-react';
import { useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { SettingsModal } from '../SettingsModal';
import { useStore } from '../../store/useStore';

export function Header() {
    const sidebarOpened = useStore(state => state.sidebarOpened);
    const toggleSidebar = useStore(state => state.toggleSidebar);
    const mobileOpened = useStore(state => state.mobileOpened);
    const toggleMobile = useStore(state => state.toggleMobile);
    const currentEntry = useStore(state => state.currentEntry);
    const renameEntry = useStore(state => state.renameEntry);
    const createEntry = useStore(state => state.createEntry);
    const viewMode = useStore(state => state.viewMode);

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleEditValue, setTitleEditValue] = useState('');
    const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);

    function startEditingTitle() {
        if (currentEntry) {
            setTitleEditValue(currentEntry.displayName);
            setIsEditingTitle(true);
        }
    }

    function saveTitle() {
        if (currentEntry && titleEditValue.trim() && titleEditValue !== currentEntry.displayName) {
            renameEntry(currentEntry, titleEditValue.trim());
        }
        setIsEditingTitle(false);
    }

    function cancelTitleEdit() {
        setIsEditingTitle(false);
        setTitleEditValue('');
    }

    return (
        <>
            <Box
                py="md"
                style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    backgroundColor: 'var(--mantine-color-body)',
                    borderBottom: '1px solid var(--mantine-color-default-border)'
                }}
            >
                <Group justify="space-between">
                    <Group>
                        <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
                        <ActionIcon
                            onClick={toggleSidebar}
                            variant="subtle"
                            size="lg"
                            visibleFrom="sm"
                            aria-label="Toggle sidebar"
                        >
                            {sidebarOpened ? <IconLayoutSidebarLeftCollapse size={20} /> : <IconLayoutSidebarLeftExpand size={20} />}
                        </ActionIcon>
                        <Stack gap={0}>
                            {isEditingTitle && currentEntry ? (
                                <TextInput
                                    value={titleEditValue}
                                    onChange={(e) => setTitleEditValue(e.currentTarget.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveTitle();
                                        if (e.key === 'Escape') cancelTitleEdit();
                                    }}
                                    onBlur={saveTitle}
                                    autoFocus
                                    size="md"
                                    styles={{ input: { fontSize: '1.25rem', fontWeight: 600 } }}
                                />
                            ) : (
                                <Title
                                    order={3}
                                    onClick={startEditingTitle}
                                    style={{
                                        cursor: currentEntry ? 'pointer' : 'default',
                                        userSelect: 'none',
                                        transition: 'opacity 0.2s',
                                    }}
                                    onMouseEnter={(e) => currentEntry && (e.currentTarget.style.opacity = '0.7')}
                                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                >
                                    {currentEntry?.displayName || 'My Journal'}
                                </Title>
                            )}
                            {viewMode === 'single' && currentEntry && (
                                <Text size="xs" c="dimmed">
                                    {new Date(currentEntry.date).toLocaleString(undefined, {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </Text>
                            )}
                        </Stack>
                    </Group>
                    <Group>
                        <ActionIcon variant="default" size="lg" onClick={openSettings} title="Settings">
                            <IconSettings size={20} />
                        </ActionIcon>
                        <Button onClick={createEntry}>New Entry</Button>
                    </Group>
                </Group>
            </Box>
            <SettingsModal opened={settingsOpened} onClose={closeSettings} />
        </>
    );
}
