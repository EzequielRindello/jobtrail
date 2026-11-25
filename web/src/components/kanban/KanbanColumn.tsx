import { useDroppable } from '@dnd-kit/core';
import JobCard from './JobCard';
import type { ApplicationSummary } from '../../api/applicationsApi';
import type { ApplicationStage } from '../../api/applicationTypes';

type KanbanColumnProps = {
  stage: string;
  title: string;
  applications: ApplicationSummary[];
  onMove: (id: string, stage: ApplicationStage) => void;
};

export default function KanbanColumn({ stage, title, applications, onMove }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div ref={setNodeRef} className={`kanban-column ${isOver ? 'kanban-column-over' : ''}`}>
      <h2>
        {title}: <span className="kanban-count">{applications.length}</span>
      </h2>

      {applications.map((app) => (
        <JobCard
          key={app.id}
          id={app.id}
          title={app.title}
          company={app.company}
          appliedOn={app.appliedOn}
          createdAt={app.createdAt}
          stage={app.stage}
          onMove={onMove}
        />
      ))}
    </div>
  );
}
