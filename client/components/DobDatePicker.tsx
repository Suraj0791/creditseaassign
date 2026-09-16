'use client';

import { useState, useRef, useEffect, useMemo } from 'react';

interface DobDatePickerProps {
  value: string; // Format: 'YYYY-MM-DD'
  onChange: (date: string) => void;
  required?: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function DobDatePicker({ value, onChange, required }: DobDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value or calculate default view
  const currentYear = new Date().getFullYear();
  const defaultYear = currentYear - 25; // Sensible default for loan applicants (~25 yrs old)

  const parsed = useMemo(() => {
    if (!value) return null;
    const parts = value.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return { year: parts[0], month: parts[1] - 1, day: parts[2] };
    }
    return null;
  }, [value]);

  const [viewYear, setViewYear] = useState<number>(parsed ? parsed.year : defaultYear);
  const [viewMonth, setViewMonth] = useState<number>(parsed ? parsed.month : 0);

  // When value changes from outside, sync view if open
  useEffect(() => {
    if (parsed) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
    }
  }, [parsed]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Year options (from currentYear - 65 down to currentYear - 18)
  const years = useMemo(() => {
    const list: number[] = [];
    const minYear = currentYear - 65;
    const maxYear = currentYear - 18;
    for (let y = maxYear; y >= minYear; y--) {
      list.push(y);
    }
    return list;
  }, [currentYear]);

  // Calculate age from value
  const age = useMemo(() => {
    if (!parsed) return null;
    const today = new Date();
    let calculated = today.getFullYear() - parsed.year;
    const m = today.getMonth() - parsed.month;
    if (m < 0 || (m === 0 && today.getDate() < parsed.day)) {
      calculated--;
    }
    return calculated;
  }, [parsed]);

  const isEligibleAge = age !== null && age >= 23 && age <= 50;

  // Generate calendar grid
  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: { day: number; monthOffset: number; isCurrentMonth: boolean; dateStr: string }[] = [];

    // Previous month filler days
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({ day, monthOffset: -1, isCurrentMonth: false, dateStr });
    }

    // Current month days
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({ day, monthOffset: 0, isCurrentMonth: true, dateStr });
    }

    // Next month filler days to complete grid (up to multiple of 7)
    const totalCells = Math.ceil(cells.length / 7) * 7;
    const remaining = totalCells - cells.length;
    for (let day = 1; day <= remaining; day++) {
      const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({ day, monthOffset: 1, isCurrentMonth: false, dateStr });
    }

    return cells;
  }, [viewYear, viewMonth]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const selectDate = (dateStr: string) => {
    onChange(dateStr);
    setIsOpen(false);
  };

  const formattedDisplay = useMemo(() => {
    if (!parsed) return '';
    const dateObj = new Date(parsed.year, parsed.month, parsed.day);
    return dateObj.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [parsed]);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input Trigger */}
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-all duration-200 select-none"
        style={{
          border: isOpen ? '1px solid var(--accent)' : '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-primary)',
          boxShadow: isOpen ? '0 0 0 3px rgba(13, 148, 136, 0.12)' : 'none',
        }}
      >
        <div className="flex items-center gap-2.5">
          {/* Calendar SVG Icon */}
          <svg
            className="w-4 h-4"
            style={{ color: value ? 'var(--accent)' : 'var(--text-muted)' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span style={{ color: value ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {formattedDisplay || 'Select date of birth (DD/MM/YYYY)'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-1 rounded hover:bg-gray-200 text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
              title="Clear date"
            >
              ✕
            </button>
          )}
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {isOpen ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {/* Live Eligibility / Age Feedback Badge */}
      {age !== null && (
        <div className="flex items-center gap-2 mt-1.5 px-0.5">
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium"
            style={{
              backgroundColor: isEligibleAge ? 'var(--success-light)' : 'var(--warning-light)',
              color: isEligibleAge ? 'var(--success)' : 'var(--warning)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isEligibleAge ? 'var(--success)' : 'var(--warning)' }} />
            Age: {age} years {isEligibleAge ? '· Eligible (23-50)' : '· Ineligible (Must be 23-50)'}
          </span>
        </div>
      )}

      {/* Hidden input for HTML form validation */}
      {required && (
        <input
          type="text"
          value={value}
          required
          onChange={() => {}}
          className="sr-only"
          tabIndex={-1}
        />
      )}

      {/* Calendar Popover */}
      {isOpen && (
        <div
          className="absolute left-0 top-full mt-2 w-full max-w-xs z-50 rounded-xl p-4 shadow-xl select-none"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.12), 0 4px 10px -2px rgba(0, 0, 0, 0.05)',
          }}
        >
          {/* Header Controls: Month + Year Selectors & Nav */}
          <div className="flex items-center justify-between gap-1 mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              title="Previous Month"
            >
              ‹
            </button>

            <div className="flex items-center gap-1.5">
              {/* Month Dropdown */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="px-2 py-1 rounded-md text-xs font-semibold cursor-pointer appearance-none"
                style={{
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                }}
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx}>
                    {name}
                  </option>
                ))}
              </select>

              {/* Year Dropdown */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="px-2 py-1 rounded-md text-xs font-semibold cursor-pointer appearance-none"
                style={{
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                }}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              title="Next Month"
            >
              ›
            </button>
          </div>

          {/* Quick Age Guidance Hint */}
          <div
            className="mb-2.5 px-2 py-1 rounded text-center text-xs"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-muted)',
            }}
          >
            Borrower age must be between 23 & 50 years
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {SHORT_DAYS.map((day) => (
              <div
                key={day}
                className="text-xs font-medium py-1"
                style={{ color: 'var(--text-muted)' }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarCells.map((cell, idx) => {
              const isSelected = value === cell.dateStr;

              return (
                <button
                  key={`${cell.dateStr}-${idx}`}
                  type="button"
                  onClick={() => selectDate(cell.dateStr)}
                  className="w-8 h-8 mx-auto flex items-center justify-center rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer"
                  style={{
                    backgroundColor: isSelected ? 'var(--accent)' : 'transparent',
                    color: isSelected
                      ? '#ffffff'
                      : cell.isCurrentMonth
                      ? 'var(--text-primary)'
                      : 'var(--text-muted)',
                    fontWeight: isSelected ? 600 : cell.isCurrentMonth ? 500 : 400,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'var(--accent-light)';
                      e.currentTarget.style.color = 'var(--accent)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = cell.isCurrentMonth
                        ? 'var(--text-primary)'
                        : 'var(--text-muted)';
                    }
                  }}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {/* Quick Year Range Shortcuts */}
          <div className="mt-3 pt-2.5 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Jump to:</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setViewYear(2000);
                  setViewMonth(0);
                }}
                className="px-2 py-0.5 rounded text-xs hover:bg-gray-100 cursor-pointer"
                style={{ color: 'var(--accent)', border: '1px solid var(--border-color)' }}
              >
                2000
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewYear(1995);
                  setViewMonth(0);
                }}
                className="px-2 py-0.5 rounded text-xs hover:bg-gray-100 cursor-pointer"
                style={{ color: 'var(--accent)', border: '1px solid var(--border-color)' }}
              >
                1995
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewYear(1990);
                  setViewMonth(0);
                }}
                className="px-2 py-0.5 rounded text-xs hover:bg-gray-100 cursor-pointer"
                style={{ color: 'var(--accent)', border: '1px solid var(--border-color)' }}
              >
                1990
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
