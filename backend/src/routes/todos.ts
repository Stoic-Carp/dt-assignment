import { Router } from "express";
import * as todoController from "../controllers/todoController";
import { validateCreateTodo, validateUpdateTodo } from "../middleware/validation";

const router = Router();

router.get("/", todoController.getTodos);
router.post("/", validateCreateTodo, todoController.createTodo);
router.put("/:id", validateUpdateTodo, todoController.updateTodo);
router.delete("/:id", todoController.deleteTodo);
router.post("/:id/toggle", todoController.toggleTodo);

export default router;
