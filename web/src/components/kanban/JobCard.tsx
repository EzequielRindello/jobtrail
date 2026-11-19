import { ChevronRight } from 'lucide-react';

type JobCardProps = {
  title: string;
  company: string;
  location?: string | null;
  appliedOn?: string | null;
  stage: string;
};

export default function JobCard({ title, company, location, appliedOn, stage }: JobCardProps) {
  return (
    <div className="job-card">
      <p className="job-card-company">{company}</p>

      <h3>{title}</h3>

      {location && (
        <div className="job-card-tags">
          <span className="job-card-tag">{location}</span>
        </div>
      )}

      <small className="job-card-date">{appliedOn ? `Applied ${appliedOn}` : stage}</small>
      <button type="button" className="job-card-move">
        Move to <ChevronRight size={13} strokeWidth={2} />
      </button>
    </div>
  );
}
