'use client';

import { useEditorStore } from '@/lib/store/editor-store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function PersonalInfoForm() {
  const { content, updateContent } = useEditorStore();

  if (!content) return null;

  const personalInfo = content.personal_info;

  const handleChange = (field: string, value: string) => {
    updateContent({
      personal_info: {
        ...personalInfo,
        [field]: value,
      },
    });
  };

  const handleSummaryChange = (value: string) => {
    updateContent({
      summary: value,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="summary">Professional Summary / About Me</Label>
        <Textarea
          id="summary"
          value={content.summary || ''}
          onChange={(e) => handleSummaryChange(e.target.value)}
          placeholder="A brief professional summary about yourself, your expertise, and career goals..."
          rows={4}
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          This appears as the "About Me" section in your CV
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name</Label>
          <Input
            id="first_name"
            value={personalInfo.first_name}
            onChange={(e) => handleChange('first_name', e.target.value)}
            placeholder="John"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name</Label>
          <Input
            id="last_name"
            value={personalInfo.last_name}
            onChange={(e) => handleChange('last_name', e.target.value)}
            placeholder="Doe"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={personalInfo.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="john@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          value={personalInfo.phone || ''}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="+1 555 123 4567"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={personalInfo.location || ''}
          onChange={(e) => handleChange('location', e.target.value)}
          placeholder="New York, USA"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          type="url"
          value={personalInfo.website || ''}
          onChange={(e) => handleChange('website', e.target.value)}
          placeholder="https://yourwebsite.com"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="linkedin">LinkedIn</Label>
          <Input
            id="linkedin"
            value={personalInfo.linkedin || ''}
            onChange={(e) => handleChange('linkedin', e.target.value)}
            placeholder="linkedin.com/in/username"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="github">GitHub</Label>
          <Input
            id="github"
            value={personalInfo.github || ''}
            onChange={(e) => handleChange('github', e.target.value)}
            placeholder="github.com/username"
          />
        </div>
      </div>
    </div>
  );
}
