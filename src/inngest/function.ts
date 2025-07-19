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

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("kodo-nextjs-02");

      return sandbox.sandboxId;
    });

    const codingAgent = createAgent({
      name: "coding-agent",
      description: "An expert coding agent that can help with coding tasks",
      system: PROMPT,
      model: openai({
        model: "gpt-4.1",
        defaultParameters: {
          temperature: 0.1,
        },
        apiKey: process.env.OPENAI_API_KEY,
      }),
      tools: [
        createTool({
          name: "terminal",
          description: "Run terminal commands in the sandbox",
          parameters: z.object({
            commands: z.string(),
          }),

          handler: async ({ commands }, { step }) => {
            return await step?.run("run-terminal-command", async () => {
              const buffers = { stdout: "", stderr: "" };

              try {
                const sandbox = await getSandbox(sandboxId);
                const result = await sandbox.commands.run(commands, {
                  onStdout: (data) => {
                    buffers.stdout += data.toString();
                  },
                  onStderr: (data) => {
                    buffers.stderr += data.toString();
                  },
                });

                return result.stdout;
              } catch (error) {
                console.error(
                  `command failed: ${error} \n stdout: ${buffers.stdout} \n stderr: ${buffers.stderr}`
                );

                return `Command failed: ${error} \n stdout: ${buffers.stdout} \n stderr: ${buffers.stderr}`;
              }
            });
          },
        }),
        createTool({
          name: "CreateOrUpdateFile",
          description: "Create or update a file in the sandbox",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string(),
              })
            ),
          }),
          handler: async ({ files }, { step, network }) => {
            const newFile = await step?.run("createOrUpdateFile", async () => {
              try {
                const updateFile = network.state.data.files || {};
                const sandbox = await getSandbox(sandboxId);

                for (const file of files) {
                  await sandbox.files.write(file.path, file.content);
                  updateFile[file.path] = file.content;
                }

                return updateFile;
              } catch (error) {
                return `Error creating or updating file: ${error}`;
              }
            });

            if (typeof newFile === "object") {
              network.state.data.files = newFile;
            }
          },
        }),

        createTool({
          name: "readFiles",
          description: "Read files from the sandbox",
          parameters: z.object({
            files: z.array(z.string()),
          }),
          handler: async ({ files }, { step }) => {
            return await step?.run("readFiles", async () => {
              try {
                const sandbox = await getSandbox(sandboxId);
                const contents = [];

                for (const file of files) {
                  const content = await sandbox.files.read(file);
                  contents.push({ path: file, content });
                }

                return JSON.stringify(contents);
              } catch (error) {
                return `Error reading files: ${error}`;
              }
            });
          },
        }),
      ],

      lifecycle: {
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

    const network = createNetwork({
      name: "coding-agent-network",
      agents: [codingAgent],
      maxIter: 15,
      router: async ({ network }) => {
        const summary = network.state.data.summary;
        if (summary) {
          return summary;
        }

        return codingAgent;
      },
    });

    const result = await network.run(event.data.input);

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);

      return `https://${host}`;
    });

    return {
      url: sandboxUrl,
      title: "Fragment",
      files: result.state.data.files,
      summary: result.state.data.summary || "No summary available",
    };
  }
);
