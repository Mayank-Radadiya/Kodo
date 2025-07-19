import { gemini, openai, createAgent } from "@inngest/agent-kit";
import { inngest } from "./client";
import { Sandbox } from "@e2b/code-interpreter";
import { getSandbox } from "./utils";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("kodo-nextjs-02");

      return sandbox.sandboxId;
    });

    const codingAgent = createAgent({
      name: "summarizer",
      system:
        "You are a expert coder in react js, nextjs, and typescript. You write clean, efficient, and well-documented code. Write a snippet code for given user input.",
      model: openai({
        model: "gpt-4o",
        apiKey: process.env.OPENAI_API_KEY,
      }),
    });

    const { output } = await codingAgent.run(
      `Summarize the following text: ${event.data.input} `
    );

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);

      return `https://${host}`;
    });

    return { output, sandboxUrl };
  }
);
