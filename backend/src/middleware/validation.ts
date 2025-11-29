import { Request, Response, NextFunction } from "express";

export const validateCreateTodo = (req: Request, res: Response, next: NextFunction) => {
    const { title } = req.body;
    if (!title || typeof title !== "string" || title.trim().length === 0) {
        res.status(400).json({ error: "Title is required and must be a non-empty string" });
        return;
    }
    next();
};

export const validateUpdateTodo = (req: Request, res: Response, next: NextFunction) => {
    const { title, description, completed } = req.body;

    if (title !== undefined && (typeof title !== "string" || title.trim().length === 0)) {
        res.status(400).json({ error: "Title must be a non-empty string" });
        return;
    }

    if (description !== undefined && typeof description !== "string") {
        res.status(400).json({ error: "Description must be a string" });
        return;
    }

    if (completed !== undefined && typeof completed !== "boolean") {
        res.status(400).json({ error: "Completed must be a boolean" });
        return;
    }

    next();
};
