'use client';

import { useState } from 'react';
import { Plus, Trash, GripVertical } from 'lucide-react';
import { useEditorStore } from '@/lib/store/editor-store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextarea } from '@/components/ui/rich-textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { Experience } from '@/types';

export function ExperienceForm() {
  const { content, updateContent } = useEditorStore();

  if (!content) return null;

  const experiences = content.experience || [];

  const addExperience = () => {
    const newExperience: Experience = {
      id: Date.now().toString(),
      company: '',
      position: '',
      location: '',
      start_date: '',
      end_date: '',
      is_current: false,
      description: '',
      achievements: [],
    };

    updateContent({
      experience: [...experiences, newExperience],
    });
  };

  const updateExperience = (id: string, updates: Partial<Experience>) => {
    updateContent({
      experience: experiences.map((exp) =>
        exp.id === id ? { ...exp, ...updates } : exp
      ),
    });
  };

  const removeExperience = (id: string) => {
    updateContent({
      experience: experiences.filter((exp) => exp.id !== id),
    });
  };

  return (
    <div className="space-y-6">
      {experiences.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-zinc-500 dark:text-zinc-400 mb-4">
            No work experience added yet
          </p>
          <Button onClick={addExperience} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Add First Experience
          </Button>
        </div>
      ) : (
        <>
          {experiences.map((exp, index) => (
            <div key={exp.id} className="space-y-4">
              {index > 0 && <Separator className="my-6" />}

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-5 h-5 text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Experience #{index + 1}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeExperience(exp.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Input
                    value={exp.position}
                    onChange={(e) => updateExperience(exp.id, { position: e.target.value })}
                    placeholder="Frontend Developer"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input
                    value={exp.company}
                    onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                    placeholder="ABC Technology"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={exp.location || ''}
                  onChange={(e) => updateExperience(exp.id, { location: e.target.value })}
                  placeholder="New York, USA"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="month"
                    value={exp.start_date}
                    onChange={(e) => updateExperience(exp.id, { start_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="month"
                    value={exp.end_date || ''}
                    onChange={(e) =>
                      updateExperience(exp.id, {
                        end_date: e.target.value,
                        is_current: !e.target.value,
                      })
                    }
                    disabled={exp.is_current}
                    placeholder="Currently working"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`current-${exp.id}`}
                  checked={exp.is_current}
                  onChange={(e) =>
                    updateExperience(exp.id, {
                      is_current: e.target.checked,
                      end_date: e.target.checked ? '' : exp.end_date,
                    })
                  }
                  className="rounded border-zinc-300"
                />
                <Label htmlFor={`current-${exp.id}`} className="text-sm font-normal">
                  I currently work in this position
                </Label>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <RichTextarea
                  value={exp.description || ''}
                  onChange={(value) => updateExperience(exp.id, { description: value })}
                  placeholder="Describe your responsibilities and achievements...\n\nTips:\n• Use **bold** for key achievements\n• Use bullet points for clarity\n• Include numbers and metrics"
                  rows={5}
                />
              </div>
            </div>
          ))}

          <Button onClick={addExperience} variant="outline" className="w-full gap-2">
            <Plus className="w-4 h-4" />
            Add Experience
          </Button>
        </>
      )}
    </div>
  );
}
