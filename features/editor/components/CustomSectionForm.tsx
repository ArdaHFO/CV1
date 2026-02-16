'use client';

import { useState } from 'react';
import { Plus, Trash, GripVertical, MoveUp, MoveDown } from 'lucide-react';
import { useEditorStore } from '@/lib/store/editor-store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextarea } from '@/components/ui/rich-textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { CustomSection } from '@/types';

export function CustomSectionForm() {
  const { content, updateContent } = useEditorStore();

  if (!content) return null;

  const customSections = content.custom_sections || [];

  const addCustomSection = () => {
    const maxOrder = customSections.length > 0 
      ? Math.max(...customSections.map(s => s.order))
      : 0;

    const newSection: CustomSection = {
      id: Date.now().toString(),
      title: '',
      content: '',
      order: maxOrder + 1,
    };

    updateContent({
      custom_sections: [...customSections, newSection],
    });
  };

  const updateCustomSection = (id: string, updates: Partial<CustomSection>) => {
    updateContent({
      custom_sections: customSections.map((section) =>
        section.id === id ? { ...section, ...updates } : section
      ),
    });
  };

  const removeCustomSection = (id: string) => {
    updateContent({
      custom_sections: customSections.filter((section) => section.id !== id),
    });
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const index = customSections.findIndex(s => s.id === id);
    if (index === -1) return;
    
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === customSections.length - 1) return;

    const newSections = [...customSections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    
    // Update orders
    const reorderedSections = newSections.map((section, idx) => ({
      ...section,
      order: idx + 1,
    }));

    updateContent({
      custom_sections: reorderedSections,
    });
  };

  const sortedSections = [...customSections].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Custom Sections</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Add custom sections like Awards, Volunteer Work, Hobbies, etc.
          </p>
        </div>
        <Button onClick={addCustomSection} variant="outline" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Section
        </Button>
      </div>

      {sortedSections.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
          <p className="text-zinc-500 dark:text-zinc-400 mb-4">
            No custom sections yet
          </p>
          <Button onClick={addCustomSection} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Add First Section
          </Button>
        </div>
      ) : (
        <>
          {sortedSections.map((section, index) => (
            <div key={section.id} className="space-y-4">
              {index > 0 && <Separator className="my-6" />}

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-5 h-5 text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Section #{index + 1}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveSection(section.id, 'up')}
                    disabled={index === 0}
                    className="h-8 w-8"
                  >
                    <MoveUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveSection(section.id, 'down')}
                    disabled={index === sortedSections.length - 1}
                    className="h-8 w-8"
                  >
                    <MoveDown className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCustomSection(section.id)}
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Section Title</Label>
                  <Input
                    value={section.title}
                    onChange={(e) => updateCustomSection(section.id, { title: e.target.value })}
                    placeholder="e.g., Awards, Volunteer Work, Publications"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Content</Label>
                  <RichTextarea
                    value={section.content}
                    onChange={(value) => updateCustomSection(section.id, { content: value })}
                    placeholder="Add your content here... You can use bullet points and formatting."
                    rows={6}
                  />
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
