import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';

// Placeholder until the statistics (#40) live here. Adding, searching and exporting
// applications happen on the board.
export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" subtitle="An overview of your job search" />
      <p>
        Your applications are on the <Link to="/kanban">Kanban</Link>.
      </p>
    </>
  );
}
