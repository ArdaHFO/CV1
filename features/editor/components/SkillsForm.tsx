'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useEditorStore } from '@/lib/store/editor-store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Skill } from '@/types';

export function SkillsForm() {
  const { content, updateContent } = useEditorStore();
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('Technical');

  if (!content) return null;

  const skills = content.skills || [];

  const addSkill = () => {
    if (!newSkillName.trim()) return;

    const newSkill: Skill = {
      id: Date.now().toString(),
      name: newSkillName.trim(),
      category: newSkillCategory,
      level: 'intermediate',
    };

    updateContent({
      skills: [...skills, newSkill],
    });

    setNewSkillName('');
  };

  const removeSkill = (id: string) => {
    updateContent({
      skills: skills.filter((skill) => skill.id !== id),
    });
  };

  const updateSkillLevel = (id: string, level: string) => {
    updateContent({
      skills: skills.map((skill) =>
        skill.id === id ? { ...skill, level: level as Skill['level'] } : skill
      ),
    });
  };

  const categories = Array.from(new Set(skills.map((s) => s.category)));

  return (
    <div className="space-y-6">
      {/* Add New Skill */}
      <div className="space-y-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
        <Label>Add New Skill</Label>
        <div className="flex gap-2">
          <Input
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            placeholder="e.g., React, TypeScript, Photoshop"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSkill();
              }
            }}
            className="flex-1"
          />
          <Select value={newSkillCategory} onValueChange={setNewSkillCategory}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Technical">Technical</SelectItem>
              <SelectItem value="Design">Design</SelectItem>
              <SelectItem value="Language">Language</SelectItem>
              <SelectItem value="Soft Skills">Soft Skills</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={addSkill} type="button" className="gap-2">
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
      </div>

      {/* Skills List */}
      {skills.length === 0 ? (
        <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
          No skills added yet. Use the form above to add them.
        </div>
      ) : (
        <div className="space-y-6">
          {categories.length > 0
            ? categories.map((category) => {
                const categorySkills = skills.filter((s) => s.category === category);
                return (
                  <div key={category} className="space-y-3">
                    <h3 className="font-semibold text-sm text-zinc-700 dark:text-zinc-300">
                      {category}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {categorySkills.map((skill) => (
                        <div
                          key={skill.id}
                          className="group flex items-center gap-2 pl-3 pr-2 py-2 bg-zinc-100 dark:bg-zinc-700 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
                        >
                          <span className="text-sm font-medium">{skill.name}</span>
                          <Select
                            value={skill.level}
                            onValueChange={(value) => updateSkillLevel(skill.id, value)}
                          >
                            <SelectTrigger className="h-6 w-24 text-xs border-0 bg-transparent">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                              <SelectItem value="expert">Expert</SelectItem>
                            </SelectContent>
                          </Select>
                          <button
                            onClick={() => removeSkill(skill.id)}
                            className="ml-1 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 text-zinc-500 hover:text-red-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            : null}
        </div>
      )}
    </div>
  );
}
