import React, { useState } from 'react';
import {
    CheckSquare,
    Square,
    Edit2,
    Trash2,
    Save,
    X,
    ListChecks,
    Lightbulb,
    AlertTriangle,
    Plus,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { SuggestedTask } from '../types';

interface TaskSuggestionsListProps {
    suggestions: SuggestedTask[];
    selectedTasks: Set<number>;
    editedTasks: Map<number, SuggestedTask>;
    reasoning: string | undefined;
    isAddingTasks: boolean;
    onToggleSelection: (index: number) => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    onUpdateTask: (index: number, updates: Partial<SuggestedTask>) => void;
    onRemoveTask: (index: number) => void;
    onAddSelected: () => Promise<void>;
}

export const TaskSuggestionsList: React.FC<TaskSuggestionsListProps> = ({
    suggestions,
    selectedTasks,
    editedTasks,
    reasoning,
    isAddingTasks,
    onToggleSelection,
    onSelectAll,
    onDeselectAll,
    onUpdateTask,
    onRemoveTask,
    onAddSelected,
}) => {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');

    const selectedCount = selectedTasks.size;
    const allSelected = selectedTasks.size === suggestions.length;

    const startEditing = (index: number) => {
        const task = editedTasks.get(index) || suggestions[index];
        setEditingIndex(index);
        setEditTitle(task.title);
        setEditDescription(task.description || '');
    };

    const saveEdit = (index: number) => {
        if (!editTitle.trim()) {
            return; // Don't save if title is empty
        }

        onUpdateTask(index, {
            title: editTitle.trim(),
            description: editDescription.trim() || undefined,
        });
        setEditingIndex(null);
        setEditTitle('');
        setEditDescription('');
    };

    const cancelEdit = () => {
        setEditingIndex(null);
        setEditTitle('');
        setEditDescription('');
    };

    const getPriorityColor = (priority?: 'low' | 'medium' | 'high') => {
        switch (priority) {
            case 'high':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'medium':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'low':
                return 'bg-green-100 text-green-700 border-green-200';
            default:
                return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const getPriorityIcon = (priority?: 'low' | 'medium' | 'high') => {
        switch (priority) {
            case 'high':
                return '🔴';
            case 'medium':
                return '🟡';
            case 'low':
                return '🟢';
            default:
                return '⚪';
        }
    };

    return (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-6 shadow-xl animate-slide-up">
            {/* Header */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <ListChecks className="w-6 h-6 text-emerald-600" />
                        <h3 className="text-xl font-bold text-slate-900">
                            Suggested Tasks ({suggestions.length})
                        </h3>
                    </div>
                </div>

                {/* Reasoning */}
                {reasoning && (
                    <div className="mt-3 p-3 bg-white/70 rounded-xl border border-emerald-200">
                        <div className="flex items-start gap-2">
                            <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-slate-700 leading-relaxed">{reasoning}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Selection Controls */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-emerald-200">
                <div className="flex gap-2">
                    <button
                        onClick={onSelectAll}
                        disabled={allSelected || isAddingTasks}
                        className="text-sm font-medium text-emerald-700 hover:text-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Select All
                    </button>
                    <span className="text-slate-400">•</span>
                    <button
                        onClick={onDeselectAll}
                        disabled={selectedCount === 0 || isAddingTasks}
                        className="text-sm font-medium text-emerald-700 hover:text-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Deselect All
                    </button>
                </div>
                <div className="text-sm font-semibold text-slate-700">
                    {selectedCount} selected
                </div>
            </div>

            {/* Task List */}
            <div className="space-y-3 mb-4">
                {suggestions.map((suggestion, index) => {
                    const task = editedTasks.get(index) || suggestion;
                    const isSelected = selectedTasks.has(index);
                    const isEditing = editingIndex === index;
                    const isEdited = editedTasks.has(index);

                    return (
                        <div
                            key={index}
                            className={clsx(
                                "p-4 rounded-xl border-2 transition-all duration-200",
                                isSelected
                                    ? "bg-white border-emerald-300 shadow-md"
                                    : "bg-white/50 border-emerald-100 hover:border-emerald-200"
                            )}
                        >
                            {isEditing ? (
                                /* Edit Mode */
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        placeholder="Task title"
                                        className="w-full px-3 py-2 rounded-lg border-2 border-emerald-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                        autoFocus
                                    />
                                    <textarea
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                        placeholder="Description (optional)"
                                        rows={2}
                                        className="w-full px-3 py-2 rounded-lg border-2 border-emerald-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 resize-none"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => saveEdit(index)}
                                            disabled={!editTitle.trim()}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                                        >
                                            <Save className="w-4 h-4" />
                                            Save
                                        </button>
                                        <button
                                            onClick={cancelEdit}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 text-sm font-medium transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* View Mode */
                                <div className="flex gap-3">
                                    {/* Checkbox */}
                                    <button
                                        onClick={() => onToggleSelection(index)}
                                        disabled={isAddingTasks}
                                        className="flex-shrink-0 mt-0.5 text-emerald-600 hover:text-emerald-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSelected ? (
                                            <CheckSquare className="w-6 h-6" />
                                        ) : (
                                            <Square className="w-6 h-6" />
                                        )}
                                    </button>

                                    {/* Task Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h4
                                                className={clsx(
                                                    "font-semibold text-slate-900",
                                                    isEdited && "text-emerald-700"
                                                )}
                                            >
                                                {task.title}
                                                {isEdited && (
                                                    <span className="ml-2 text-xs font-normal text-emerald-600">
                                                        (edited)
                                                    </span>
                                                )}
                                            </h4>
                                            {task.estimatedPriority && (
                                                <span
                                                    className={clsx(
                                                        "px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0",
                                                        getPriorityColor(task.estimatedPriority)
                                                    )}
                                                >
                                                    {getPriorityIcon(task.estimatedPriority)}{' '}
                                                    {task.estimatedPriority}
                                                </span>
                                            )}
                                        </div>
                                        {task.description && (
                                            <p className="text-sm text-slate-600 leading-relaxed mb-2">
                                                {task.description}
                                            </p>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => startEditing(index)}
                                                disabled={isAddingTasks}
                                                className="flex items-center gap-1 text-xs text-slate-600 hover:text-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => onRemoveTask(index)}
                                                disabled={isAddingTasks}
                                                className="flex items-center gap-1 text-xs text-slate-600 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Warning for no selection */}
            {selectedCount === 0 && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-center gap-2 text-sm text-amber-800">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>Please select at least one task to add to your list</span>
                    </div>
                </div>
            )}

            {/* Add Selected Button */}
            <button
                onClick={onAddSelected}
                disabled={selectedCount === 0 || isAddingTasks}
                className={clsx(
                    "w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold transition-all duration-300 shadow-lg",
                    selectedCount === 0 || isAddingTasks
                        ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white hover:shadow-xl hover:scale-[1.02]"
                )}
            >
                {isAddingTasks ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Adding Tasks...</span>
                    </>
                ) : (
                    <>
                        <Plus className="w-5 h-5" />
                        <span>
                            Add {selectedCount} {selectedCount === 1 ? 'Task' : 'Tasks'} to List
                        </span>
                    </>
                )}
            </button>
        </div>
    );
};
