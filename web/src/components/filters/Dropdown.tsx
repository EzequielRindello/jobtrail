import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

import '../../styles/Filters.css';

interface DropdownProps {
  label: string;
  icon?: React.ReactNode;
  // A number on the button, for example how many filters inside are active.
  badge?: number;
  // Opens the menu from the right edge of the button (for buttons near the right side).
  alignRight?: boolean;
  // A function child gets `close`, for menus that close after a choice (like Sort).
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
}

// A button that opens a small floating menu under it. It closes with a click outside or Esc.
export default function Dropdown({ label, icon, badge, alignRight, children }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointer(event: PointerEvent) {
      if (root.current && !root.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="dropdown" ref={root}>
      <button
        type="button"
        className="dropdown-toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {icon}
        {label}
        {badge ? <span className="dropdown-badge">{badge}</span> : null}
        <ChevronDown size={13} aria-hidden="true" />
      </button>

      {open && (
        <div className={alignRight ? 'dropdown-menu dropdown-menu-right' : 'dropdown-menu'}>
          {typeof children === 'function' ? children(close) : children}
        </div>
      )}
    </div>
  );
}
