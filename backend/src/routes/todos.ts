import { Router } from "express";
import * as todoController from "../controllers/todoController";
import * as aiController from "../controllers/aiController";
import * as taskBreakdownController from "../controllers/taskBreakdownController";
import { validateCreateTodo, validateUpdateTodo } from "../middleware/validation";
import { aiAnalysisRateLimiter, taskBreakdownRateLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/analyze", aiAnalysisRateLimiter, aiController.analyzeTodos);
router.post("/breakdown", taskBreakdownRateLimiter, taskBreakdownController.breakdownTask);
router.get("/", todoController.getTodos);
router.post("/", validateCreateTodo, todoController.createTodo);
router.put("/:id", validateUpdateTodo, todoController.updateTodo);
router.delete("/:id", todoController.deleteTodo);
router.post("/:id/toggle", todoController.toggleTodo);

export default router;
