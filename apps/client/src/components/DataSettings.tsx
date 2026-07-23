/**
 * Export / import of local progress (REL-002, doc 15 §6). Export writes the
 * append-only event log to a JSON file; import merges a file back idempotently
 * (re-importing changes nothing — doc 11 persistence acceptance).
 */
import { useRef, useState, type ChangeEvent } from 'react';
import { exportEvents, importEvents, type EventStore } from '@learn/persistence';
import { eventStore as defaultStore } from '../data/repository.js';

/** Read a file as text, using the modern API where available and FileReader otherwise. */
function readFileText(file: File): Promise<string> {
  if (typeof file.text === 'function') return file.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.readAsText(file);
  });
}

export function DataSettings({
  store = defaultStore,
  onImported,
}: {
  store?: EventStore;
  onImported?: () => void | Promise<void>;
}): JSX.Element {
  const [status, setStatus] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function onExport(): Promise<void> {
    const json = await exportEvents(store);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'learning-progress.json';
    a.click();
    URL.revokeObjectURL(url);
    setStatus('Your progress was exported.');
  }

  async function onImport(e: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await readFileText(file);
      const added = await importEvents(store, text);
      setStatus(`Imported ${added} new event${added === 1 ? '' : 's'}.`);
      await onImported?.();
    } catch {
      setStatus('That file could not be imported. Your existing progress is unchanged.');
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  return (
    <>
      <button type="button" onClick={onExport}>
        Export progress
      </button>
      <label htmlFor="import-progress">Import progress from a file</label>
      <input
        id="import-progress"
        ref={fileInput}
        type="file"
        accept="application/json"
        onChange={onImport}
      />
      {status && (
        <p className="progress-note" role="status">
          {status}
        </p>
      )}
    </>
  );
}
