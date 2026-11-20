import '../styles/PageHeader.css';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  // Buttons on the right of the title (for example "+ Add skill").
  actions?: React.ReactNode;
}

// The title block at the top of every page, so all titles have the same size and spacing as
// the board's "Jobs" header.
export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}
