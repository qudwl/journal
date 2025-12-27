import { Modal, Stack, Text, Group, Divider, useMantineColorScheme, SegmentedControl, Center, Box } from '@mantine/core';
import { IconSun, IconMoon, IconDeviceDesktop, IconList, IconFileText } from '@tabler/icons-react';
import { useStore } from '../../store/useStore';

interface SettingsModalProps {
    opened: boolean;
    onClose: () => void;
}

export function SettingsModal({ opened, onClose }: SettingsModalProps) {
    const { colorScheme, setColorScheme } = useMantineColorScheme();
    const viewMode = useStore(state => state.viewMode);
    const setViewMode = useStore(state => state.setViewMode);

    return (
        <Modal opened={opened} onClose={onClose} title="Settings" centered>
            <Stack gap="md">
                <Box>
                    <Text size="sm" fw={500} mb="xs">Appearance</Text>
                    <Group justify="space-between">
                        <Text size="sm" c="dimmed">Theme</Text>
                        <SegmentedControl
                            value={colorScheme}
                            onChange={(value) => setColorScheme(value as 'light' | 'dark' | 'auto')}
                            data={[
                                {
                                    value: 'light',
                                    label: (
                                        <Center>
                                            <IconSun size={16} />
                                            <Box ml={10}>Light</Box>
                                        </Center>
                                    ),
                                },
                                {
                                    value: 'dark',
                                    label: (
                                        <Center>
                                            <IconMoon size={16} />
                                            <Box ml={10}>Dark</Box>
                                        </Center>
                                    ),
                                },
                                {
                                    value: 'auto',
                                    label: (
                                        <Center>
                                            <IconDeviceDesktop size={16} />
                                            <Box ml={10}>Auto</Box>
                                        </Center>
                                    ),
                                },
                            ]}
                        />
                    </Group>
                    <Group justify="space-between" mt="md">
                        <Text size="sm" c="dimmed">Default View</Text>
                        <SegmentedControl
                            value={viewMode}
                            onChange={(value) => setViewMode(value as 'feed' | 'single')}
                            data={[
                                {
                                    value: 'feed',
                                    label: (
                                        <Center>
                                            <IconList size={16} />
                                            <Box ml={10}>Feed</Box>
                                        </Center>
                                    ),
                                },
                                {
                                    value: 'single',
                                    label: (
                                        <Center>
                                            <IconFileText size={16} />
                                            <Box ml={10}>Entry</Box>
                                        </Center>
                                    ),
                                },
                            ]}
                        />
                    </Group>
                </Box>

                <Divider />

                <Box>
                    <Text size="xs" c="dimmed" ta="center">
                        Journal App v0.1.0
                    </Text>
                </Box>
            </Stack>
        </Modal>
    );
}
