import axios from 'axios';
import type { Todo, AIAnalysisResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
    baseURL: `${API_URL}/todos`,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const analyzeWithAI = async (todos: Todo[]): Promise<AIAnalysisResponse> => {
    const response = await api.post<AIAnalysisResponse>('/analyze', { todos });
    return response.data;
};
