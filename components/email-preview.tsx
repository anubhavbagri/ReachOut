'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { ChevronLeft, ChevronRight, Edit2, Check } from 'lucide-react';

interface Email {
  prospectId: string;
  prospectName: string;
  prospectEmail: string;
  subject: string;
  body: string;
}

interface EmailPreviewProps {
  emails: Email[];
  onEdit: (index: number, updated: Email) => void;
}

export function EmailPreview({ emails, onEdit }: EmailPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editedEmail, setEditedEmail] = useState(emails[currentIndex]);

  const email = editedEmail;

  const handleNext = () => {
    if (editMode) {
      onEdit(currentIndex, editedEmail);
    }
    if (currentIndex < emails.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setEditedEmail(emails[currentIndex + 1]);
      setEditMode(false);
    }
  };

  const handlePrevious = () => {
    if (editMode) {
      onEdit(currentIndex, editedEmail);
    }
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setEditedEmail(emails[currentIndex - 1]);
      setEditMode(false);
    }
  };

  const handleSaveEdit = () => {
    onEdit(currentIndex, editedEmail);
    setEditMode(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Review & Edit Emails</h2>
        <div className="text-sm text-muted-foreground">
          {currentIndex + 1} of {emails.length}
        </div>
      </div>

      {/* Email Preview Card */}
      <Card className="p-8 space-y-6">
        {/* Prospect Info */}
        <div className="border-b border-border pb-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">{email.prospectName}</h3>
              <p className="text-sm text-muted-foreground">{email.prospectEmail}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditMode(!editMode)}
              className="gap-2"
            >
              {editMode ? (
                <>
                  <Check className="w-4 h-4" />
                  Done
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4" />
                  Edit
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Email Content */}
        {editMode ? (
          <FieldGroup>
            <Field>
              <FieldLabel>Subject</FieldLabel>
              <Input
                value={editedEmail.subject}
                onChange={e =>
                  setEditedEmail({ ...editedEmail, subject: e.target.value })
                }
              />
            </Field>

            <Field>
              <FieldLabel>Body</FieldLabel>
              <Textarea
                value={editedEmail.body}
                onChange={e =>
                  setEditedEmail({ ...editedEmail, body: e.target.value })
                }
                rows={8}
                className="resize-none"
              />
            </Field>

            <Button
              onClick={handleSaveEdit}
              className="w-full"
            >
              Save Changes
            </Button>
          </FieldGroup>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">SUBJECT</label>
              <div className="text-lg font-semibold p-3 bg-muted rounded-lg">
                {email.subject}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">BODY</label>
              <div className="text-sm whitespace-pre-wrap p-4 bg-muted rounded-lg text-foreground leading-relaxed">
                {email.body}
              </div>
            </div>
          </div>
        )}
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
                  : 'w-2 bg-muted hover:bg-muted-foreground'
              } cursor-pointer`}
              onClick={() => {
                if (editMode) {
                  onEdit(currentIndex, editedEmail);
                }
                setCurrentIndex(idx);
                setEditedEmail(emails[idx]);
                setEditMode(false);
              }}
            />
          ))}
        </div>

        <Button
          onClick={handleNext}
          disabled={currentIndex === emails.length - 1}
          className="gap-2"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
