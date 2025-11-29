import { Router } from "express";
import * as todoController from "../controllers/todoController";
import * as aiController from "../controllers/aiController";
import { validateCreateTodo, validateUpdateTodo } from "../middleware/validation";

const router = Router();

router.post("/analyze", aiController.analyzeTodos);
router.get("/", todoController.getTodos);
router.post("/", validateCreateTodo, todoController.createTodo);
router.put("/:id", validateUpdateTodo, todoController.updateTodo);
router.delete("/:id", todoController.deleteTodo);
router.post("/:id/toggle", todoController.toggleTodo);

export default router;
