'use client';

import { Printer } from 'lucide-react';

interface PrintCertificateButtonProps {
  className?: string;
}

export function PrintCertificateButton({ className }: PrintCertificateButtonProps) {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <button
      type="button"
      onClick={handlePrint}
      className={
        className ??
        'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-oau-navy text-oau-cream text-base font-semibold hover:bg-oau-navy/90 transition shadow-md cursor-pointer active:scale-[0.98]'
      }
      title="Print or Save Certificate as PDF"
      aria-label="Print or Save Certificate as PDF"
    >
      <Printer className="h-4 w-4" />
      <span>Print Certificate</span>
    </button>
  );
}
