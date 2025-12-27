import { AppShell } from '@mantine/core';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { JournalFeed } from './components/JournalFeed';
import { SingleEntryView } from './components/SingleEntryView';
import { useEffect } from 'react';
import { useStore } from './store/useStore';
import './App.css';

function App() {
  const sidebarOpened = useStore(state => state.sidebarOpened);
  const mobileOpened = useStore(state => state.mobileOpened);
  const loadEntries = useStore(state => state.loadEntries);
  const viewMode = useStore(state => state.viewMode);

  useEffect(() => {
    loadEntries();
  }, []);

  return (
    <AppShell
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened, desktop: !sidebarOpened },
      }}
      padding="md"
    >
      <AppShell.Navbar p="md">
        <Sidebar />
      </AppShell.Navbar>

      <AppShell.Main pt={0}>
        <Header />

        <div style={{ maxWidth: 800, margin: '0 auto', padding: 'var(--mantine-spacing-md)' }}>
          {viewMode === 'feed' ? <JournalFeed /> : <SingleEntryView />}
        </div>
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
