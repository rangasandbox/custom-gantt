export interface Task {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  hideChildren: boolean;
  displayOrder: number;
  parentId?: string;
  children?: Task[];
  dependencies?: string[];
  depth?: number;
  hasChildren?: boolean;
  childrenIds?: string[];
}

export interface GanttChartProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, newStart: Date, newEnd: Date) => void;
  updateTaskById: (taskId: string, updatedProperties: Partial<Task>) => void;
  updateFullTasks: (newTasks: Task[]) => void;
  removeTaskById: (taskId: string) => void;
  findTaskById: (tasks: Task[], id: string) => Task | undefined;
  reorderTasks: (taskId: string, newParentId: string) => void;
  getMonths: (tasks: Task[], monthTimeLineDiff: number) => any[];
  findHiddenTasks: (tasks: Task[], hiddenTasksSet: Set<string>) => void;
  addNewTaskToParent: (newTask: Task, parentId: string) => void;
}

export interface DraggableTaskRowProps {
  task: Task;
  index: number;
  level: number;
  renderTasks: (tasks: Task[], level: number) => React.ReactNode;
  hiddenTasks: Set<string>;
  handleToggleChildren: (taskId: string) => void;
}

export interface DragItem {
  id: string;
  index: number;
  parentId?: string;
  hasChildren: boolean;
}
