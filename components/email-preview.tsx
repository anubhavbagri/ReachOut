'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, ChevronRight, Edit2, Save, X } from 'lucide-react';

interface Email {
  prospectId: string;
  prospectName: string;
  prospectEmail: string;
  subject: string;
  body: string;
}

interface EmailPreviewProps {
  emails: Email[];
  onEmailsChange: (emails: Email[]) => void;
  onFinish?: () => void;
}

export function EmailPreview({ emails, onEmailsChange, onFinish }: EmailPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');

  const email = emails[currentIndex];

  const handleNext = () => {
    if (currentIndex < emails.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsEditing(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsEditing(false);
    }
  };

  const startEditing = () => {
    setEditSubject(email.subject);
    setEditBody(email.body);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const saveEditing = () => {
    const updated = [...emails];
    updated[currentIndex] = {
      ...updated[currentIndex],
      subject: editSubject,
      body: editBody,
    };
    onEmailsChange(updated);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Review Emails</h2>
        <div className="text-sm text-muted-foreground">
          {currentIndex + 1} of {emails.length}
        </div>
      </div>

      {/* Email Preview Card */}
      <Card className="p-4 md:p-8 space-y-6">
        {/* Prospect Info and Edit Toggle */}
        <div className="border-b border-border pb-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">{email.prospectName}</h3>
            <p className="text-sm text-muted-foreground">{email.prospectEmail}</p>
          </div>
          {isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={cancelEditing} className="gap-1">
                <X className="w-3.5 h-3.5" />
                Cancel
              </Button>
              <Button size="sm" onClick={saveEditing} className="gap-1">
                <Save className="w-3.5 h-3.5" />
                Save
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={startEditing} className="gap-1">
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </Button>
          )}
        </div>

        {/* Email content */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground tracking-wide">SUBJECT</label>
            {isEditing ? (
              <Input 
                value={editSubject} 
                onChange={e => setEditSubject(e.target.value)}
                className="font-semibold text-base"
              />
            ) : (
              <div className="text-base font-semibold p-3 bg-muted rounded-lg">
                {email.subject}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground tracking-wide">BODY</label>
            {isEditing ? (
              <Textarea 
                value={editBody} 
                onChange={e => setEditBody(e.target.value)}
                className="min-h-[300px] text-sm leading-relaxed"
              />
            ) : (
              <div className="text-sm whitespace-pre-wrap p-4 bg-muted rounded-lg text-foreground leading-relaxed">
                {email.body}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        <div className="flex gap-2">
          {emails.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all ${
                idx === currentIndex
                  ? 'w-8 bg-primary'
                  : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground'
              } cursor-pointer`}
              onClick={() => {
                setCurrentIndex(idx);
                setIsEditing(false);
              }}
            />
          ))}
        </div>

        {currentIndex === emails.length - 1 ? (
          <Button
            onClick={onFinish}
            className="gap-2 bg-red-600 hover:bg-red-700 text-white"
          >
            Send Emails
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={handleNext}
            className="gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
