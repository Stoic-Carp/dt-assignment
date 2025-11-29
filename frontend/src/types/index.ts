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
