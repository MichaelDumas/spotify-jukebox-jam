// server/router.ts
import { initTRPC } from "@trpc/server";
import { z } from "zod";
import {searchTracks} from "./spotify.ts";

const t = initTRPC.create();

export const appRouter = t.router({
  searchTracks: t.procedure
  .input(z.object({ query: z.string().min(1) }))
  .query(async ({ input }) => {
    return searchTracks(input.query);
  }),
});

// Export ONLY the type for the frontend
export type AppRouter = typeof appRouter;