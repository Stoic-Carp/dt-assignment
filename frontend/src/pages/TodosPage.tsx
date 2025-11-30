import React, { useEffect, useState } from 'react';
import { getTodos, createTodo, updateTodo, deleteTodo, toggleTodo } from '../services/api';
import type { Todo, CreateTodoRequest, UpdateTodoRequest } from '../types';
import { AddTodo } from '../components/AddTodo';
import { TodoList } from '../components/TodoList';
import { AIAnalysis } from '../components/AIAnalysis';
import { TaskBreakdown } from '../components/TaskBreakdown';
import { useTaskBreakdown } from '../hooks/useTaskBreakdown';
import { Loader2, CheckCircle2, ListTodo } from 'lucide-react';
import { clsx } from 'clsx';

export const TodosPage: React.FC = () => {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

    // Task breakdown hook
    const taskBreakdown = useTaskBreakdown(() => {
        // Refresh todos when tasks are added
        fetchTodos();
    });

    useEffect(() => {
        fetchTodos();
    }, []);

    const fetchTodos = async () => {
        try {
            setLoading(true);
            const data = await getTodos();
            const sorted = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setTodos(sorted);
            setError(null);
        } catch (err) {
            setError('Failed to load todos. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddTodo = async (todo: CreateTodoRequest) => {
        try {
            const newTodo = await createTodo(todo);
            setTodos([newTodo, ...todos]);
        } catch (err) {
            setError('Failed to create todo.');
        }
    };

    const handleToggleTodo = async (id: string) => {
        try {
            setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
            await toggleTodo(id);
        } catch (err) {
            fetchTodos();
            setError('Failed to update todo status.');
        }
    };

    const handleDeleteTodo = async (id: string) => {
        if (!confirm('Are you sure you want to delete this task?')) return;
        try {
            setTodos(todos.filter(t => t.id !== id));
            await deleteTodo(id);
        } catch (err) {
            fetchTodos();
            setError('Failed to delete todo.');
        }
    };

    const handleUpdateTodo = async (id: string, updates: UpdateTodoRequest) => {
        try {
            setTodos(todos.map(t => t.id === id ? { ...t, ...updates } : t));
            await updateTodo(id, updates);
        } catch (err) {
            fetchTodos();
            setError('Failed to update todo.');
        }
    };

    const activeCount = todos.filter(t => !t.completed).length;
    const completedCount = todos.filter(t => t.completed).length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-10 text-center sm:text-left sm:flex sm:items-end sm:justify-between animate-slide-up">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2 flex items-center gap-3 justify-center sm:justify-start">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-400">
                                My Tasks
                            </span>
                        </h1>
                        <p className="text-slate-500 font-medium">
                            Stay organized and get things done.
                        </p>
                    </div>
                    <div className="mt-4 sm:mt-0 flex gap-4 text-sm font-medium text-slate-600 bg-white/50 px-4 py-2 rounded-full backdrop-blur-sm border border-white/50 shadow-sm">
                        <div className="flex items-center gap-1.5">
                            <ListTodo className="w-4 h-4 text-indigo-500" />
                            <span>{activeCount} Active</span>
                        </div>
                        <div className="w-px h-4 bg-slate-300 my-auto"></div>
                        <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span>{completedCount} Done</span>
                        </div>
                    </div>
                </header>

                <div className="space-y-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <AddTodo onAdd={handleAddTodo} />

                    <AIAnalysis todos={todos} />

                    <TaskBreakdown
                        suggestions={taskBreakdown.suggestions}
                        selectedTasks={taskBreakdown.selectedTasks}
                        editedTasks={taskBreakdown.editedTasks}
                        isLoading={taskBreakdown.isLoading}
                        error={taskBreakdown.error}
                        reasoning={taskBreakdown.reasoning}
                        onGenerate={taskBreakdown.generateBreakdown}
                        onToggleSelection={taskBreakdown.toggleTaskSelection}
                        onSelectAll={taskBreakdown.selectAll}
                        onDeselectAll={taskBreakdown.deselectAll}
                        onUpdateTask={taskBreakdown.updateTask}
                        onRemoveTask={taskBreakdown.removeTask}
                        onAddSelected={taskBreakdown.addSelectedTasks}
                        onClear={taskBreakdown.clearSuggestions}
                    />

                    <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 overflow-hidden min-h-[400px]">
                        <div className="p-4 border-b border-slate-100 flex gap-2 overflow-x-auto">
                            {(['all', 'active', 'completed'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={clsx(
                                        "px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 whitespace-nowrap",
                                        filter === f
                                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                                            : "text-slate-700 hover:bg-white hover:text-indigo-700"
                                    )}
                                >
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>

                        <div className="p-6">
                            {error && (
                                <div className="p-4 mb-6 text-red-700 bg-red-50 rounded-xl border border-red-100 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                    {error}
                                </div>
                            )}

                            {loading ? (
                                <div className="flex justify-center py-20">
                                    <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
                                </div>
                            ) : (
                                <TodoList
                                    todos={todos}
                                    onToggle={handleToggleTodo}
                                    onDelete={handleDeleteTodo}
                                    onUpdate={handleUpdateTodo}
                                    filter={filter}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
