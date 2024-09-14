import { spawn } from "child_process";
import { exec } from "child_process";
import { platform } from "os";

function killProcessOnPort(port) {
  return new Promise((resolve, reject) => {
    const command =
      platform() === "win32"
        ? `netstat -ano | findstr :${port} | findstr LISTENING`
        : `lsof -i :${port} | grep LISTEN | awk '{print $2}'`;

    exec(command, (error, stdout) => {
      if (error) {
        console.error(`Error finding process on port ${port}:`, error);
        reject(error);
        return;
      }

      const pid = stdout.trim().split(/\s+/).pop();
      if (pid) {
        const killCommand =
          platform() === "win32" ? `taskkill /F /PID ${pid}` : `kill -9 ${pid}`;

        exec(killCommand, (killError) => {
          if (killError) {
            console.error(`Error killing process ${pid}:`, killError);
            reject(killError);
          } else {
            console.log(`Process on port ${port} has been terminated.`);
            resolve();
          }
        });
      } else {
        console.log(`No process found on port ${port}.`);
        resolve();
      }
    });
  });
}

async function main() {
  const port = 3000;

  try {
    await killProcessOnPort(port);

    console.log(`Starting React development server on port ${port}...`);
    const ngServe = spawn("npm run dev", {
      shell: true
    });

    ngServe.stdout.on("data", (data) => {
      console.log(`React server: ${data}`);
    });

    ngServe.stderr.on("data", (data) => {
      console.error(`React server error: ${data}`);
    });

    ngServe.on("close", (code) => {
      console.log(`React server process exited with code ${code}`);
    });

    // Keep the main process running
    process.stdin.resume();
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

main();
