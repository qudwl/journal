import { BaseDirectory, readDir, readTextFile, writeTextFile, exists, mkdir, remove } from '@tauri-apps/plugin-fs';

export interface JournalEntry {
  filename: string;
  displayName: string;
  content: string;
  date: Date;
  lastModified?: Date;
}

export interface AppSettings {
  viewMode?: 'feed' | 'single';
}

const STORAGE_DIR = 'JournalApp';

export class StorageService {

  private static async ensureDir() {
    const dirExists = await exists(STORAGE_DIR, { baseDir: BaseDirectory.Document });
    if (!dirExists) {
      await mkdir(STORAGE_DIR, { baseDir: BaseDirectory.Document, recursive: true });
    }
  }

  static async saveEntry(filename: string, content: string): Promise<void> {
    await this.ensureDir();
    await writeTextFile(`${STORAGE_DIR}/${filename}`, content, { baseDir: BaseDirectory.Document });
  }

  static async loadEntry(filename: string): Promise<string> {
    return await readTextFile(`${STORAGE_DIR}/${filename}`, { baseDir: BaseDirectory.Document });
  }

  static async listEntries(): Promise<JournalEntry[]> {
    await this.ensureDir();
    const entries = await readDir(STORAGE_DIR, { baseDir: BaseDirectory.Document });

    // Filter and map entries
    // Note: This is a basic implementation. In a real app we might want to store metadata separately
    // or parse filenames for dates. For now, let's assume filename is the ID/Date.

    const result: JournalEntry[] = [];

    for (const entry of entries) {
      if (entry.isFile && !entry.name.endsWith('.meta.json') && !entry.name.startsWith('.') && entry.name !== 'settings.json') {
        // For now, we don't load content for the list to save memory, 
        // strictly listing. We can assume filename is the date or title.
        // Let's create a date from the file creation time or filename if possible.
        // But readDir might not give metadata immediately without an extra call or different options in some versions.
        // Tauri v2 `readDir` returns `DirEntry` which has name.

        // We'll mock the date for now using the filename if it's a timestamp, otherwise current date.

        result.push({
          filename: entry.name,
          displayName: entry.name.replace('.json', ''), // Default to filename without extension
          content: '', // Load on demand
          date: new Date() // Placeholder, ideally we parse from name or metadata
        });
      }
    }

    // Load metadata for each entry
    for (const entry of result) {
      try {
        const metadata = await this.loadMetadata(entry.filename);
        if (metadata) {
          entry.displayName = metadata.displayName;
          entry.date = new Date(metadata.date);
          if (metadata.lastModified) {
            entry.lastModified = new Date(metadata.lastModified);
          }
        }
      } catch {
        // No metadata file, use defaults
      }
    }

    return result;
  }

  static async saveMetadata(filename: string, displayName: string, date: Date, lastModified?: Date): Promise<void> {
    await this.ensureDir();
    const metadataFilename = filename.replace('.json', '.meta.json');
    await writeTextFile(
      `${STORAGE_DIR}/${metadataFilename}`,
      JSON.stringify({ displayName, date, lastModified }),
      { baseDir: BaseDirectory.Document }
    );
  }

  static async loadMetadata(filename: string): Promise<{ displayName: string; date: string; lastModified?: string } | null> {
    try {
      const metadataFilename = filename.replace('.json', '.meta.json');
      const content = await readTextFile(`${STORAGE_DIR}/${metadataFilename}`, { baseDir: BaseDirectory.Document });
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  static async renameEntry(oldFilename: string, newDisplayName: string): Promise<void> {
    await this.ensureDir();
    // Load existing metadata or create new
    const metadata = await this.loadMetadata(oldFilename);
    const date = metadata?.date || new Date().toISOString();
    const lastModified = metadata?.lastModified ? new Date(metadata.lastModified) : undefined;

    // Save updated metadata
    await this.saveMetadata(oldFilename, newDisplayName, new Date(date), lastModified);
  }

  static async deleteEntry(filename: string): Promise<void> {
    await this.ensureDir();

    // Delete the entry file
    await remove(`${STORAGE_DIR}/${filename}`, { baseDir: BaseDirectory.Document });

    // Delete the metadata file if it exists
    try {
      const metadataFilename = filename.replace('.json', '.meta.json');
      await remove(`${STORAGE_DIR}/${metadataFilename}`, { baseDir: BaseDirectory.Document });
    } catch {
      // Metadata file might not exist, that's okay
    }
  }

  static async saveLastOpenedEntry(filename: string): Promise<void> {
    await this.ensureDir();
    await writeTextFile(`${STORAGE_DIR}/.last_opened`, filename, { baseDir: BaseDirectory.Document });
  }

  static async loadLastOpenedEntry(): Promise<string | null> {
    try {
      return await readTextFile(`${STORAGE_DIR}/.last_opened`, { baseDir: BaseDirectory.Document });
    } catch {
      return null;
    }
  }

  static async saveSettings(settings: AppSettings): Promise<void> {
    await this.ensureDir();
    await writeTextFile(
      `${STORAGE_DIR}/settings.json`,
      JSON.stringify(settings),
      { baseDir: BaseDirectory.Document }
    );
  }

  static async loadSettings(): Promise<AppSettings | null> {
    try {
      const content = await readTextFile(`${STORAGE_DIR}/settings.json`, { baseDir: BaseDirectory.Document });
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
}
