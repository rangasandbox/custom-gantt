import React, { useState, useRef, useEffect, useCallback } from "react";
import moment from "moment";
import { useDrag, useDrop } from "react-dnd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Task,
  GanttChartProps,
  DraggableTaskRowProps,
  DragItem
} from "../../type";
import "./header.css";
import "./CustomGanttChart.css";
import { faWandSparkles } from "@fortawesome/free-solid-svg-icons";
import { processSchedule } from "../../api";

const CustomGanttChart: React.FC<GanttChartProps> = ({
  tasks,
  onTaskUpdate,
  updateTaskById,
  updateFullTasks,
  removeTaskById,
  findTaskById,
  reorderTasks,
  getMonths,
  findHiddenTasks,
  addNewTaskToParent
}) => {
  const [filter, setFilter] = useState("");
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
  const [hiddenTasks, setHiddenTasks] = useState<Set<string>>(new Set());
  const [question, setQuestion] = useState("");
  const [aiResponse, setAIResponse] = useState<{ error: string } | null>(null);

  const taskCoordinatesRef = useRef<
    Record<string, { left: number; top: number; width: number; height: number }>
  >({});
  const ganttRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    taskId: string | null;
    type: "move" | "resize-left" | "resize-right" | null;
    startX: number;
    originalLeft: number;
    originalWidth: number;
    originalStart: Date;
    originalEnd: Date;
    originalIndex: number;
    parentId: string | null;
  } | null>(null);

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const storeCoordinates = (taskId: string, ref: HTMLDivElement | null) => {
    if (ref) {
      const rect = ref.getBoundingClientRect();
      taskCoordinatesRef.current[taskId] = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      };
    }
  };

  useEffect(() => {
    // You can use taskCoordinatesRef.current to get the coordinates of all tasks
    console.log("Task Coordinates:", taskCoordinatesRef.current);
  }, []);

  const handleToggleChildren = (taskId: string) => {
    setHiddenTasks((prevHidden) => {
      const newHidden = new Set(prevHidden);
      if (newHidden.has(taskId)) {
        newHidden.delete(taskId);
        updateTaskById(taskId, { hideChildren: false });
      } else {
        newHidden.add(taskId);
        updateTaskById(taskId, { hideChildren: true });
      }
      return newHidden;
    });
  };

  useEffect(() => {
    const hiddenTasksSet = new Set<string>();
    findHiddenTasks(tasks, hiddenTasksSet);
    setHiddenTasks(hiddenTasksSet);
  }, [tasks]);

  const filterTasks = (tasks: Task[]): Task[] => {
    return tasks
      .filter((task) => {
        const matchesFilter = task.name
          .toLowerCase()
          .includes(filter.toLowerCase());
        const hasMatchingChildren =
          task.children && filterTasks(task.children).length > 0;
        return matchesFilter || hasMatchingChildren;
      })
      .map((task) => ({
        ...task,
        children: task.children ? filterTasks(task.children) : undefined
      }));
  };

  const filteredTasks = filterTasks(tasks);

  const startDate = moment(
    Math.min(
      ...tasks
        .flatMap(flattenTask)
        .map((task) => task.start?.getTime())
        .filter((time) => time !== undefined)
    )
  );

  const endDate = moment(
    Math.max(
      ...tasks
        .flatMap(flattenTask)
        .map((task) => task.end?.getTime())
        .filter((time) => time !== undefined)
    )
  );

  const monthTimeLineDiff = 1;
  // const timelineStartDate = moment(filteredTasks[0].start)
  //   .subtract(monthTimeLineDiff, "months")
  //   .date(1);

  const validTasks = tasks
    .flatMap(flattenTask)
    .filter((task) => task.start && task.end);

  const firstValidTaskStart =
    validTasks.length > 0 ? validTasks[0].start : tasks[0].start;

  const timelineStartDate = moment(firstValidTaskStart)
    .subtract(monthTimeLineDiff, "months")
    .date(1);

  const months = getMonths(filteredTasks, monthTimeLineDiff);
  const monthWidthPx = 100; // Width of each month header in pixels

  useEffect(() => {
    const syncScroll = (e: Event) => {
      if (ganttRef.current && tableRef.current) {
        tableRef.current.scrollTop = ganttRef.current.scrollTop;
        tableRef.current.scrollLeft = ganttRef.current.scrollLeft;
      }
    };

    const handleScroll = (e: Event) => {
      if (tableRef.current && ganttRef.current) {
        ganttRef.current.scrollTop = tableRef.current.scrollTop;
        tableRef.current.scrollLeft = ganttRef.current.scrollLeft;
      }
    };

    const gantt = ganttRef.current;
    const table = tableRef.current;

    if (gantt) {
      gantt.addEventListener("scroll", syncScroll);
    }
    if (table) {
      table.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (gantt) {
        gantt.removeEventListener("scroll", syncScroll);
      }
      if (table) {
        table.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  const handleMouseDownResize = (
    e: React.MouseEvent,
    task: Task,
    resizeType: "resize-left" | "resize-right"
  ) => {
    setDragState({
      taskId: task.id,
      type: resizeType,
      startX: e.clientX,
      originalLeft: e.currentTarget.getBoundingClientRect().left,
      originalWidth: e.currentTarget.clientWidth,
      originalStart: task.start,
      originalEnd: task.end,
      originalIndex: -1,
      parentId: task.parentId || null
    });
    setDraggedTaskId(task.id);
  };

  const handleMouseDownMove = (e: React.MouseEvent, task: Task) => {
    setDragState({
      taskId: task.id,
      type: "move",
      startX: e.clientX,
      originalLeft: e.currentTarget.getBoundingClientRect().left,
      originalWidth: e.currentTarget.clientWidth,
      originalStart: task.start,
      originalEnd: task.end,
      originalIndex: -1,
      parentId: task.parentId || null
    });
    setDraggedTaskId(task.id);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragState) return;

    const {
      startX,
      type,
      originalStart,
      originalEnd,
      originalIndex,
      parentId
    } = dragState;
    const deltaX = e.clientX - startX;
    const totalDays = endDate.diff(startDate, "days");
    const dayWidth = ganttRef.current?.clientWidth
      ? ganttRef.current.clientWidth / totalDays
      : 0;

    if (dayWidth) {
      if (type === "resize-left") {
        const newStart = moment(originalStart)
          .add(deltaX / dayWidth, "days")
          .toDate();
        onTaskUpdate(dragState.taskId!, newStart, originalEnd);
      } else if (type === "resize-right") {
        const newEnd = moment(originalEnd)
          .add(deltaX / dayWidth, "days")
          .toDate();
        onTaskUpdate(dragState.taskId!, originalStart, newEnd);
      } else if (type === "move") {
        const newStart = moment(originalStart)
          .add(deltaX / dayWidth, "days")
          .toDate();
        const newEnd = moment(originalEnd)
          .add(deltaX / dayWidth, "days")
          .toDate();
        onTaskUpdate(dragState.taskId!, newStart, newEnd);
      }
    }
  };

  const handleMouseUp = () => {
    setDragState(null);
    setDraggedTaskId(null);
  };

  useEffect(() => {
    if (dragState) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("dragstart", (e) => e.preventDefault());
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("dragstart", (e) => e.preventDefault());
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("dragstart", (e) => e.preventDefault());
    };
  }, [dragState]);

  const DraggableTaskRow: React.FC<DraggableTaskRowProps> = ({
    task,
    index,
    level,
    renderTasks,
    hiddenTasks,
    handleToggleChildren
  }) => {
    const [, drag] = useDrag<DragItem, unknown, { isDragging: boolean }>({
      type: "TASK",
      item: {
        id: task.id,
        index,
        parentId: task.parentId,
        hasChildren: !!task.children
      }
    });

    const [, drop] = useDrop<DragItem, unknown, unknown>({
      accept: "TASK",
      drop: (draggedItem) => {
        if (draggedItem.id !== task.id) {
          // moveTask(draggedItem.id, task.id);
          reorderTasks(draggedItem.id, task.id);
          draggedItem.index = index;
        }
      }
    });

    return (
      <>
        <tr ref={(node) => drag(drop(node))}>
          {/* <td>{level}</td> */}
          <td>{task.id}</td>
          <td>
            <div
              className="flex items-center task-container"
              style={{
                paddingLeft: `${level * 20}px`,
                fontWeight: (task.children?.length ?? 0) > 0 ? "bold" : "normal"
              }}
            >
              {(task.children?.length ?? 0) > 0 && (
                <span
                  className="mr-2 cursor-pointer toggle-children"
                  onClick={() => handleToggleChildren(task.id)}
                >
                  {hiddenTasks.has(task.id) ? "+" : "−"}
                </span>
              )}
              <div className="task-name">{task.name}</div>
            </div>
          </td>
          <td>{moment(task.start).format("DD MMMM YYYY")}</td>
          <td>{moment(task.end).format("DD MMMM YYYY")}</td>
          <td>
            <div
              className="progress-bar"
              style={{
                width: `${task.progress}%`,
                backgroundColor: task.progress >= 50 ? "green" : "brown",
                height: "60%"
              }}
            ></div>
          </td>
          <td>{task.parentId || "-"}</td>
        </tr>
        {!hiddenTasks.has(task.id) &&
          task.children &&
          renderTasks(task.children, level + 1)}
      </>
    );
  };

  const renderTasks = (tasks: Task[], level = 0) => {
    return tasks.map((task, index) => (
      <DraggableTaskRow
        key={task.id}
        task={task}
        index={index}
        level={level}
        renderTasks={renderTasks}
        hiddenTasks={hiddenTasks}
        handleToggleChildren={handleToggleChildren}
      />
    ));
  };

  const getTaskStyle = useCallback(
    (task: Task, timelineStartDate: moment.Moment, monthWidthInPX: number) => {
      const start = moment(task.start);
      const end = moment(task.end);

      const taskStart = start.diff(timelineStartDate, "days");
      const taskDurationDays = end.diff(start, "days");

      const daysInMonth = 30; // Assume 30 days in a month for this calculation
      const dayWidthInPX = monthWidthInPX / daysInMonth;

      const left = taskStart * dayWidthInPX;
      const width = taskDurationDays * dayWidthInPX;

      return {
        left: `${left}px`,
        width:
          task.start.getTime() === task.end.getTime() ? "auto" : `${width}px`
      };
    },
    [startDate, endDate]
  );

  const getPhaseStyle = useCallback(
    (task: Task, timelineStartDate: moment.Moment, monthWidthInPX: number) => {
      const childTasks = flattenTask(task);
      const start = moment(
        Math.min(...childTasks.map((t) => t.start.getTime()))
      );
      const end = moment(Math.max(...childTasks.map((t) => t.end.getTime())));

      const totalDays = endDate.diff(startDate, "days");
      const taskStart = start.diff(timelineStartDate, "days");
      const taskDurationDays = end.diff(start, "days");

      const daysInMonth = 30; // Assume 30 days in a month for this calculation
      const dayWidthInPX = monthWidthInPX / daysInMonth;

      const left = taskStart * dayWidthInPX;
      const width = taskDurationDays * dayWidthInPX;

      return {
        left: `${left}px`,
        width: `${width}px`
      };
    },
    [startDate, endDate]
  );

  const renderTaskBars = (
    tasks: Task[],
    timelineStartDate: moment.Moment,
    width = 100,
    level = 0
  ) => {
    return tasks.map((task) => (
      <React.Fragment key={task.id}>
        <div className="task-row ">
          {task.start.getTime() === task.end.getTime() ? (
            <div
              className="milestone"
              style={{
                ...getTaskStyle(task, timelineStartDate, width),
                width: "14px",
                height: "14px"
              }}
              ref={(ref) => storeCoordinates(task.id, ref)}
              onMouseDown={(e) => handleMouseDownMove(e, task)}
            ></div>
          ) : task.children && task.children.length > 0 ? (
            <div
              className="phase-bar"
              style={getPhaseStyle(task, timelineStartDate, width)}
              ref={(ref) => storeCoordinates(task.id, ref)}
            ></div>
          ) : (
            <div
              className="task-bar"
              style={getTaskStyle(task, timelineStartDate, width)}
              onMouseDown={(e) => handleMouseDownMove(e, task)}
              ref={(ref) => storeCoordinates(task.id, ref)}
            >
              <div
                className="progress-bar"
                style={{ width: `${task.progress}%` }}
              ></div>
              <div
                className="resize-handle left"
                onMouseDown={(e) => {
                  handleMouseDownResize(e, task, "resize-left");
                  e.stopPropagation();
                }}
              ></div>
              <div
                className="resize-handle right"
                onMouseDown={(e) => {
                  handleMouseDownResize(e, task, "resize-right");
                  e.stopPropagation();
                }}
              ></div>
            </div>
          )}
        </div>
        {!hiddenTasks.has(task.id) &&
          task.children &&
          renderTaskBars(
            task.children,
            timelineStartDate,
            monthWidthPx,
            level + 1
          )}
      </React.Fragment>
    ));
  };

  const openControlPannel = () => {
    setIsPopupOpen(true);
  };

  const closeControlPannel = () => {
    setIsPopupOpen(false);
    setAIResponse(null);
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Check if the click is on the overlay and not the popup content
    if (e.target === e.currentTarget) {
      closeControlPannel();
    }
  };

  const UpdateTaskWithAI = (result: any) => {
    if (result.error) {
      return;
    }

    const actions = result.actions;
    actions.forEach((action: any) => {
      if (action.taskType.toLowerCase() === "update") {
        const task = findTaskById(tasks, action.target.id);
        if (task && action.data) {
          const start = action.data.start
            ? new Date(action.data.start)
            : task.start;
          const end = action.data.end ? new Date(action.data.end) : task.end;
          updateTaskById(action.target.id, { ...action.data, start, end });
        }
      } else if (action.taskType.toLowerCase() === "delete") {
        removeTaskById(action.target.id);
      } else if (action.taskType.toLowerCase() === "add") {
        addNewTaskToParent(
          {
            ...action.data,
            start: new Date(action.data.start),
            end: new Date(action.data.end)
          },
          action.data.parentId
        );
      }
    });
  };

  const handleProcessSchedule = async () => {
    try {
      const result = await processSchedule(tasks, question);
      setAIResponse(result);
      UpdateTaskWithAI(result);
      closeControlPannel();
    } catch (error) {
      console.error("Error processing schedule:", error);
      setAIResponse({
        error: "An error occurred while processing the schedule."
      });
    }
  };

  return (
    <div className="gantt-chart">
      <div className="gantt-header">
        <div className="left-controls">
          <div className="select-wrapper">
            <select value="Months" onChange={() => {}}>
              <option>Months</option>
              <option>Weeks</option>
              <option>Days</option>
            </select>
          </div>
          <div className="search-wrapper">
            <input
              type="text"
              placeholder="Search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <FontAwesomeIcon icon="search" className="search-icon" />
          </div>
        </div>
        <div className="right-controls">
          <button
            onClick={openControlPannel}
            className="z-20 flex gap-2 px-4 py-2 mr-2 text-white bg-black border-none rounded-md hover:bg-gray-700"
          >
            <span className="font-bold">AI</span>
            <span>
              <FontAwesomeIcon icon={faWandSparkles} />
            </span>
          </button>
          <button className="icon-button">
            <FontAwesomeIcon icon="undo" />
          </button>
          <button className="icon-button">
            <FontAwesomeIcon icon="redo" />
          </button>
          <button className="icon-button">
            <FontAwesomeIcon icon="link" />
          </button>
          <button className="icon-button">
            <FontAwesomeIcon icon="trash" />
          </button>
          <button className="icon-button">
            <FontAwesomeIcon icon="plus" />
          </button>
          <button className="icon-button">
            <FontAwesomeIcon icon="file-export" />
          </button>
          <button className="primary-button">Save</button>
        </div>
      </div>
      <div className="gantt-body">
        <div className="gantt-table-container hide-scrollbar" ref={tableRef}>
          <table className="gantt-table">
            <thead>
              <tr>
                {/* <th>#</th> */}
                <th>ID</th>
                <th>Name</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Progress</th>
                <th>Parent ID</th>
              </tr>
            </thead>
            <tbody>{renderTasks(filteredTasks)}</tbody>
          </table>
        </div>
        <div className="gantt-timeline hide-scrollbar" ref={ganttRef}>
          <div className="timeline-header">
            {months.map((month, index) => (
              <div key={index} className="month-header">
                {month}
              </div>
            ))}
          </div>
          <div className="timeline-body">
            {renderTaskBars(filteredTasks, timelineStartDate, monthWidthPx)}
            {/* {dependencyLines} */}
          </div>
        </div>
      </div>
      {isPopupOpen && (
        <div
          className="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50 px-auto py-auto"
          onClick={handleOverlayClick}
        >
          <div
            className="flex flex-col items-center justify-center w-5/12 gap-4 p-6 overflow-scroll bg-white rounded-lg shadow-lg h-80"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-2xl">AI Control Panel</h2>
            <textarea
              className="w-full h-32 p-2 mb-4 text-center border border-gray-300 rounded-md py-auto"
              placeholder="Enter your question here..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <div className="flex items-center justify-between ">
              <div className="mx-auto text-center px-auto">
                <button
                  onClick={handleProcessSchedule}
                  className="flex gap-2 px-4 py-2 mr-2 text-white bg-black border-none rounded-md hover:bg-gray-700 "
                >
                  <span>Process Schedule </span>
                  <span>
                    <FontAwesomeIcon icon={faWandSparkles} />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomGanttChart;

// Helper function to flatten tasks for calculating overall start and end dates
function flattenTask(task: Task): Task[] {
  return [task, ...(task.children?.flatMap(flattenTask) ?? [])];
}
