import { useEffect, useRef, useState } from 'react';
import { getApplications } from '../api/applicationsApi';
import type { ApplicationSummary } from '../api/applicationsApi';
import KanbanColumn from '../components/kanban/KanbanColumn';
import '../styles/KanbanPage.css';
import { ListFilter, ArrowUpDown } from 'lucide-react';

const stages = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected'];

export default function KanbanPage() {
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [activeStage, setActiveStage] = useState(0);
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getApplications().then(setApplications).catch(console.error);
  }, []);

  const goToStage = (index: number) => {
    const board = boardRef.current;
    const column = board?.children[index] as HTMLElement | undefined;

    if (!board || !column) return;

    setActiveStage(index);

    board.scrollTo({
      left: column.offsetLeft - board.offsetLeft,
      behavior: 'smooth',
    });
  };

  const handleBoardScroll = () => {
    if (window.innerWidth > 600) return;

    const board = boardRef.current;
    if (!board) return;

    const columns = Array.from(board.children) as HTMLElement[];

    const activeIndex = columns.reduce((closest, column, index) => {
      const distance = Math.abs(column.offsetLeft - board.offsetLeft - board.scrollLeft);
      const closestDistance = Math.abs(
        columns[closest].offsetLeft - board.offsetLeft - board.scrollLeft,
      );

      return distance < closestDistance ? index : closest;
    }, 0);

    setActiveStage(activeIndex);
  };

  return (
    <div className="kanban-page">
      <div className="kanban-toolbar">
        <div className="kanban-toolbar-top">
          <div>
            <h1>Jobs</h1>
            <p>Track and manage your job applications</p>
          </div>

          <div className="kanban-toolbar-actions">
            <button type="button">
              <ListFilter size={13} />
              Filter
            </button>

            <button type="button">
              <ArrowUpDown size={13} />
              Sort
            </button>
            <button className="kanban-add-button" type="button">
              + Add Job
            </button>
          </div>
        </div>
      </div>

      <div className="kanban-mobile-tabs">
        {stages.map((stage, index) => (
          <button
            key={stage}
            type="button"
            className={activeStage === index ? 'active' : ''}
            onClick={() => goToStage(index)}
          >
            {stage}
          </button>
        ))}
      </div>

      <div className="kanban-board" ref={boardRef} onScroll={handleBoardScroll}>
        {stages.map((stage) => (
          <KanbanColumn
            key={stage}
            title={stage}
            applications={applications.filter((app) => app.stage === stage.toLowerCase())}
          />
        ))}
      </div>
    </div>
  );
}
