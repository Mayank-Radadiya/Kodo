import { z } from "zod";
import { baseProcedure, createTRPCRouter } from "../init";
import { inngest } from "@/inngest/client";
export const appRouter = createTRPCRouter({
  invoke: baseProcedure
    .input(
      z.object({
        input: z.string(),
        framework: z.string().default("nextjs"),
      })
    )
    .mutation(async (opts) => {
      await inngest.send({
        name: "test/hello.world",
        data: {
          input: opts.input.input,
          framework: opts.input.framework,
        },
      });

      return {
        message: `Invoked with input: ${opts.input.input} ,  framework: ${opts.input.framework}`,
      };
    }),
  hello: baseProcedure
    .input(
      z.object({
        text: z.string(),
      })
    )
    .query((opts) => {
      return {
        greeting: `hello ${opts.input.text}`,
      };
    }),
});

export type AppRouter = typeof appRouter;
