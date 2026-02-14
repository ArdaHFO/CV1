'use client';

import { useState, useRef, useEffect } from 'react';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';
import { Button } from './button';
import { Textarea } from './textarea';
import { cn } from '@/lib/utils';

interface RichTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export function RichTextarea({
  value,
  onChange,
  placeholder,
  rows = 4,
  className,
}: RichTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);

    const newText = beforeText + prefix + selectedText + suffix + afterText;
    onChange(newText);

    // Set focus and cursor position
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + prefix.length + selectedText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const insertBulletList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);

    let formattedText = '';
    if (selectedText.trim()) {
      // Convert selected lines to bullet points
      const lines = selectedText.split('\n').filter(line => line.trim());
      formattedText = lines.map(line => `• ${line.trim()}`).join('\n');
    } else {
      // Insert a single bullet point
      formattedText = '• ';
    }

    const newText = beforeText + formattedText + afterText;
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      const newPosition = start + formattedText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const insertNumberedList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);

    let formattedText = '';
    if (selectedText.trim()) {
      // Convert selected lines to numbered list
      const lines = selectedText.split('\n').filter(line => line.trim());
      formattedText = lines.map((line, i) => `${i + 1}. ${line.trim()}`).join('\n');
    } else {
      // Insert a single numbered item
      formattedText = '1. ';
    }

    const newText = beforeText + formattedText + afterText;
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      const newPosition = start + formattedText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => insertFormatting('**', '**')}
          title="Bold (wraps selection with **)"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => insertFormatting('*', '*')}
          title="Italic (wraps selection with *)"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <div className="w-px bg-zinc-300 dark:bg-zinc-600 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={insertBulletList}
          title="Bullet list (converts lines or adds •)"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={insertNumberedList}
          title="Numbered list"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
      </div>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={cn('font-mono text-sm', className)}
      />
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Use **bold**, *italic*, or click toolbar buttons. Bullet points with •
      </p>
    </div>
  );
}
