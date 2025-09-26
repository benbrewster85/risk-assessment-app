"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Edit3, Check, Trash2 } from "lucide-react";
import { SchedulerNote } from "@/lib/types";

interface NoteCardProps {
  note: SchedulerNote;
  onUpdate: (noteId: string, newText: string) => void;
  onDelete: (noteId: string) => void;
  isReadOnly: boolean;
}

export function NoteCard({
  note,
  onUpdate,
  onDelete,
  isReadOnly,
}: NoteCardProps) {
  const [isEditing, setIsEditing] = useState(note.text === "");
  const [editText, setEditText] = useState(note.text);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (editText.trim() === "") {
      handleDelete();
      return;
    }

    if (editText === note.text) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate(note.id, editText.trim());
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save note:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditText(note.text);
    setIsEditing(false);
    if (note.text === "") {
      handleDelete();
    }
  };

  const handleDelete = async () => {
    await onDelete(note.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing && !isReadOnly) {
    return (
      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded w-full">
        <textarea
          ref={textareaRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a note..."
          className="w-full min-h-[60px] resize-none border-none bg-transparent p-0 text-xs focus:outline-none"
          disabled={isSaving}
        />
        <div className="flex justify-end gap-1 mt-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            disabled={isSaving}
            className="h-6 px-2"
          >
            <X className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSave}
            disabled={isSaving}
            className="h-6 px-2 text-green-600 hover:text-green-700"
          >
            <Check className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    // ✅ CHANGED: Added 'relative' to make this the positioning container for the buttons
    <div className="relative p-2 bg-yellow-50 border border-yellow-200 rounded w-full group">
      <div className="text-xs text-gray-700 whitespace-pre-wrap break-words">
        {note.text}
      </div>
      {!isReadOnly && (
        // ✅ CHANGED: Positioned the button container absolutely in the top right
        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="h-5 px-1"
          >
            <Edit3 className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            className="h-5 px-1 text-red-500 hover:text-red-700"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
