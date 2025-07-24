import { messagesRouter } from "@/modules/messages/server/procedures";
import { createTRPCRouter } from "../init";
import { projectsRouter } from "@/modules/projects/server/procedures";

export const appRouter = createTRPCRouter({
  message: messagesRouter,
  projects: projectsRouter,
});

export type AppRouter = typeof appRouter;
