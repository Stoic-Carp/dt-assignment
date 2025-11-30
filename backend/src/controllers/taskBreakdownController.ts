import { Request, Response, NextFunction } from "express";
import { generateTaskBreakdown } from "../services/taskBreakdownService";
import { TaskBreakdownRequest } from "../types";

export const breakdownTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { goal, context, maxTasks } = req.body;

        if (!goal) {
            res.status(400).json({ error: "Goal is required" });
            return;
        }

        if (typeof goal !== 'string') {
            res.status(400).json({ error: "Goal must be a string" });
            return;
        }

        if (context !== undefined && typeof context !== 'string') {
            res.status(400).json({ error: "Context must be a string" });
            return;
        }

        if (maxTasks !== undefined && (typeof maxTasks !== 'number' || maxTasks < 1 || maxTasks > 20)) {
            res.status(400).json({ error: "maxTasks must be a number between 1 and 20" });
            return;
        }

        const request: TaskBreakdownRequest = {
            goal,
            context,
            maxTasks
        };

        const breakdown = await generateTaskBreakdown(request);
        res.json(breakdown);
    } catch (error: unknown) {
        if (error instanceof Error && error.message.includes("not configured")) {
            res.status(503).json({
                error: "AI service is not configured. Please contact the administrator.",
                details: error.message
            });
            return;
        }

        if (error instanceof Error && error.message.includes("timed out")) {
            res.status(504).json({
                error: "Task breakdown timed out. Please try again with a simpler goal.",
                details: error.message
            });
            return;
        }

        if (error instanceof Error && (error.message.includes("Goal") || error.message.includes("specific"))) {
            res.status(400).json({
                error: error.message
            });
            return;
        }

        if (error instanceof Error && error.message.includes("format")) {
            res.status(500).json({
                error: "AI response was not in expected format. Please try again.",
                details: error.message
            });
            return;
        }

        next(error);
    }
};
