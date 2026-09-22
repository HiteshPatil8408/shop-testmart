import { useEffect, useId, useMemo, useRef, useState } from 'react';

const DAY = 86_400_000;
const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function isoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseIso(value: string) {
  const [year, month, date] = value.split('-').map(Number);
  return new Date(year, month - 1, date);
}

function unavailable(date: Date, minimum: Date) {
  const offset = Math.round((startOfDay(date).getTime() - minimum.getTime()) / DAY);
  return date.getDay() === 0 || offset === 4 || offset === 11;
}

export function firstAvailableDeliveryDate() {
  const minimum = addDays(startOfDay(new Date()), 2);
  for (let offset = 0; offset < 31; offset += 1) {
    const candidate = addDays(minimum, offset);
    if (!unavailable(candidate, minimum)) return isoDate(candidate);
  }
  return isoDate(minimum);
}

export function DeliveryScheduler({
  date,
  timeSlot,
  onDateChange,
  onTimeSlotChange,
  simulatedUnavailableSlot = false,
}: {
  date: string;
  timeSlot: string;
  onDateChange: (date: string) => void;
  onTimeSlotChange: (slot: string) => void;
  simulatedUnavailableSlot?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const minimum = useMemo(() => addDays(startOfDay(new Date()), 2), []);
  const maximum = useMemo(() => addDays(minimum, 30), [minimum]);
  const selected = date ? parseIso(date) : minimum;
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(selected.getFullYear(), selected.getMonth(), 1),
  );
  const [focusedDate, setFocusedDate] = useState(date || firstAvailableDeliveryDate());
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const gridId = useId();

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (
        !popoverRef.current?.contains(event.target as Node) &&
        !triggerRef.current?.contains(event.target as Node)
      )
        setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document.querySelector<HTMLButtonElement>(`[data-calendar-date="${focusedDate}"]`)?.focus();
  }, [focusedDate, open, visibleMonth]);

  const monthStartOffset = (visibleMonth.getDay() + 6) % 7;
  const dates = Array.from({ length: 42 }, (_, index) =>
    addDays(visibleMonth, index - monthStartOffset),
  );
  const moveFocus = (days: number) => {
    const next = addDays(parseIso(focusedDate), days);
    if (next < minimum || next > maximum) return;
    setFocusedDate(isoDate(next));
    setVisibleMonth(new Date(next.getFullYear(), next.getMonth(), 1));
  };
  const format = (value: string) =>
    new Intl.DateTimeFormat('en-IN', { dateStyle: 'full' }).format(parseIso(value));
  const slots = [
    ['09:00-12:00', '9:00 AM – 12:00 PM'],
    ['12:00-15:00', '12:00 PM – 3:00 PM'],
    ['15:00-18:00', '3:00 PM – 6:00 PM'],
  ];

  return (
    <section className="delivery-scheduler" aria-labelledby={`${gridId}-heading`}>
      <h2 id={`${gridId}-heading`}>Delivery date and time</h2>
      <p>Choose an available date from 2 to 32 days ahead.</p>
      <div className="calendar-field">
        <span id={`${gridId}-label`}>Delivery date</span>
        <button
          ref={triggerRef}
          className="calendar-trigger"
          type="button"
          aria-labelledby={`${gridId}-label`}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {date ? format(date) : 'Choose a delivery date'} <span aria-hidden="true">▾</span>
        </button>
        {open && (
          <div
            className="calendar-popover"
            role="dialog"
            aria-modal="false"
            aria-label="Choose delivery date"
            ref={popoverRef}
          >
            <div className="calendar-popover__header">
              <button
                type="button"
                aria-label="Previous month"
                disabled={
                  visibleMonth.getFullYear() === minimum.getFullYear() &&
                  visibleMonth.getMonth() === minimum.getMonth()
                }
                onClick={() =>
                  setVisibleMonth(
                    new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1),
                  )
                }
              >
                ←
              </button>
              <strong aria-live="polite">
                {new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(
                  visibleMonth,
                )}
              </strong>
              <button
                type="button"
                aria-label="Next month"
                disabled={
                  visibleMonth.getFullYear() === maximum.getFullYear() &&
                  visibleMonth.getMonth() === maximum.getMonth()
                }
                onClick={() =>
                  setVisibleMonth(
                    new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1),
                  )
                }
              >
                →
              </button>
            </div>
            <div className="calendar-grid" role="grid" aria-label="Delivery dates">
              {weekdayLabels.map((day) => (
                <span className="calendar-grid__weekday" role="columnheader" key={day}>
                  {day}
                </span>
              ))}
              {dates.map((candidate) => {
                const value = isoDate(candidate);
                const outside = candidate.getMonth() !== visibleMonth.getMonth();
                const disabled =
                  candidate < minimum || candidate > maximum || unavailable(candidate, minimum);
                return (
                  <button
                    type="button"
                    role="gridcell"
                    data-calendar-date={value}
                    aria-label={format(value)}
                    aria-selected={date === value}
                    className={outside ? 'is-outside' : ''}
                    disabled={disabled}
                    tabIndex={focusedDate === value ? 0 : -1}
                    key={value}
                    onFocus={() => setFocusedDate(value)}
                    onClick={() => {
                      onDateChange(value);
                      setFocusedDate(value);
                      setOpen(false);
                      triggerRef.current?.focus();
                    }}
                    onKeyDown={(event) => {
                      const moves: Record<string, number> = {
                        ArrowLeft: -1,
                        ArrowRight: 1,
                        ArrowUp: -7,
                        ArrowDown: 7,
                        PageUp: -30,
                        PageDown: 30,
                      };
                      if (moves[event.key]) {
                        event.preventDefault();
                        moveFocus(moves[event.key]);
                      }
                      if (event.key === 'Home') {
                        event.preventDefault();
                        moveFocus(-((parseIso(focusedDate).getDay() + 6) % 7));
                      }
                      if (event.key === 'End') {
                        event.preventDefault();
                        moveFocus(6 - ((parseIso(focusedDate).getDay() + 6) % 7));
                      }
                    }}
                  >
                    {candidate.getDate()}
                  </button>
                );
              })}
            </div>
            <p className="calendar-help">
              Arrow keys move by day or week. Page Up/Down changes month.
            </p>
          </div>
        )}
      </div>
      <fieldset className="time-slots">
        <legend>Delivery time slot</legend>
        {slots.map(([value, label]) => {
          const disabled =
            value === '15:00-18:00' || (simulatedUnavailableSlot && value === '12:00-15:00');
          return (
            <label key={value}>
              <input
                type="radio"
                name="delivery-time"
                value={value}
                checked={timeSlot === value}
                disabled={disabled}
                onChange={() => onTimeSlotChange(value)}
              />
              <span>{label}</span>
              <small>{disabled ? 'Unavailable' : 'Available'}</small>
            </label>
          );
        })}
      </fieldset>
      <p className="sr-only" aria-live="polite">
        {date && timeSlot ? `Delivery scheduled for ${format(date)}, ${timeSlot}.` : ''}
      </p>
    </section>
  );
}
