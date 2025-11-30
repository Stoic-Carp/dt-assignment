import axios from 'axios';
import type { TaskBreakdownRequest, TaskBreakdownResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
    baseURL: `${API_URL}/todos`,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Generate task breakdown from a high-level goal
 * @param goal - The high-level goal to break down
 * @param context - Optional additional context
 * @param maxTasks - Optional maximum number of tasks to generate
 * @returns Promise with suggested tasks
 */
export const generateTaskBreakdown = async (
    goal: string,
    context?: string,
    maxTasks?: number
): Promise<TaskBreakdownResponse> => {
    const request: TaskBreakdownRequest = {
        goal,
        context,
        maxTasks,
    };

    const response = await api.post<TaskBreakdownResponse>('/breakdown', request);
    return response.data;
};
