import React from 'react';
import type { Todo, UpdateTodoRequest } from '../types';
import { TodoItem } from './TodoItem';
import { ClipboardList } from 'lucide-react';

interface TodoListProps {
    todos: Todo[];
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onUpdate: (id: string, updates: UpdateTodoRequest) => void;
    filter: 'all' | 'active' | 'completed';
}

export const TodoList: React.FC<TodoListProps> = ({ todos, onToggle, onDelete, onUpdate, filter }) => {
    const filteredTodos = todos.filter((todo) => {
        if (filter === 'active') return !todo.completed;
        if (filter === 'completed') return todo.completed;
        return true;
    });

    if (filteredTodos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 animate-fade-in">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <ClipboardList className="w-10 h-10 opacity-50 text-slate-300" />
                </div>
                <p className="text-lg font-medium text-slate-500">No tasks found</p>
                <p className="text-sm text-slate-400 mt-1">
                    {filter === 'all' ? "Get started by adding a new task above!" : `No ${filter} tasks to show.`}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-1">
            {filteredTodos.map((todo) => (
                <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    onUpdate={onUpdate}
                />
            ))}
        </div>
    );
};
