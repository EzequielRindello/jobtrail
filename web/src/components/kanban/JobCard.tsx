import { ChevronRight } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { STAGES, type ApplicationStage } from '../../api/applicationTypes';

type JobCardProps = {
  id: string;
  title: string;
  company: string;
  location?: string | null;
  appliedOn?: string | null;
  stage: string;
  onMove: (id: string, stage: ApplicationStage) => void;
};

export default function JobCard({
  id,
  title,
  company,
  location,
  appliedOn,
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
      <p className="job-card-company">{company}</p>

      <h3>{title}</h3>

      {location && (
        <div className="job-card-tags">
          <span className="job-card-tag">{location}</span>
        </div>
      )}

      <small className="job-card-date">{appliedOn ? `Applied ${appliedOn}` : stage}</small>
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
  );
}
