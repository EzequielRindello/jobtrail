import { ChevronRight } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { STAGES, type ApplicationStage } from '../../api/applicationTypes';

// "Nov 10": short, in the user's language.
function formatDay(date: Date) {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// appliedOn is a plain "yyyy-mm-dd" day; new Date() would read it as UTC midnight and could
// show the day before, so it is built as a local date.
function fromDateOnly(day: string) {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date);
}

type JobCardProps = {
  id: string;
  title: string;
  company: string;
  appliedOn?: string | null;
  createdAt: string;
  stage: string;
  onMove: (id: string, stage: ApplicationStage) => void;
};

export default function JobCard({
  id,
  title,
  company,
  appliedOn,
  createdAt,
  stage,
  onMove,
}: JobCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const [showStages, setShowStages] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showStages) return;

    const closeOtherMenus = (event: Event) => {
      if ((event as CustomEvent).detail !== id) {
        setShowStages(false);
      }
    };

    window.addEventListener('job-card-menu-open', closeOtherMenus);
    return () => window.removeEventListener('job-card-menu-open', closeOtherMenus);
  }, [showStages, id]);

  useEffect(() => {
    if (!showStages) return;

    const handleOutsideClick = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setShowStages(false);
      }
    };

    document.addEventListener('pointerdown', handleOutsideClick);

    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
    };
  }, [showStages]);

  const dragStyle: CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      className={`job-card ${isDragging ? 'job-card-dragging' : ''}`}
      style={dragStyle}
      {...listeners}
      {...attributes}
    >
      {/* Only what is needed to recognize the job; the rest is on the details page. */}
      <div className="job-card-header">
        <span className="job-card-avatar" aria-hidden="true">
          {company.trim().charAt(0).toUpperCase()}
        </span>
        <div className="job-card-heading">
          {/* The title opens the details page. Stopping pointerdown keeps it from starting a drag. */}
          <h3>
            <Link
              to={`/applications/${id}`}
              className="job-card-link"
              onPointerDown={(event) => event.stopPropagation()}
            >
              {title}
            </Link>
          </h3>
          <p className="job-card-company">{company}</p>
        </div>
      </div>

      <div className="job-card-footer">
        <small className="job-card-date">
          {appliedOn
            ? `Applied ${formatDay(fromDateOnly(appliedOn))}`
            : `Saved ${formatDay(new Date(createdAt))}`}
        </small>
        <div className="job-card-move-container" ref={menuRef}>
          <button
            type="button"
            className="job-card-move"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => {
              if (!showStages) {
                window.dispatchEvent(new CustomEvent('job-card-menu-open', { detail: id }));
              }
              setShowStages(!showStages);
            }}
          >
            Move to <ChevronRight size={14} strokeWidth={2} />
          </button>

          {showStages && (
            <div className="job-card-stage-options">
              {STAGES.filter((option) => option !== stage).map((option) => (
                <button
                  key={option}
                  type="button"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => {
                    onMove(id, option);
                    setShowStages(false);
                  }}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
