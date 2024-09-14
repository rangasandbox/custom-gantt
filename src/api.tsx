import { Task } from "./type";

interface ProcessScheduleRequest {
  schedule: Task;
  question: string;
}
async function processSchedule(
  schedule: Task[],
  question: string
): Promise<any> {
  const url = "https://agent-4-b73ivo2mua-uc.a.run.app/process_schedule";
  // const url = "http://127.0.0.1:8080/process_schedule";

  const requestBody: ProcessScheduleRequest = {
    schedule: schedule[0],
    question
  };
  console.log("requestBody", requestBody);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Schedule processed successfully", data);

    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      console.error(
        "Network error: Unable to reach the server. Please check your connection."
      );
    } else if (error instanceof Error) {
      console.error(`Error processing schedule: ${error.message}`);
    } else {
      console.error("An unknown error occurred:", error);
    }
    throw error;
  }
}

export { processSchedule };
