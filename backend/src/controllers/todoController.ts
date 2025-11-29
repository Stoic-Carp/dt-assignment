import { Request, Response, NextFunction } from "express";
import * as todoModel from "../db/todos";

export const getTodos = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const todos = await todoModel.getAllTodos();
        res.json({ todos });
    } catch (error) {
        next(error);
    }
};

export const createTodo = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { title, description } = req.body;
        if (!title) {
            res.status(400).json({ error: "Title is required" });
            return;
        }

        const todo = await todoModel.createTodo({ title, description });
        res.status(201).json(todo);
    } catch (error) {
        next(error);
    }
};

export const updateTodo = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (!id) {
            res.status(400).json({ error: "ID is required" });
            return;
        }

        const todo = await todoModel.updateTodo(id, updates);
        if (!todo) {
            res.status(404).json({ error: "Todo not found" });
            return;
        }

        res.json(todo);
    } catch (error) {
        next(error);
    }
};

export const deleteTodo = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: "ID is required" });
            return;
        }
        await todoModel.deleteTodo(id);
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};

export const toggleTodo = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: "ID is required" });
            return;
        }
        const todo = await todoModel.getTodoById(id);

        if (!todo) {
            res.status(404).json({ error: "Todo not found" });
            return;
        }

        const updatedTodo = await todoModel.updateTodo(id, { completed: !todo.completed });
        res.json(updatedTodo);
    } catch (error) {
        next(error);
    }
};
