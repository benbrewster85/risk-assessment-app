"use client";

import React, { useState, useRef, useEffect } from "react";
import { SchedulerNote } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { X, Save } from "lucide-react";

interface NoteCardProps {
  note: SchedulerNote;
  onUpdate: (noteId: string, newText: string) => void;
  onDelete: (noteId: string) => void;
  isReadOnly: boolean; // <-- Add isReadOnly prop
}

export function NoteCard({
  note,
  onUpdate,
  onDelete,
  isReadOnly,
}: NoteCardProps) {
  const [isEditing, setIsEditing] = useState(note.text === "" && !isReadOnly);
  const [text, setText] = useState(note.text);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textAreaRef.current) {
      textAreaRef.current.style.height = "auto";
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
      textAreaRef.current.focus();
    }
  }, [isEditing, text]);

  const handleSave = () => {
    if (text.trim() === "") {
      onDelete(note.id);
    } else {
      onUpdate(note.id, text);
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="w-full p-1 bg-gray-100 rounded-md border border-gray-300">
        <Textarea
          ref={textAreaRef}
          value={text}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setText(e.target.value)
          }
          onBlur={handleSave}
          className="w-full text-xs p-1 border-none focus-visible:ring-0 resize-none bg-transparent"
          placeholder="Type a note..."
        />
        <div className="flex justify-end items-center gap-1 mt-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onMouseDown={() => onDelete(note.id)}
          >
            <X className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onMouseDown={handleSave}
          >
            <Save className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Badge
      variant="outline"
      className={`bg-gray-200 text-gray-700 h-auto whitespace-normal w-full text-left justify-start ${isReadOnly ? "cursor-default" : "cursor-pointer"}`}
      // Disable opening the editor if read-only
      onClick={isReadOnly ? undefined : () => setIsEditing(true)}
    >
      <p className="truncate">{note.text}</p>
    </Badge>
  );
}
