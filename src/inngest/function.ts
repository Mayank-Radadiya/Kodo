import {
  openai,
  createAgent,
  createTool,
  createNetwork,
} from "@inngest/agent-kit";
import { inngest } from "./client";
import { Sandbox } from "@e2b/code-interpreter";
import { getSandbox, lastAssistantTextMessageContent } from "./utils";
import z from "zod";
import { PROMPT } from "@/lib/prompt";

// Helper for consistent error handling
const handleError = (
  error: unknown,
  context: string,
  buffers?: { stdout?: string; stderr?: string }
) => {
  const stdout = buffers?.stdout ?? "";
  const stderr = buffers?.stderr ?? "";
  console.error(
    `${context}: ${error} \n stdout: ${stdout} \n stderr: ${stderr}`
  );
  return `${context}: ${error} \n stdout: ${stdout} \n stderr: ${stderr}`;
};

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({
    event,
    step,
  }): Promise<{
    url: string;
    title: string;
    files: Record<string, string>;
    summary: string;
  }> => {
    // Create sandbox and get its ID
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("kodo-nextjs-02");
      return sandbox.sandboxId;
    });

    // Coding agent setup
    const codingAgent = createAgent({
      name: "coding-agent",
      description: "An expert coding agent that can help with coding tasks",
      system: PROMPT,
      model: openai({
        model: "gpt-4.1",
        defaultParameters: { temperature: 0.1 },
        apiKey: process.env.OPENAI_API_KEY,
      }),
      tools: [
        // Terminal tool
        createTool({
          name: "terminal",
          description: "Run terminal commands in the sandbox",
          parameters: z.object({ commands: z.string() }),
          handler: async ({ commands }, { step }) => {
            return await step?.run("run-terminal-command", async () => {
              const buffers = { stdout: "", stderr: "" };
              try {
                const sandbox = await getSandbox(sandboxId);
                const result = await sandbox.commands.run(commands, {
                  onStdout: (data: string) => {
                    buffers.stdout += data;
                  },
                  onStderr: (data: string) => {
                    buffers.stderr += data;
                  },
                });
                return result.stdout;
              } catch (error) {
                return handleError(error, "Command failed", buffers);
              }
            });
          },
        }),
        // Create or update file tool
        createTool({
          name: "CreateOrUpdateFile",
          description: "Create or update a file in the sandbox",
          parameters: z.object({
            files: z.array(z.object({ path: z.string(), content: z.string() })),
          }),
          handler: async ({ files }, { step, network }) => {
            const newFile = await step?.run("createOrUpdateFile", async () => {
              try {
                const updateFile: Record<string, string> =
                  network.state.data.files || {};
                const sandbox = await getSandbox(sandboxId);
                for (const file of files) {
                  await sandbox.files.write(file.path, file.content);
                  updateFile[file.path] = file.content;
                }
                return updateFile;
              } catch (error) {
                return handleError(error, "Error creating or updating file");
              }
            });
            if (typeof newFile === "object") {
              network.state.data.files = newFile;
            }
          },
        }),
        // Read files tool
        createTool({
          name: "readFiles",
          description: "Read files from the sandbox",
          parameters: z.object({ files: z.array(z.string()) }),
          handler: async ({ files }, { step }) => {
            return await step?.run("readFiles", async () => {
              try {
                const sandbox = await getSandbox(sandboxId);
                const contents: Array<{ path: string; content: string }> = [];
                for (const file of files) {
                  const content = await sandbox.files.read(file);
                  contents.push({ path: file, content });
                }
                return JSON.stringify(contents);
              } catch (error) {
                return handleError(error, "Error reading files");
              }
            });
          },
        }),
      ],
      lifecycle: {
        // Store summary if present in response
        onResponse: async ({ result, network }) => {
          const lastAssistantMessageText =
            await lastAssistantTextMessageContent(result);
          if (lastAssistantMessageText && network) {
            if (lastAssistantMessageText.includes("<task_summary>")) {
              network.state.data.summary = lastAssistantMessageText;
            }
          }
          return result;
        },
      },
    });

    // Create network for agent
    const network = createNetwork({
      name: "coding-agent-network",
      agents: [codingAgent],
      maxIter: 7, // Lowered to avoid excessive loops
      router: async ({ network }) => {
        const summary = network.state.data.summary;
        return summary || codingAgent;
      },
    });

    // Run agent network with event data, with timeout
    const runWithTimeout = async (promise: Promise<any>, ms: number) => {
      let timeoutId: NodeJS.Timeout | undefined = undefined;
      const timeoutPromise = new Promise((resolve) => {
        timeoutId = setTimeout(() => {
          resolve({
            state: {
              data: {
                files: {},
                summary: "Timed out. Partial results may be available.",
              },
            },
          });
        }, ms);
      });
      const result = await Promise.race([promise, timeoutPromise]);
      if (timeoutId) clearTimeout(timeoutId);
      return result;
    };

    const startTime = Date.now();
    const result = await runWithTimeout(
      network.run(`framework: ${event.data.framework}\n\n${event.data.input}`),
      120000 // 2 minute timeout
    );
    const duration = Date.now() - startTime;
    console.log(`Agent network run duration: ${duration}ms`);

    // Get sandbox URL
    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    // Return result object
    return {
      url: sandboxUrl,
      title: "Fragment",
      files: result.state.data.files,
      summary: result.state.data.summary || "No summary available",
    };
  }
);
