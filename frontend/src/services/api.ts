import axios from 'axios';
import type { Todo, CreateTodoRequest, UpdateTodoRequest } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
    baseURL: `${API_URL}/todos`,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getTodos = async (): Promise<Todo[]> => {
    const response = await api.get<{ todos: Todo[] }>('/');
    return response.data.todos;
};

export const createTodo = async (todo: CreateTodoRequest): Promise<Todo> => {
    const response = await api.post<Todo>('/', todo);
    return response.data;
};

export const updateTodo = async (id: string, updates: UpdateTodoRequest): Promise<Todo> => {
    const response = await api.put<Todo>(`/${id}`, updates);
    return response.data;
};

export const deleteTodo = async (id: string): Promise<void> => {
    await api.delete(`/${id}`);
};

export const toggleTodo = async (id: string): Promise<Todo> => {
    const response = await api.post<Todo>(`/${id}/toggle`);
    return response.data;
};
