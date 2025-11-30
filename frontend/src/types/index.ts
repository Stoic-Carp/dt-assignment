export interface Todo {
    id: string;
    title: string;
    description?: string;
    completed: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTodoRequest {
    title: string;
    description?: string;
}

export interface UpdateTodoRequest {
    title?: string;
    description?: string;
    completed?: boolean;
}

export interface AIAnalysisRequest {
    todos: Todo[];
}

export interface AIAnalysisResponse {
    summary: string;
    insights: string[];
    prioritySuggestions?: string[];
}

export interface TaskBreakdownRequest {
    goal: string;
    context?: string;
    maxTasks?: number;
}

export interface SuggestedTask {
    title: string;
    description?: string;
    estimatedPriority?: 'low' | 'medium' | 'high';
}

export interface TaskBreakdownResponse {
    goal: string;
    suggestedTasks: SuggestedTask[];
    reasoning?: string;
}
