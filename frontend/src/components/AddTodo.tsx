import React, { useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import type { CreateTodoRequest } from '../types';
import { clsx } from 'clsx';

interface AddTodoProps {
    onAdd: (todo: CreateTodoRequest) => void;
}

export const AddTodo: React.FC<AddTodoProps> = ({ onAdd }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            onAdd({ title, description: description.trim() || undefined });
            setTitle('');
            setDescription('');
            setIsExpanded(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className={clsx(
                "bg-white rounded-2xl shadow-lg border border-slate-100 transition-all duration-300 overflow-hidden",
                isExpanded ? "ring-2 ring-indigo-500/20 shadow-xl scale-[1.01]" : "hover:shadow-xl hover:-translate-y-0.5"
            )}
        >
            <div className="p-1">
                {isExpanded ? (
                    <div className="p-4 space-y-4">
                        <div>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="What needs to be done?"
                                className="w-full text-xl font-semibold placeholder-slate-400 border-none focus:ring-0 p-0 text-slate-900"
                                autoFocus
                            />
                        </div>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add details (optional)"
                            className="w-full text-sm text-slate-700 placeholder-slate-400 border-none focus:ring-0 p-0 resize-none min-h-[60px]"
                        />
                        <div className="flex justify-end gap-3 pt-2 border-t border-slate-50">
                            <button
                                type="button"
                                onClick={() => setIsExpanded(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!title.trim()}
                                className="px-6 py-2 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 rounded-lg shadow-md shadow-indigo-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Add Task
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setIsExpanded(true)}
                        className="flex items-center gap-4 w-full p-4 text-left group"
                    >
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                            <Plus className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                            <span className="text-lg font-medium text-slate-600 group-hover:text-slate-800 transition-colors">
                                Add a new task...
                            </span>
                        </div>
                        <Sparkles className="w-5 h-5 text-indigo-300 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                    </button>
                )}
            </div>
        </form>
    );
};
