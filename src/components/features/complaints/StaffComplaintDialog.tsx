"use client";

// =============================================================================
// StaffComplaintDialog — Modal dialog allowing staff members to submit a new
// complaint / maintenance incident report.
// =============================================================================

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, Send, Info } from "lucide-react";
import { submitIncidentTicketAction } from "@/app/actions/audit";

export function StaffComplaintDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();

    if (trimmedTitle.length < 5) {
      toast.error("Title must be at least 5 characters");
      return;
    }
    if (trimmedTitle.length > 120) {
      toast.error("Title must be under 120 characters");
      return;
    }
    if (trimmedDesc.length < 20) {
      toast.error("Description must be at least 20 characters");
      return;
    }
    if (trimmedDesc.length > 2000) {
      toast.error("Description must be under 2000 characters");
      return;
    }

    startTransition(async () => {
      const res = await submitIncidentTicketAction({
        title: trimmedTitle,
        description: trimmedDesc,
      });

      if (res.success) {
        toast.success("Complaint submitted successfully.");
        setTitle("");
        setDescription("");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed to submit complaint");
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isPending) {
          setOpen(nextOpen);
          if (!nextOpen) {
            setTitle("");
            setDescription("");
          }
        }
      }}
    >
      <DialogTrigger
        render={
          <Button
            className="gap-2 shadow-sm rounded-xl shrink-0"
            id="btn-new-complaint"
            aria-label="New Complaint"
          />
        }
      >
        <Plus className="h-4 w-4" />
        New Complaint
      </DialogTrigger>

      <DialogContent className="w-[95vw] sm:w-[42vw] sm:max-w-xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl font-bold tracking-tight text-oau-navy">
            Submit New Complaint
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Report a facility issue, maintenance defect, or housing concern.
          </DialogDescription>
        </DialogHeader>

        {/* Housing Auto-Capture Information Notice */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3.5 flex items-start gap-2.5 text-xs text-blue-900">
          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-semibold">Automatic Housing Link:</span> Your
            active housing allocation details (house type, unit name, and road
            number) will be automatically captured and attached to this ticket
            upon submission.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label
              htmlFor="dialog-complaint-title"
              className="text-xs font-semibold text-foreground"
            >
              Subject / Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dialog-complaint-title"
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
            <Label
              htmlFor="dialog-complaint-description"
              className="text-xs font-semibold text-foreground"
            >
              Detailed Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="dialog-complaint-description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe the incident or issue in detail, including the exact room or area affected, severity, and any hazards..."
              rows={4}
              required
              disabled={isPending}
              className="text-sm min-h-[110px] bg-background"
            />
            <p className="text-[11px] text-muted-foreground">
              Minimum 20 characters. Include clear details to assist maintenance
              staff.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
