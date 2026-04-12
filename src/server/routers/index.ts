import { router } from "../trpc";
import { assessmentRouter } from "./assessment";
import { curriculumRouter } from "./curriculum";

export const appRouter = router({
  assessment: assessmentRouter,
  curriculum: curriculumRouter,
});

export type AppRouter = typeof appRouter;
