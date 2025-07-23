import { messagesRouter } from "@/modules/messages/server/procedures";
import { createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
  message: messagesRouter,
});

export type AppRouter = typeof appRouter;
