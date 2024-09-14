import react, { useState, useCallback } from "react";
import moment from "moment";
import GanttChart from "./components/gantt/CustomGantChart";
import { library } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import {
  faUndo,
  faRedo,
  faLink,
  faTrash,
  faPlus,
  faFileExport,
  faSearch,
  faWandSparkles
} from "@fortawesome/free-solid-svg-icons";

import { Task } from "./type";
import "./App.css";

library.add(
  faUndo,
  faRedo,
  faLink,
  faTrash,
  faPlus,
  faFileExport,
  faSearch,
  faWandSparkles
);
const initialTasks: Task[] = [
  {
    id: "PRJ",
    name: "QTS DH2.3",
    start: new Date("2020-10-09"),
    end: new Date("2021-03-26"),
    progress: 100,
    hideChildren: false,
    displayOrder: 1,
    children: [
      {
        id: "PCN",
        name: "Preconstruction",
        start: new Date("2020-10-09"),
        end: new Date("2020-11-20"),
        progress: 20,
        hideChildren: false,
        displayOrder: 1,
        parentId: "PRJ",
        children: [
          {
            id: "RFP",
            name: "QTS Issue RFP",
            start: new Date("2020-10-09"),
            end: new Date("2020-10-09"),
            progress: 100,
            hideChildren: false,
            displayOrder: 1,
            parentId: "PCN",
            children: [
              {
                id: "CHK",
                name: "Check",
                start: new Date("2020-10-09"),
                end: new Date("2020-10-09"),
                progress: 99,
                hideChildren: false,
                displayOrder: 1,
                parentId: "RFP"
              }
            ]
          },

          {
            id: "SUB",
            name: "Submit Proposal to QTS",
            start: new Date("2020-10-16"),
            end: new Date("2020-10-16"),
            progress: 100,
            hideChildren: false,
            displayOrder: 3,
            parentId: "PCN",
            dependencies: ["PCT"]
          },
          {
            id: "INT",
            name: "QTS Interview Selection",
            start: new Date("2020-10-19"),
            end: new Date("2020-11-06"),
            progress: 100,
            hideChildren: false,
            displayOrder: 4,
            parentId: "PCN",
            dependencies: ["SUB"]
          },
          {
            id: "REV",
            name: "QTS Review Proposals",
            start: new Date("2020-11-09"),
            end: new Date("2020-11-20"),
            progress: 100,
            hideChildren: false,
            displayOrder: 5,
            parentId: "PCN",
            dependencies: ["INT"]
          },
          {
            id: "AWD",
            name: "QTS Award CM",
            start: new Date("2020-11-20"),
            end: new Date("2020-11-20"),
            progress: 100,
            hideChildren: false,
            displayOrder: 6,
            parentId: "PCN",
            dependencies: ["REV"]
          }
        ]
      },
      {
        id: "CNP",
        name: "Contracting & Purchasing",
        start: new Date("2020-11-23"),
        end: new Date("2020-12-14"),
        progress: 100,
        hideChildren: false,
        displayOrder: 2,
        parentId: "PRJ",
        children: [
          {
            id: "GMP",
            name: "Build & Issue GMP",
            start: new Date("2020-11-23"),
            end: new Date("2020-11-25"),
            progress: 100,
            hideChildren: false,
            displayOrder: 1,
            parentId: "CNP"
          },
          {
            id: "EXE",
            name: "QTS Execute GMP/Work Order",
            start: new Date("2020-11-26"),
            end: new Date("2020-12-02"),
            progress: 100,
            hideChildren: false,
            displayOrder: 2,
            parentId: "CNP",
            dependencies: ["GMP"]
          },
          {
            id: "CON",
            name: "Contract Executed",
            start: new Date("2020-12-02"),
            end: new Date("2020-12-02"),
            progress: 100,
            hideChildren: false,
            displayOrder: 3,
            parentId: "CNP",
            dependencies: ["EXE"]
          },
          {
            id: "IFP",
            name: "Revised IFP Set Pricing",
            start: new Date("2020-11-26"),
            end: new Date("2020-12-09"),
            progress: 100,
            hideChildren: false,
            displayOrder: 4,
            parentId: "CNP",
            dependencies: ["GMP"]
          },
          {
            id: "TPC",
            name: "Trade Partner Contracting",
            start: new Date("2020-12-03"),
            end: new Date("2020-12-14"),
            progress: 100,
            hideChildren: false,
            displayOrder: 5,
            parentId: "CNP",
            dependencies: ["CON", "IFP"]
          }
        ]
      },
      {
        id: "PRC",
        name: "Procurement",
        start: new Date("2020-11-23"),
        end: new Date("2021-01-22"),
        progress: 100,
        hideChildren: false,
        displayOrder: 3,
        parentId: "PRJ",
        children: [
          {
            id: "STL",
            name: "Steel",
            start: new Date("2020-12-08"),
            end: new Date("2020-12-21"),
            progress: 100,
            hideChildren: false,
            displayOrder: 1,
            parentId: "PRC"
          },
          {
            id: "DRY",
            name: "Drywall",
            start: new Date("2020-12-15"),
            end: new Date("2020-12-21"),
            progress: 100,
            hideChildren: false,
            displayOrder: 2,
            parentId: "PRC",
            dependencies: ["STL"]
          },
          {
            id: "UNI",
            name: "Tate Unitstrut",
            start: new Date("2020-12-15"),
            end: new Date("2020-12-28"),
            progress: 100,
            hideChildren: false,
            displayOrder: 3,
            parentId: "PRC",
            dependencies: ["STL"]
          },
          {
            id: "LIT",
            name: "Lighting",
            start: new Date("2020-12-08"),
            end: new Date("2021-01-11"),
            progress: 100,
            hideChildren: false,
            displayOrder: 4,
            parentId: "PRC"
          },
          {
            id: "VES",
            name: "VESDA",
            start: new Date("2020-12-08"),
            end: new Date("2020-12-21"),
            progress: 100,
            hideChildren: false,
            displayOrder: 5,
            parentId: "PRC",
            dependencies: ["LIT"]
          }
        ]
      },
      {
        id: "CON",
        name: "Construction",
        start: new Date("2020-12-08"),
        end: new Date("2021-03-26"),
        progress: 95,
        hideChildren: false,
        displayOrder: 4,
        parentId: "PRJ",
        children: [
          {
            id: "DEM",
            name: "Drywall Demo",
            start: new Date("2020-12-15"),
            end: new Date("2020-12-21"),
            progress: 100,
            hideChildren: false,
            displayOrder: 1,
            parentId: "CON"
          },
          {
            id: "FRM",
            name: "Framing",
            start: new Date("2020-12-22"),
            end: new Date("2021-01-11"),
            progress: 100,
            hideChildren: false,
            displayOrder: 2,
            parentId: "CON",
            dependencies: ["DEM"]
          },
          {
            id: "PDU",
            name: "PDU Startup",
            start: new Date("2021-02-18"),
            end: new Date("2021-02-18"),
            progress: 100,
            hideChildren: false,
            displayOrder: 3,
            parentId: "CON",
            dependencies: ["FRM"]
          },
          {
            id: "CAH",
            name: "CAHU Startup",
            start: new Date("2021-03-01"),
            end: new Date("2021-03-01"),
            progress: 100,
            hideChildren: false,
            displayOrder: 4,
            parentId: "CON",
            dependencies: ["PDU"]
          },
          {
            id: "DHR",
            name: "Data Hall Ready for Level 4",
            start: new Date("2021-03-11"),
            end: new Date("2021-03-11"),
            progress: 100,
            hideChildren: false,
            displayOrder: 5,
            parentId: "CON",
            dependencies: ["CAH"]
          }
        ]
      },
      {
        id: "CMS",
        name: "Commissioning",
        start: new Date("2021-03-12"),
        end: new Date("2021-03-26"),
        progress: 80,
        hideChildren: false,
        displayOrder: 5,
        parentId: "PRJ",
        children: [
          {
            id: "DHC",
            name: "Data Hall CX",
            start: new Date("2021-03-12"),
            end: new Date("2021-03-18"),
            progress: 100,
            hideChildren: false,
            displayOrder: 1,
            parentId: "CMS"
          },
          {
            id: "CXC",
            name: "CX Complete",
            start: new Date("2021-03-18"),
            end: new Date("2021-03-18"),
            progress: 100,
            hideChildren: false,
            displayOrder: 2,
            parentId: "CMS",
            dependencies: ["DHC"]
          },
          {
            id: "COR",
            name: "CX Corrections",
            start: new Date("2021-03-15"),
            end: new Date("2021-03-26"),
            progress: 60,
            hideChildren: false,
            displayOrder: 3,
            parentId: "CMS",
            dependencies: ["DHC"]
          }
        ]
      },
      {
        id: "CLO",
        name: "Closeout",
        start: new Date("2021-02-15"),
        end: new Date("2021-03-08"),
        progress: 100,
        hideChildren: false,
        displayOrder: 6,
        parentId: "PRJ",
        children: [
          {
            id: "PNW",
            name: "Punch Walk",
            start: new Date("2021-02-15"),
            end: new Date("2021-02-15"),
            progress: 100,
            hideChildren: false,
            displayOrder: 1,
            parentId: "CLO"
          },
          {
            id: "PLE",
            name: "Punch List Execution",
            start: new Date("2021-02-16"),
            end: new Date("2021-03-08"),
            progress: 100,
            hideChildren: false,
            displayOrder: 2,
            parentId: "CLO",
            dependencies: ["PNW"]
          }
        ]
      }
    ]
  }
];
function App() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const handleTaskUpdate = useCallback(
    (taskId: string, newStart: Date, newEnd: Date) => {
      const updateTaskRecursively = (tasks: Task[]): Task[] => {
        return tasks.map((task) => {
          if (task.id === taskId) {
            console.log(`Updating task: ${task.name} (ID: ${task.id})`);
            console.log(
              `  Start: ${task.start.toISOString()} -> ${newStart.toISOString()}`
            );
            console.log(
              `  End: ${task.end.toISOString()} -> ${newEnd.toISOString()}`
            );

            const oldDuration = task.end.getTime() - task.start.getTime();
            const newDuration = newEnd.getTime() - newStart.getTime();
            const durationChange =
              (newDuration - oldDuration) / (1000 * 60 * 60 * 24);

            console.log(`  Duration change: ${durationChange.toFixed(2)} days`);

            return { ...task, start: newStart, end: newEnd };
          }
          if (task.children && task.children.length > 0) {
            const updatedChildren = updateTaskRecursively(task.children);
            return { ...task, children: updatedChildren };
          }
          return task;
        });
      };

      setTasks((prevTasks) => {
        const updatedTasks = updateTaskRecursively(prevTasks);

        // Log if no task was updated
        if (JSON.stringify(prevTasks) === JSON.stringify(updatedTasks)) {
          console.log(`No task found with ID: ${taskId}`);
        }

        return updatedTasks;
      });
    },
    []
  );

  const updateTaskById = useCallback(
    (taskId: string, updatedProperties: Partial<Task>) => {
      const updateTaskRecursively = (tasks: Task[]): Task[] => {
        return tasks.map((task) => {
          if (task.id === taskId) {
            console.log(
              `Updating task: ${task.name} (ID: ${task.id}) with properties`,
              updatedProperties
            );
            return { ...task, ...updatedProperties };
          }
          if (task.children && task.children.length > 0) {
            const updatedChildren = updateTaskRecursively(task.children);
            return { ...task, children: updatedChildren };
          }
          return task;
        });
      };

      setTasks((prevTasks) => {
        const updatedTasks = updateTaskRecursively(prevTasks);

        // Log if no task was updated
        if (JSON.stringify(prevTasks) === JSON.stringify(updatedTasks)) {
          console.log(`No task found with ID: ${taskId}`);
        }

        return updatedTasks;
      });
    },
    []
  );

  const updateFullTasks = useCallback((newTasks: Task[]) => {
    setTasks(newTasks);
  }, []);

  const removeTaskById = useCallback((taskId: string) => {
    const removeTaskRecursively = (tasks: Task[]): Task[] => {
      return tasks.reduce((acc: Task[], task) => {
        if (task.id === taskId) {
          console.log(`Removing task: ${task.name} (ID: ${task.id})`);
          return acc; // Don't add this task to the accumulator
        }

        if (task.children && task.children.length > 0) {
          const updatedChildren = removeTaskRecursively(task.children);
          if (updatedChildren.length === 0) {
            // If all children were removed, remove the children property
            const { children, ...taskWithoutChildren } = task;
            return [...acc, taskWithoutChildren];
          } else {
            return [...acc, { ...task, children: updatedChildren }];
          }
        }

        return [...acc, task];
      }, []);
    };

    setTasks((prevTasks) => {
      const updatedTasks = removeTaskRecursively(prevTasks);

      // Log if no task was removed
      if (JSON.stringify(prevTasks) === JSON.stringify(updatedTasks)) {
        console.log(`No task found with ID: ${taskId}`);
      }

      return updatedTasks;
    });
  }, []);

  // Helper function to find a task by ID
  const findTaskById = (tasks: Task[], id: string): Task | undefined => {
    for (const task of tasks) {
      if (task.id === id) return task;
      if (task.children) {
        const found = findTaskById(task.children, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  const reorderTasks = useCallback(
    (selectedTaskId: string, targetTaskId: string) => {
      console.log(
        `Reordering task ${selectedTaskId} to be a child of ${targetTaskId}`
      );

      setTasks((prevTasks) => {
        // Find the selected task and the target task
        const selectedTask = findTaskById(prevTasks, selectedTaskId);
        const targetTask = findTaskById(prevTasks, targetTaskId);

        if (!selectedTask || !targetTask) {
          console.log(
            `Reordering failed. Selected task or target task not found.`
          );
          return prevTasks;
        }

        console.log(`Selected task:`, selectedTask);
        console.log(`Target task:`, targetTask);

        // Create a deep copy of the tasks and ensure dates are properly parsed
        let newTasks = JSON.parse(JSON.stringify(prevTasks), (key, value) => {
          if (key === "start" || key === "end") {
            return new Date(value);
          }
          return value;
        }) as Task[];
        console.log(`Deep copy of tasks created with dates parsed.`);

        // Function to remove the selected task from the task tree
        const removeSelectedTask = (tasks: Task[]): Task[] => {
          return tasks
            .map((task) => {
              if (task.children) {
                task.children = task.children.filter(
                  (child) => child.id !== selectedTaskId
                );
                if (task.children.length === 0) {
                  delete task.children;
                } else {
                  task.children = removeSelectedTask(task.children);
                }
              }
              return task;
            })
            .filter((task) => task.id !== selectedTaskId);
        };

        // Remove the selected task from its current position
        newTasks = removeSelectedTask(newTasks);
        console.log(`Selected task removed from its current position.`);

        // Function to update parent task dates based on children
        const updateParentDates = (parent: Task) => {
          if (parent.children && parent.children.length > 0) {
            const childrenStartDates = parent.children.map(
              (child) => child.start
            );
            const childrenEndDates = parent.children.map((child) => child.end);

            const newStart = new Date(
              Math.min(...childrenStartDates.map((d) => d.getTime()))
            );
            const newEnd = new Date(
              Math.max(...childrenEndDates.map((d) => d.getTime()))
            );

            if (newStart < parent.start || newEnd > parent.end) {
              console.log(`Updating dates for parent task ${parent.id}`);
              parent.start = newStart;
              parent.end = newEnd;
            }
          }
        };

        // Function to add the selected task to the target task
        const addSelectedTaskToTarget = (tasks: Task[]): boolean => {
          for (let task of tasks) {
            if (task.id === targetTaskId) {
              if (!task.children) {
                task.children = [];
              }
              task.children.push({ ...selectedTask, parentId: targetTaskId });
              console.log(
                `Added selected task as child of target task ${targetTaskId}`
              );
              updateParentDates(task);
              return true;
            }
            if (task.children && addSelectedTaskToTarget(task.children)) {
              updateParentDates(task);
              return true;
            }
          }
          return false;
        };

        // Add the selected task to the target task
        if (addSelectedTaskToTarget(newTasks)) {
          console.log(
            `Successfully reordered task ${selectedTaskId} to be a child of ${targetTaskId}`
          );
        } else {
          console.log(
            `Failed to reorder task. Target task not found in the new structure.`
          );
        }

        console.log(`Returning new tasks structure.`);
        return newTasks;
      });
    },
    [findTaskById]
  );

  const findHiddenTasks = (tasks: Task[], hiddenTasksSet: Set<string>) => {
    tasks.forEach((task) => {
      if (task.hideChildren) {
        hiddenTasksSet.add(task.id);
      }
      if (task.children && task.children.length > 0) {
        findHiddenTasks(task.children, hiddenTasksSet);
      }
    });
  };

  const getMonths = (tasks: Task[], monthTimeLineDiff: number) => {
    if (tasks.length === 0) return [];

    let minStartDate = moment(tasks[0].start);
    let maxEndDate = moment(tasks[0].end);

    tasks.forEach((task) => {
      if (moment(task.start).isBefore(minStartDate)) {
        minStartDate = moment(task.start);
      }
      if (moment(task.end).isAfter(maxEndDate)) {
        maxEndDate = moment(task.end);
      }
    });

    minStartDate.subtract(monthTimeLineDiff, "months").startOf("month");
    maxEndDate.add(monthTimeLineDiff, "months").endOf("month");

    const months = [];
    let currentDate = minStartDate.clone();

    while (currentDate.isBefore(maxEndDate)) {
      months.push(currentDate.format("MMM YYYY"));
      currentDate.add(1, "month");
    }

    return months;
  };

  const addNewTaskToParent = useCallback((newTask: Task, parentId: string) => {
    const addTaskRecursively = (tasks: Task[]): Task[] => {
      return tasks.map((task) => {
        if (task.id === parentId) {
          console.log(
            `Adding new task to parent task: ${task.name} (ID: ${task.id})`
          );
          return {
            ...task,
            children: task.children ? [...task.children, newTask] : [newTask]
          };
        }
        if (task.children && task.children.length > 0) {
          const updatedChildren = addTaskRecursively(task.children);
          return { ...task, children: updatedChildren };
        }
        return task;
      });
    };

    setTasks((prevTasks) => {
      const updatedTasks = addTaskRecursively(prevTasks);

      // Log if parent task was not found
      if (JSON.stringify(prevTasks) === JSON.stringify(updatedTasks)) {
        console.log(`Parent task with ID: ${parentId} not found.`);
      }

      return updatedTasks;
    });
  }, []);

  return (
    <>
      <div className="">
        <GanttChart
          tasks={tasks}
          onTaskUpdate={handleTaskUpdate}
          updateTaskById={updateTaskById}
          updateFullTasks={updateFullTasks}
          removeTaskById={removeTaskById}
          findTaskById={findTaskById}
          reorderTasks={reorderTasks}
          getMonths={getMonths}
          findHiddenTasks={findHiddenTasks}
          addNewTaskToParent={addNewTaskToParent}
        />
      </div>
    </>
  );
}

export default App;
