import { router } from "../trpc";
import { assessmentRouter } from "./assessment";
import { curriculumRouter } from "./curriculum";
import { learningRouter } from "./learning";

export const appRouter = router({
  assessment: assessmentRouter,
  curriculum: curriculumRouter,
  learning: learningRouter,
});

export type AppRouter = typeof appRouter;
