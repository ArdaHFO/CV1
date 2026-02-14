'use client';

import { Plus, Trash, GripVertical } from 'lucide-react';
import { useEditorStore } from '@/lib/store/editor-store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { Education } from '@/types';

export function EducationForm() {
  const { content, updateContent } = useEditorStore();

  if (!content) return null;

  const education = content.education || [];

  const addEducation = () => {
    const newEducation: Education = {
      id: Date.now().toString(),
      institution: '',
      degree: '',
      field: '',
      location: '',
      start_date: '',
      end_date: '',
      is_current: false,
      gpa: '',
      honors: [],
    };

    updateContent({
      education: [...education, newEducation],
    });
  };

  const updateEducation = (id: string, updates: Partial<Education>) => {
    updateContent({
      education: education.map((edu) =>
        edu.id === id ? { ...edu, ...updates } : edu
      ),
    });
  };

  const removeEducation = (id: string) => {
    updateContent({
      education: education.filter((edu) => edu.id !== id),
    });
  };

  return (
    <div className="space-y-6">
      {education.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-zinc-500 dark:text-zinc-400 mb-4">
            No education information added yet
          </p>
          <Button onClick={addEducation} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Add First Education
          </Button>
        </div>
      ) : (
        <>
          {education.map((edu, index) => (
            <div key={edu.id} className="space-y-4">
              {index > 0 && <Separator className="my-6" />}

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-5 h-5 text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Education #{index + 1}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeEducation(edu.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Institution</Label>
                <Input
                  value={edu.institution}
                  onChange={(e) => updateEducation(edu.id, { institution: e.target.value })}
                  placeholder="Massachusetts Institute of Technology"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Degree</Label>
                  <Input
                    value={edu.degree}
                    onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                    placeholder="Bachelor's"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Field</Label>
                  <Input
                    value={edu.field}
                    onChange={(e) => updateEducation(edu.id, { field: e.target.value })}
                    placeholder="Computer Engineering"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={edu.location || ''}
                  onChange={(e) => updateEducation(edu.id, { location: e.target.value })}
                  placeholder="Cambridge, USA"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Year</Label>
                  <Input
                    type="month"
                    value={edu.start_date}
                    onChange={(e) => updateEducation(edu.id, { start_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>End Year</Label>
                  <Input
                    type="month"
                    value={edu.end_date || ''}
                    onChange={(e) =>
                      updateEducation(edu.id, {
                        end_date: e.target.value,
                        is_current: !e.target.value,
                      })
                    }
                    disabled={edu.is_current}
                    placeholder="Ongoing"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`current-edu-${edu.id}`}
                  checked={edu.is_current}
                  onChange={(e) =>
                    updateEducation(edu.id, {
                      is_current: e.target.checked,
                      end_date: e.target.checked ? '' : edu.end_date,
                    })
                  }
                  className="rounded border-zinc-300"
                />
                <Label htmlFor={`current-edu-${edu.id}`} className="text-sm font-normal">
                  Currently ongoing
                </Label>
              </div>

              <div className="space-y-2">
                <Label>GPA (Optional)</Label>
                <Input
                  value={edu.gpa || ''}
                  onChange={(e) => updateEducation(edu.id, { gpa: e.target.value })}
                  placeholder="3.5/4.0"
                />
              </div>
            </div>
          ))}

          <Button onClick={addEducation} variant="outline" className="w-full gap-2">
            <Plus className="w-4 h-4" />
            Add Education
          </Button>
        </>
      )}
    </div>
  );
}
