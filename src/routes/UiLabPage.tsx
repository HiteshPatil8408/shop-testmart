import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Modal } from '../components/Modal';
import { useToast } from '../app/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

function Example({
  title,
  skill,
  children,
  onReset,
}: {
  title: string;
  skill: string;
  children: ReactNode;
  onReset: () => void;
}) {
  return (
    <article className="lab-example">
      <header>
        <div>
          <h2>{title}</h2>
          <p>
            <strong>Tests:</strong> {skill}
          </p>
        </div>
        <button className="link-button" type="button" onClick={onReset}>
          Reset example
        </button>
      </header>
      <div className="lab-example__demo">{children}</div>
    </article>
  );
}

export function UiLabPage() {
  useDocumentTitle('Advanced UI laboratory');
  const [resetKey, setResetKey] = useState(0);
  return (
    <div className="page container ui-lab">
      <div className="page-title">
        <div>
          <p className="eyebrow">Isolated component practice</p>
          <h1>UI Laboratory</h1>
          <p>
            Deterministic advanced controls, each with an accessible label, a test purpose, and
            reset.
          </p>
        </div>
        <button
          className="button button--secondary"
          type="button"
          onClick={() => setResetKey((value) => value + 1)}
        >
          Reset entire lab
        </button>
      </div>
      <nav className="lab-index" aria-label="UI Lab component index">
        {[
          'Overlays and menus',
          'Browser interactions',
          'Scrolling and DOM boundaries',
          'Asynchronous states',
        ].map((label) => (
          <a href={`#${label.toLowerCase().replaceAll(' ', '-')}`} key={label}>
            {label}
          </a>
        ))}
      </nav>
      <LabExamples key={resetKey} />
    </div>
  );
}

