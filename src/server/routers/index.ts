import { router } from "../trpc";
import { assessmentRouter } from "./assessment";
import { curriculumRouter } from "./curriculum";
import { learningRouter } from "./learning";
import { adminRouter } from "./admin";

export const appRouter = router({
  assessment: assessmentRouter,
  curriculum: curriculumRouter,
  learning: learningRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
