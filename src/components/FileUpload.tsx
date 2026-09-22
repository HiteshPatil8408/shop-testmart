import { useEffect, useRef, useState, type DragEvent } from 'react';
import { useQa } from '../app/QaContext';

type UploadStatus = 'queued' | 'uploading' | 'success' | 'failed' | 'cancelled';
interface UploadFile {
  id: string;
  file: File;
  preview?: string;
  progress: number;
  status: UploadStatus;
  error?: string;
}

const maximumFiles = 4;
const maximumBytes = 5 * 1024 * 1024;
const allowed = ['image/jpeg', 'image/png', 'application/pdf'];

export function FileUpload({ onDirty }: { onDirty?: () => void }) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [validation, setValidation] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timers = useRef(new Map<string, number>());
  const filesRef = useRef<UploadFile[]>([]);
  const qa = useQa();

  useEffect(() => {
    filesRef.current = files;
  }, [files]);
  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearInterval(timer));
      filesRef.current.forEach((item) => item.preview && URL.revokeObjectURL(item.preview));
    },
    [],
  );

  const add = (incoming: File[]) => {
    const errors: string[] = [];
    const next: UploadFile[] = [];
    for (const file of incoming) {
      if (files.length + next.length >= maximumFiles) {
        errors.push(`You can attach at most ${maximumFiles} files.`);
        break;
      }
      if (!allowed.includes(file.type)) {
        errors.push(`${file.name}: use JPG, PNG, or PDF.`);
        continue;
      }
      if (file.size > maximumBytes) {
        errors.push(`${file.name}: files must be 5 MB or smaller.`);
        continue;
      }
      if (
        [...files, ...next].some(
          (item) => item.file.name === file.name && item.file.size === file.size,
        )
      ) {
        errors.push(`${file.name}: duplicate file ignored.`);
        continue;
      }
      next.push({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        progress: 0,
        status: 'queued',
      });
    }
    setValidation(errors);
    if (next.length) {
      setFiles((current) => [...current, ...next]);
      onDirty?.();
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  const update = (id: string, patch: Partial<UploadFile>) =>
    setFiles((current) => {
      const next = current.map((item) => (item.id === id ? { ...item, ...patch } : item));
      filesRef.current = next;
      return next;
    });

  const upload = (id: string) => {
    const item = files.find((value) => value.id === id);
    if (!item || item.status === 'uploading') return;
    window.clearInterval(timers.current.get(id));
    update(id, { status: 'uploading', progress: 0, error: undefined });
    const timer = window.setInterval(
      () => {
        const current = filesRef.current.find((value) => value.id === id);
        if (!current || current.status !== 'uploading') return;
        const progress = Math.min(100, current.progress + 20);
        if (progress === 60 && qa.consume('uploadFailure')) {
          window.clearInterval(timer);
          timers.current.delete(id);
          update(id, {
            progress,
            status: 'failed',
            error: 'QA Lab simulated a failed upload.',
          });
          return;
        }
        if (progress === 100) {
          window.clearInterval(timer);
          timers.current.delete(id);
          update(id, { progress, status: 'success' });
          return;
        }
        update(id, { progress });
      },
      qa.slowUpload ? 600 : 120,
    );
    timers.current.set(id, timer);
  };

  const remove = (id: string) => {
    window.clearInterval(timers.current.get(id));
    timers.current.delete(id);
    const item = files.find((value) => value.id === id);
    if (item?.preview) URL.revokeObjectURL(item.preview);
    setFiles((current) => {
      const next = current.filter((value) => value.id !== id);
      filesRef.current = next;
      return next;
    });
    onDirty?.();
  };

  const drop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    add(Array.from(event.dataTransfer.files));
  };

  return (
    <section className="file-upload" aria-labelledby="attachment-heading">
      <h2 id="attachment-heading">Attachments</h2>
      <p>Attach up to four JPG, PNG, or PDF files. Each file may be up to 5 MB.</p>
      <div
        className={`drop-zone ${dragging ? 'is-dragging' : ''}`}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false);
        }}
        onDrop={drop}
      >
        <span aria-hidden="true">⇧</span>
        <strong>Drag files here</strong>
        <span>or use the keyboard-accessible file chooser</span>
        <button
          className="button button--secondary"
          type="button"
          onClick={() => inputRef.current?.click()}
        >
          Choose files
        </button>
        <input
          className="sr-only"
          ref={inputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
          aria-label="Choose return attachments"
          onChange={(event) => add(Array.from(event.target.files ?? []))}
        />
      </div>
      {validation.length > 0 && (
        <div className="alert alert--error" role="alert">
          <ul>
            {validation.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}
      {files.length > 0 && (
        <div className="upload-list" aria-live="polite">
          {files.map((item) => (
            <article key={item.id}>
              {item.preview ? (
                <img src={item.preview} alt={`Preview of ${item.file.name}`} />
              ) : (
                <span className="upload-file-icon" aria-hidden="true">
                  PDF
                </span>
              )}
              <div>
                <strong>{item.file.name}</strong>
                <span>
                  {item.file.type || 'Unknown type'} · {(item.file.size / 1024).toFixed(1)} KB
                </span>
                <progress
                  value={item.progress}
                  max="100"
                  aria-label={`${item.file.name} upload progress`}
                />
                <small className={item.status === 'failed' ? 'field-error' : ''}>
                  {item.error ?? `${item.status} · ${item.progress}%`}
                </small>
              </div>
              <div className="upload-list__actions">
                {(item.status === 'queued' ||
                  item.status === 'failed' ||
                  item.status === 'cancelled') && (
                  <button
                    className="button button--secondary"
                    type="button"
                    onClick={() => upload(item.id)}
                  >
                    {item.status === 'failed' ? 'Retry upload' : 'Upload'}
                  </button>
                )}
                {item.status === 'uploading' && (
                  <button
                    className="button button--secondary"
                    type="button"
                    onClick={() => {
                      window.clearInterval(timers.current.get(item.id));
                      timers.current.delete(item.id);
                      update(item.id, { status: 'cancelled' });
                    }}
                  >
                    Cancel upload
                  </button>
                )}
                <button
                  className="link-button danger"
                  type="button"
                  onClick={() => remove(item.id)}
                >
                  Remove file
                </button>
              </div>
            </article>
          ))}
          {files.every((item) => item.status === 'success') && (
            <p className="alert alert--success" role="status">
              All attachments uploaded to this browser-only demo.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
