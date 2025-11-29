import { Request, Response, NextFunction } from "express";
import { analyzeTodosWithAI } from "../services/aiService";
import { Todo } from "../types";

export const analyzeTodos = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { todos } = req.body;

        if (!todos) {
            res.status(400).json({ error: "Todos array is required" });
            return;
        }

        if (!Array.isArray(todos)) {
            res.status(400).json({ error: "Todos must be an array" });
            return;
        }

        const validatedTodos: Todo[] = todos.filter((todo: any) => {
            return todo && typeof todo === 'object' && typeof todo.title === 'string';
        });

        const analysis = await analyzeTodosWithAI(validatedTodos);
        res.json(analysis);
    } catch (error: any) {
        if (error.message.includes("not configured")) {
            res.status(503).json({
                error: "AI service is not configured. Please contact the administrator.",
                details: error.message
            });
            return;
        }

        if (error.message.includes("timed out")) {
            res.status(504).json({
                error: "AI analysis timed out. Please try again.",
                details: error.message
            });
            return;
        }

        next(error);
    }
};
