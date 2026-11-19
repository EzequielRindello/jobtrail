import JobCard from './JobCard';
import type { ApplicationSummary } from '../../api/applicationsApi';

type KanbanColumnProps = {
  title: string;
  applications: ApplicationSummary[];
};

export default function KanbanColumn({ title, applications }: KanbanColumnProps) {
  return (
    <div className="kanban-column">
      <h2>
        {title}: <span className="kanban-count">{applications.length}</span>
      </h2>

      {applications.map((app) => (
        <JobCard
          key={app.id}
          title={app.title}
          company={app.company}
          location={app.location}
          appliedOn={app.appliedOn}
          stage={app.stage}
        />
      ))}
    </div>
  );
}