function LabExamples() {
  const toast = useToast();
  const [tooltip, setTooltip] = useState(false);
  const [popover, setPopover] = useState(false);
  const [menu, setMenu] = useState(false);
  const [submenu, setSubmenu] = useState(false);
  const [tab, setTab] = useState(0);
  const [modal, setModal] = useState(false);
  const [nativeResult, setNativeResult] = useState('No native dialog used yet.');
  const [richText, setRichText] = useState('Edit this deterministic rich-text sample.');
  const [copyState, setCopyState] = useState('Ready to copy.');
  const [contextMenu, setContextMenu] = useState(false);
  const [shortcutCount, setShortcutCount] = useState(0);
  const [infiniteCount, setInfiniteCount] = useState(20);
  const [virtualScroll, setVirtualScroll] = useState(0);
  const [delayed, setDelayed] = useState(false);
  const [delayPending, setDelayPending] = useState(false);
  const [condition, setCondition] = useState(false);
  const [optimistic, setOptimistic] = useState(false);
  const [skeleton, setSkeleton] = useState(false);
  const [emptyItems, setEmptyItems] = useState<string[]>([]);
  const [retry, setRetry] = useState<'idle' | 'error' | 'success'>('idle');
  const [permission, setPermission] = useState(false);
  const [permissionResult, setPermissionResult] = useState('Not requested');
  const openShadow = useRef<HTMLDivElement>(null);
  const closedShadow = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setShortcutCount((value) => value + 1);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (openShadow.current && !openShadow.current.shadowRoot) {
      const root = openShadow.current.attachShadow({ mode: 'open' });
      const button = document.createElement('button');
      button.textContent = 'Open shadow button';
      button.setAttribute('aria-label', 'Open shadow DOM action');
      root.append(button);
    }
    if (closedShadow.current && !closedShadow.current.dataset.ready) {
      const root = closedShadow.current.attachShadow({ mode: 'closed' });
      const button = document.createElement('button');
      button.textContent = 'Closed shadow button';
      button.setAttribute('aria-label', 'Closed shadow DOM action');
      root.append(button);
      closedShadow.current.dataset.ready = 'true';
    }
  }, []);

  const tabKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? 2
          : (tab + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
    setTab(next);
    document.getElementById(`lab-tab-${next}`)?.focus();
  };

  const download = (name: string, contents: string, type: string) => {
    const url = URL.createObjectURL(new Blob([contents], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  };

  const virtualStart = Math.floor(virtualScroll / 40);
  return (
    <>
      <section className="lab-section" id="overlays-and-menus">
        <h2>Overlays and menus</h2>
        <p>Focus, disclosure, keyboard movement, and layered UI.</p>
        <div className="lab-grid">
          <Example
            title="Tooltip"
            skill="hover/focus disclosure and role=tooltip"
            onReset={() => setTooltip(false)}
          >
            <span className="tooltip-demo">
              <button
                type="button"
                aria-describedby="lab-tooltip"
                onMouseEnter={() => setTooltip(true)}
                onMouseLeave={() => setTooltip(false)}
                onFocus={() => setTooltip(true)}
                onBlur={() => setTooltip(false)}
              >
                Focus for help
              </button>
              {tooltip && (
                <span role="tooltip" id="lab-tooltip">
                  Deterministic tooltip text
                </span>
              )}
            </span>
          </Example>
          <Example
            title="Popover"
            skill="expanded state, outside controls, and non-modal focus"
            onReset={() => setPopover(false)}
          >
            <button
              type="button"
              aria-expanded={popover}
              aria-controls="lab-popover"
              onClick={() => setPopover((value) => !value)}
            >
              Toggle account popover
            </button>
            {popover && (
              <div
                className="lab-popover"
                id="lab-popover"
                role="region"
                aria-label="Account popover"
              >
                <a href="#overlays-and-menus">Profile link</a>
                <button type="button" onClick={() => setPopover(false)}>
                  Close
                </button>
              </div>
            )}
          </Example>
          <Example
            title="Nested menu"
            skill="menu expansion and nested action selection"
            onReset={() => {
              setMenu(false);
              setSubmenu(false);
            }}
          >
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={menu}
              onClick={() => setMenu((value) => !value)}
            >
              Open actions menu
            </button>
            {menu && (
              <div className="nested-menu" role="menu">
                <button role="menuitem" type="button">
                  Rename
                </button>
                <button
                  role="menuitem"
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={submenu}
                  onClick={() => setSubmenu((value) => !value)}
                >
                  Share options →
                </button>
                {submenu && (
                  <div role="menu">
                    <button role="menuitem" type="button">
                      Copy private link
                    </button>
                    <button role="menuitem" type="button">
                      Copy public link
                    </button>
                  </div>
                )}
              </div>
            )}
          </Example>
          <Example
            title="Accessible tabs"
            skill="ARIA tab relationships and arrow-key focus"
            onReset={() => setTab(0)}
          >
            <div className="lab-tabs" role="tablist" aria-label="Demo settings">
              {['Overview', 'Activity', 'Settings'].map((label, index) => (
                <button
                  id={`lab-tab-${index}`}
                  role="tab"
                  aria-selected={tab === index}
                  aria-controls={`lab-panel-${index}`}
                  tabIndex={tab === index ? 0 : -1}
                  type="button"
                  key={label}
                  onKeyDown={tabKey}
                  onClick={() => setTab(index)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div role="tabpanel" id={`lab-panel-${tab}`} aria-labelledby={`lab-tab-${tab}`}>
              Panel for {['Overview', 'Activity', 'Settings'][tab]}
            </div>
          </Example>
          <Example
            title="Accordion"
            skill="native details state and heading structure"
            onReset={() =>
              document.querySelectorAll<HTMLDetailsElement>('.lab-accordion').forEach((item) => {
                item.open = false;
              })
            }
          >
            <details className="lab-accordion">
              <summary>Shipping policy</summary>
              <p>This deterministic panel uses native details.</p>
            </details>
            <details className="lab-accordion">
              <summary>Return policy</summary>
              <p>No real return is created.</p>
            </details>
          </Example>
          <Example
            title="Toast stack"
            skill="live regions, stacking, and dismiss controls"
            onReset={() => toast('Toast example reset.', 'info')}
          >
            <div className="button-row">
              <button type="button" onClick={() => toast('Saved successfully.', 'success')}>
                Success toast
              </button>
              <button type="button" onClick={() => toast('A simulated error occurred.', 'error')}>
                Error toast
              </button>
            </div>
          </Example>
          <Example
            title="Reusable modal"
            skill="focus trap, Escape, backdrop, and return focus"
            onReset={() => setModal(false)}
          >
            <button type="button" onClick={() => setModal(true)}>
              Open modal
            </button>
            <Modal
              open={modal}
              title="UI Lab modal"
              onClose={() => setModal(false)}
              actions={
                <button
                  className="button button--primary"
                  type="button"
                  onClick={() => setModal(false)}
                >
                  Complete
                </button>
              }
            >
              <p>Use Tab, Shift+Tab, Escape, and the backdrop.</p>
              <label>
                Focusable field
                <input />
              </label>
            </Modal>
          </Example>
        </div>
      </section>

      <section className="lab-section" id="browser-interactions">
        <h2>Browser interactions</h2>
        <p>Native browser APIs and user-mediated actions.</p>
        <div className="lab-grid">
          <Example
            title="Native alert, confirm, and prompt"
            skill="browser dialog handling"
            onReset={() => setNativeResult('No native dialog used yet.')}
          >
            <div className="button-row">
              <button
                type="button"
                onClick={() => {
                  window.alert('Deterministic native alert');
                  setNativeResult('Alert accepted');
                }}
              >
                Alert
              </button>
              <button
                type="button"
                onClick={() =>
                  setNativeResult(
                    window.confirm('Confirm the demo action?') ? 'Confirmed' : 'Cancelled',
                  )
                }
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() =>
                  setNativeResult(
                    `Prompt result: ${window.prompt('Enter demo text', 'TestMart') ?? 'cancelled'}`,
                  )
                }
              >
                Prompt
              </button>
            </div>
            <p role="status">{nativeResult}</p>
          </Example>
          <Example
            title="Content-editable rich text"
            skill="contenteditable input and accessible naming"
            onReset={() => setRichText('Edit this deterministic rich-text sample.')}
          >
            <div
              className="rich-text"
              role="textbox"
              aria-label="Demo rich text editor"
              aria-multiline="true"
              contentEditable
              suppressContentEditableWarning
              onInput={(event) => setRichText(event.currentTarget.textContent ?? '')}
            >
              {richText}
            </div>
            <p>{richText.length} characters</p>
          </Example>
          <Example
            title="Clipboard copy"
            skill="clipboard permission-free write and status"
            onReset={() => setCopyState('Ready to copy.')}
          >
            <code>TM-LAB-COPY-2026</code>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText('TM-LAB-COPY-2026');
                  setCopyState('Copied to clipboard.');
                } catch {
                  setCopyState('Clipboard unavailable; value remains selectable.');
                }
              }}
            >
              Copy value
            </button>
            <p role="status">{copyState}</p>
          </Example>
          <Example
            title="File download and CSV export"
            skill="download events, filename, MIME type, and CSV content"
            onReset={() => undefined}
          >
            <div className="button-row">
              <button
                type="button"
                onClick={() =>
                  download('testmart-note.txt', 'Deterministic TestMart download\n', 'text/plain')
                }
              >
                Download text file
              </button>
              <button
                type="button"
                onClick={() =>
                  download('testmart-lab.csv', 'id,name\n1,Alpha\n2,Beta\n', 'text/csv')
                }
              >
                Export CSV
              </button>
            </div>
          </Example>
          <Example
            title="Print-friendly view"
            skill="print events and print CSS"
            onReset={() => undefined}
          >
            <p className="print-sample">Only useful content remains prominent in print.</p>
            <button type="button" onClick={() => window.print()}>
              Print this page
            </button>
          </Example>
          <Example
            title="Context menu"
            skill="right-click plus keyboard-accessible alternative"
            onReset={() => setContextMenu(false)}
          >
            <div
              className="context-target"
              tabIndex={0}
              onContextMenu={(event) => {
                event.preventDefault();
                setContextMenu(true);
              }}
            >
              Right-click this target
            </div>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={contextMenu}
              onClick={() => setContextMenu(true)}
            >
              Open context menu
            </button>
            {contextMenu && (
              <div role="menu" className="context-menu">
                <button role="menuitem" type="button" onClick={() => setContextMenu(false)}>
                  Inspect demo item
                </button>
                <button role="menuitem" type="button" onClick={() => setContextMenu(false)}>
                  Duplicate demo item
                </button>
              </div>
            )}
          </Example>
          <Example
            title="Keyboard shortcut"
            skill="Ctrl/Command+K event handling"
            onReset={() => setShortcutCount(0)}
          >
            <p>
              Press <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>K</kbd>.
            </p>
            <p role="status">Shortcut activated {shortcutCount} times.</p>
          </Example>
          <Example
            title="Permission-style prompt"
            skill="permission choice UI without requesting device access"
            onReset={() => {
              setPermission(false);
              setPermissionResult('Not requested');
            }}
          >
            <button type="button" onClick={() => setPermission(true)}>
              Simulate notification permission
            </button>
            <p role="status">{permissionResult}</p>
            <Modal
              open={permission}
              title="Allow demo notifications?"
              onClose={() => setPermission(false)}
              closeOnBackdrop={false}
              actions={
                <>
                  <button
                    className="button button--secondary"
                    type="button"
                    onClick={() => {
                      setPermissionResult('Denied');
                      setPermission(false);
                    }}
                  >
                    Don’t allow
                  </button>
                  <button
                    className="button button--primary"
                    type="button"
                    onClick={() => {
                      setPermissionResult('Allowed in simulation only');
                      setPermission(false);
                    }}
                  >
                    Allow simulation
                  </button>
                </>
              }
            >
              <p>This does not call a browser permission API.</p>
            </Modal>
          </Example>
        </div>
      </section>

      <section className="lab-section" id="scrolling-and-dom-boundaries">
        <h2>Scrolling and DOM boundaries</h2>
        <p>Large collections, frames, and encapsulated DOM.</p>
        <div className="lab-grid">
          <Example
            title="Infinite scrolling"
            skill="incremental rendering and scroll observation"
            onReset={() => setInfiniteCount(20)}
          >
            <div
              className="infinite-list"
              tabIndex={0}
              aria-label="Infinite demo list"
              onScroll={(event) => {
                const node = event.currentTarget;
                if (node.scrollTop + node.clientHeight >= node.scrollHeight - 8)
                  setInfiniteCount((value) => Math.min(60, value + 10));
              }}
            >
              {Array.from({ length: infiniteCount }, (_, index) => (
                <div key={index}>Infinite item {index + 1}</div>
              ))}
            </div>
            <button
              type="button"
              disabled={infiniteCount >= 60}
              onClick={() => setInfiniteCount((value) => Math.min(60, value + 10))}
            >
              Load more items
            </button>
            <p role="status">{infiniteCount} of 60 items loaded.</p>
          </Example>
          <Example
            title="Virtualized list"
            skill="scrolling with a small rendered DOM window"
            onReset={() => setVirtualScroll(0)}
          >
            <div
              className="virtual-list"
              tabIndex={0}
              aria-label="Virtualized demo list"
              onScroll={(event) => setVirtualScroll(event.currentTarget.scrollTop)}
            >
              <div style={{ height: 4000, paddingTop: virtualStart * 40 }}>
                {Array.from({ length: 8 }, (_, offset) => virtualStart + offset)
                  .filter((value) => value < 100)
                  .map((value) => (
                    <div className="virtual-row" style={{ top: value * 40 }} key={value}>
                      Virtual row {value + 1}
                    </div>
                  ))}
              </div>
            </div>
            <p role="status">
              Rows {virtualStart + 1}–{Math.min(virtualStart + 8, 100)} rendered.
            </p>
          </Example>
          <Example
            title="Same-origin iframe"
            skill="frame switching and accessible frame titles"
            onReset={() => undefined}
          >
            <iframe
              title="Same-origin UI Lab frame"
              srcDoc="<!doctype html><html lang='en'><body><button aria-label='Button inside same-origin frame'>Frame action</button><p>Deterministic frame content</p></body></html>"
            />
          </Example>
          <Example
            title="Open and closed Shadow DOM"
            skill="shadow-root strategies and technical boundaries"
            onReset={() => undefined}
          >
            <div
              className="shadow-host"
              ref={openShadow}
              role="group"
              aria-label="Open shadow host"
            />
            <div
              className="shadow-host"
              ref={closedShadow}
              role="group"
              aria-label="Closed shadow host"
            />
            <p>
              The first root is script-accessible; the second intentionally demonstrates a
              closed-root boundary.
            </p>
          </Example>
        </div>
      </section>

      <section className="lab-section" id="asynchronous-states">
        <h2>Asynchronous states</h2>
        <p>Delayed, optimistic, loading, empty, and recovery behavior.</p>
        <div className="lab-grid">
          <Example
            title="Delayed content"
            skill="waiting on observable state"
            onReset={() => {
              setDelayed(false);
              setDelayPending(false);
            }}
          >
            <button
              type="button"
              disabled={delayPending}
              onClick={() => {
                setDelayPending(true);
                window.setTimeout(() => {
                  setDelayed(true);
                  setDelayPending(false);
                }, 800);
              }}
            >
              {delayPending ? 'Waiting…' : 'Reveal delayed content'}
            </button>
            <div aria-live="polite">{delayed && <p>Delayed content is now visible.</p>}</div>
          </Example>
          <Example
            title="Controlled enablement"
            skill="disabled state changing after a prerequisite"
            onReset={() => setCondition(false)}
          >
            <label className="check-row">
              <input
                type="checkbox"
                checked={condition}
                onChange={(event) => setCondition(event.target.checked)}
              />{' '}
              I completed the prerequisite
            </label>
            <button type="button" disabled={!condition}>
              Now enabled
            </button>
          </Example>
          <Example
            title="Optimistic update with undo"
            skill="immediate state, toast-style undo, and rollback"
            onReset={() => setOptimistic(false)}
          >
            <button type="button" aria-pressed={optimistic} onClick={() => setOptimistic(true)}>
              {optimistic ? 'Saved optimistically' : 'Save item'}
            </button>
            {optimistic && (
              <button className="link-button" type="button" onClick={() => setOptimistic(false)}>
                Undo
              </button>
            )}
            <p role="status">{optimistic ? 'Item saved. Undo is available.' : 'Item not saved.'}</p>
          </Example>
          <Example
            title="Skeleton loading"
            skill="busy state and content replacement"
            onReset={() => setSkeleton(false)}
          >
            <button
              type="button"
              onClick={() => {
                setSkeleton(true);
                window.setTimeout(() => setSkeleton(false), 800);
              }}
            >
              Reload card
            </button>
            {skeleton ? (
              <div className="mini-skeleton" role="status" aria-label="Loading card">
                <span className="skeleton" />
                <span className="skeleton" />
              </div>
            ) : (
              <p className="loaded-card">Loaded deterministic card</p>
            )}
          </Example>
          <Example
            title="Empty state"
            skill="zero-result assertion and recovery action"
            onReset={() => setEmptyItems([])}
          >
            {emptyItems.length ? (
              <ul>
                {emptyItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <div className="mini-empty">
                <strong>No saved items</strong>
                <p>Add a fixture to leave the empty state.</p>
              </div>
            )}
            <button type="button" onClick={() => setEmptyItems(['Fixture Alpha'])}>
              Add fixture
            </button>
          </Example>
          <Example
            title="Retry state"
            skill="first failure, explicit retry, and successful recovery"
            onReset={() => setRetry('idle')}
          >
            {retry === 'error' && (
              <div className="alert alert--error" role="alert">
                Deterministic first attempt failed.
              </div>
            )}
            {retry === 'success' && (
              <div className="alert alert--success" role="status">
                Retry succeeded.
              </div>
            )}
            <button
              type="button"
              onClick={() => setRetry((value) => (value === 'error' ? 'success' : 'error'))}
            >
              {retry === 'error' ? 'Retry request' : 'Run failing request'}
            </button>
          </Example>
        </div>
      </section>
    </>
  );
}
