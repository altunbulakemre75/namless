import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { createClient } from "../lib/supabase/server";
import { prisma } from "../infrastructure/database/prisma";

export const createTRPCContext = async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { user, prisma };
};

type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

const authMiddleware = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(authMiddleware);
