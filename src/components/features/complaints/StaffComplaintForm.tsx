'use client';

// =============================================================================
// StaffComplaintForm — Staff submission form for housing complaints & incidents
// =============================================================================

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, Info } from 'lucide-react';
import { submitIncidentTicketAction } from '@/app/actions/audit';

export function StaffComplaintForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();

    if (trimmedTitle.length < 5) {
      toast.error('Title must be at least 5 characters');
      return;
    }
    if (trimmedTitle.length > 120) {
      toast.error('Title must be under 120 characters');
      return;
    }
    if (trimmedDesc.length < 20) {
      toast.error('Description must be at least 20 characters');
      return;
    }
    if (trimmedDesc.length > 2000) {
      toast.error('Description must be under 2000 characters');
      return;
    }

    startTransition(async () => {
      const res = await submitIncidentTicketAction({
        title: trimmedTitle,
        description: trimmedDesc,
      });

      if (res.success) {
        toast.success('Complaint submitted successfully.');
        setTitle('');
        setDescription('');
        router.refresh();
      } else {
        toast.error(res.error ?? 'Failed to submit complaint');
      }
    });
  };

  return (
    <div className="rounded-xl border bg-card p-6 shadow-xs">
      <div className="mb-6 space-y-1">
        <h3 className="text-base font-semibold text-foreground tracking-tight">
          New Incident / Maintenance Report
        </h3>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-primary shrink-0" />
          Housing details (unit, type, road) are automatically captured from your current allocation at time of submission.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="complaint-title" className="text-xs font-semibold text-foreground">
            Subject / Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="complaint-title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Plumbing leakage in bathroom, roof damage, electrical fault"
            required
            disabled={isPending}
            className="text-sm bg-background"
          />
          <p className="text-[11px] text-muted-foreground">
            A concise summary of the issue (5–120 characters).
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="complaint-description" className="text-xs font-semibold text-foreground">
            Detailed Description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="complaint-description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please describe the incident or issue in detail, including the exact room or area affected, severity, and any hazards..."
            rows={4}
            required
            disabled={isPending}
            className="text-sm min-h-[100px] bg-background"
          />
          <p className="text-[11px] text-muted-foreground">
            Minimum 20 characters. Include clear details to assist maintenance staff.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isPending} className="gap-2">
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Complaint
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

