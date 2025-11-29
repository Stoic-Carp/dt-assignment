import React, { useState } from 'react';
import { Trash2, Edit2, Check, X, Calendar } from 'lucide-react';
import type { Todo, UpdateTodoRequest } from '../types';
import { clsx } from 'clsx';

interface TodoItemProps {
    todo: Todo;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onUpdate: (id: string, updates: UpdateTodoRequest) => void;
}

export const TodoItem: React.FC<TodoItemProps> = ({ todo, onToggle, onDelete, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(todo.title);
    const [editDescription, setEditDescription] = useState(todo.description || '');

    const handleUpdate = () => {
        if (editTitle.trim()) {
            onUpdate(todo.id, { title: editTitle, description: editDescription });
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        setEditTitle(todo.title);
        setEditDescription(todo.description || '');
        setIsEditing(false);
    };

    return (
        <div className={clsx(
            "group relative flex flex-col p-5 mb-3 bg-white rounded-xl border transition-all duration-200 animate-fade-in",
            todo.completed
                ? "bg-slate-50 border-slate-100"
                : "border-slate-100 hover:border-indigo-100 hover:shadow-md"
        )}>
            <div className="flex items-start gap-4">
                <button
                    onClick={() => onToggle(todo.id)}
                    className={clsx(
                        "mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20",
                        todo.completed
                            ? "bg-green-500 border-green-500 text-white scale-100"
                            : "border-slate-300 text-transparent hover:border-indigo-400"
                    )}
                >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                </button>

                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <div className="space-y-3 animate-fade-in">
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full px-3 py-2 text-base font-medium border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                autoFocus
                            />
                            <textarea
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                className="w-full px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                                rows={2}
                                placeholder="Description (optional)"
                            />
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={handleCancel}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex items-center gap-1"
                                >
                                    <X className="w-3.5 h-3.5" /> Cancel
                                </button>
                                <button
                                    onClick={handleUpdate}
                                    className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors flex items-center gap-1"
                                >
                                    <Check className="w-3.5 h-3.5" /> Save
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="group/content">
                            <h3 className={clsx(
                                "text-lg font-medium break-words transition-all duration-200",
                                todo.completed ? "text-slate-400 line-through decoration-slate-300" : "text-slate-800"
                            )}>
                                {todo.title}
                            </h3>
                            {todo.description && (
                                <p className={clsx(
                                    "mt-1 text-sm break-words whitespace-pre-wrap transition-all duration-200",
                                    todo.completed ? "text-slate-300" : "text-slate-500"
                                )}>
                                    {todo.description}
                                </p>
                            )}

                            <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {new Date(todo.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </div>

                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onDelete(todo.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
