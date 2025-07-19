import { gemini, openai, createAgent } from "@inngest/agent-kit";
import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    // Create a new agent with a system prompt (you can add optional tools, too)
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

    return output;
  }
);
