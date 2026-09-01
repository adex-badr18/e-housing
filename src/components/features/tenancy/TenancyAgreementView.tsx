'use client';

// =============================================================================
// TenancyAgreementView — Print-Optimised Digital Tenancy Agreement
// =============================================================================
// @media print rules hide all chrome (sidebar, header, action buttons) and
// render a clean A4-style document suitable for browser print-to-PDF.
// =============================================================================

import { Printer, Download, CheckCircle2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import type { HousingUnit, HousingType, User, StaffProfile, TenancyAgreement, Occupancy } from '@/lib/mock-api/db';

interface Props {
  occupancy: Occupancy;
  agreement: TenancyAgreement | null;
  unit: HousingUnit;
  housingType: HousingType;
  user: User;
  profile: StaffProfile | null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 mb-3 pb-2 border-b-2 border-oau-navy print:border-black">
      <h2 className="text-base font-bold text-oau-navy uppercase tracking-widest print:text-black">
        {children}
      </h2>
    </div>
  );
}

function Clause({ number, children }: { number: string | number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 text-sm leading-relaxed text-foreground/80 print:text-black mb-3">
      <span className="font-semibold shrink-0 text-oau-navy print:text-black">{number}.</span>
      <p>{children}</p>
    </div>
  );
}

export function TenancyAgreementView({ occupancy, agreement, unit, housingType, user, profile }: Props) {
  const fullName = `${user.firstName} ${profile?.middleName ? profile.middleName + ' ' : ''}${user.lastName}`;

  function handlePrint() {
    window.print();
  }

  function handleSavePDF() {
    toast.info('💡 In the print dialog, select "Save as PDF" as the destination.', { duration: 6000 });
    setTimeout(() => window.print(), 400);
  }

  return (
    <>
      {/* ── Print-targeted global styles ── */}
      <style>{`
        @media print {
          /* Hide everything outside the document */
          body > *:not(#print-root) { display: none !important; }
          #print-root { display: block !important; }
          .print-hide { display: none !important; }
          .print-doc {
            position: fixed;
            top: 0; left: 0;
            width: 100%;
            padding: 2cm 2.5cm;
            background: white;
            color: black;
            font-size: 11pt;
            line-height: 1.7;
          }
          @page {
            size: A4 portrait;
            margin: 2cm 2.5cm;
          }
        }
      `}</style>

      {/* ── Screen action bar ── */}
      <div className="print-hide flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-oau-navy">Tenancy Agreement</h1>
          <p className="text-muted-foreground mt-1">
            Review your agreement and print or save as a PDF for your records.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {agreement?.signed && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Digitally Signed
            </div>
          )}
          <button
            id="save-pdf-btn"
            onClick={handleSavePDF}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-primary/30 text-primary hover:bg-primary/5 font-semibold text-sm transition-all"
          >
            <Download className="h-4 w-4" />
            Save as PDF
          </button>
          <button
            id="print-agreement-btn"
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm transition-all shadow-md shadow-primary/20"
          >
            <Printer className="h-4 w-4" />
            Print Agreement
          </button>
        </div>
      </div>

      {/* ── The printable document ── */}
      <div
        id="print-root"
        className="print-doc bg-white rounded-2xl border shadow-xl overflow-hidden"
      >
        {/* Letterhead */}
        <div className="bg-oau-navy text-oau-cream px-10 py-8 print:bg-white print:text-black print:border-b-4 print:border-black">
          <div className="flex items-center justify-between gap-8 flex-wrap">
            <div className="flex items-center gap-5">
              {/* Seal placeholder */}
              <div className="w-16 h-16 rounded-full border-4 border-oau-gold print:border-black flex items-center justify-center shrink-0">
                <FileText className="h-7 w-7 text-oau-gold print:text-black" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold leading-tight tracking-tight">
                  OBAFEMI AWOLOWO UNIVERSITY
                </h1>
                <p className="text-oau-gold print:text-black text-sm font-semibold tracking-wide">
                  ILE-IFE, OSUN STATE, NIGERIA
                </p>
                <p className="text-oau-cream/70 print:text-black/60 text-xs mt-0.5">
                  Department of Works &amp; Physical Planning — Housing Division
                </p>
              </div>
            </div>
            <div className="text-right text-sm space-y-1">
              <p className="font-bold text-oau-gold print:text-black">TENANCY AGREEMENT</p>
              <p className="text-oau-cream/70 print:text-black/60">Ref: {agreement?.id ?? occupancy.id}</p>
              <p className="text-oau-cream/70 print:text-black/60">
                Date: {formatDate(occupancy.checkInDate)}
              </p>
            </div>
          </div>
        </div>

        {/* Document body */}
        <div className="px-10 py-8 text-sm leading-relaxed">

          <div className="text-center mb-8">
            <h2 className="text-xl font-extrabold uppercase tracking-widest text-oau-navy print:text-black">
              Staff Housing Tenancy Agreement
            </h2>
            <p className="text-muted-foreground text-xs mt-1 print:text-black/60">
              This agreement is entered into pursuant to the OAU Staff Housing Policy (2021 Revised Edition)
            </p>
          </div>

          {/* Parties */}
          <SectionTitle>1. Parties to the Agreement</SectionTitle>
          <div className="grid md:grid-cols-2 gap-6 print:grid-cols-2">
            <div className="rounded-xl border bg-secondary/40 p-4 print:border print:bg-transparent print:p-0 print:rounded-none">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground print:text-black/60 mb-2">LANDLORD</p>
              <p className="font-semibold">Obafemi Awolowo University</p>
              <p className="text-muted-foreground text-xs print:text-black/60">PMB 13, Ile-Ife, Osun State</p>
              <p className="text-muted-foreground text-xs print:text-black/60">Represented by: The Registrar</p>
            </div>
            <div className="rounded-xl border bg-secondary/40 p-4 print:border print:bg-transparent print:p-0 print:rounded-none">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground print:text-black/60 mb-2">TENANT (STAFF)</p>
              <p className="font-semibold">{fullName}</p>
              <p className="text-muted-foreground text-xs print:text-black/60">Staff ID: {profile?.staffId ?? 'N/A'}</p>
              <p className="text-muted-foreground text-xs print:text-black/60">Department: {profile?.department ?? 'N/A'}</p>
              <p className="text-muted-foreground text-xs print:text-black/60">Email: {user.email}</p>
              <p className="text-muted-foreground text-xs print:text-black/60">Phone: {user.phoneNumber ?? 'N/A'}</p>
            </div>
          </div>

          {/* Property */}
          <SectionTitle>2. Description of Premises</SectionTitle>
          <div className="rounded-xl border bg-secondary/40 p-5 print:border print:bg-transparent print:p-0 print:rounded-none">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground print:text-black/60 font-semibold uppercase tracking-wider mb-1">Unit Name</p>
                <p className="font-bold text-lg">{unit.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground print:text-black/60 font-semibold uppercase tracking-wider mb-1">Housing Type</p>
                <p className="font-semibold">{housingType.name}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground print:text-black/60 font-semibold uppercase tracking-wider mb-1">Bedrooms</p>
                <p className="font-semibold">{housingType.numberOfBedrooms}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground print:text-black/60 font-semibold uppercase tracking-wider mb-1">Bathrooms</p>
                <p className="font-semibold">{housingType.numberOfBathrooms}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground print:text-black/60 font-semibold uppercase tracking-wider mb-1">BQ Units</p>
                <p className="font-semibold">{housingType.numberOfBQ} ({housingType.hasBQ ? 'Available' : 'None'})</p>
              </div>
            </div>
          </div>

          {/* Terms */}
          <SectionTitle>3. Terms of Tenancy</SectionTitle>
          <Clause number="3.1">
            The tenancy shall commence on <strong>{formatDate(occupancy.checkInDate)}</strong> and shall 
            continue on a year-to-year basis, subject to the Tenant&apos;s continued employment at 
            Obafemi Awolowo University and compliance with all terms herein.
          </Clause>
          <Clause number="3.2">
            The annual rent is <strong>₦{housingType.annualRent.toLocaleString()}</strong> (Standard Rate), 
            payable in advance by salary deduction or direct payment to the University Bursary not 
            later than the 1st day of each occupancy year.
          </Clause>
          <Clause number="3.3">
            This agreement shall automatically terminate upon the cessation of the Tenant&apos;s 
            employment with the University, by whatever means, and the Tenant shall vacate the 
            premises within thirty (30) days of such cessation.
          </Clause>
          <Clause number="3.4">
            The Landlord reserves the right to re-allocate or reassign housing units in accordance 
            with the prevailing Staff Housing Policy. Reasonable notice of no less than sixty (60) 
            days shall be given in all cases except emergency.
          </Clause>

          {/* Obligations */}
          <SectionTitle>4. Obligations of the Tenant</SectionTitle>
          <Clause number="4.1">
            The Tenant shall maintain the premises in good and tenantable condition and shall not 
            carry out any structural alterations, additions, or improvements without the prior written 
            consent of the Director of Works &amp; Physical Planning.
          </Clause>
          <Clause number="4.2">
            The Tenant shall not sublet the whole or any part of the premises. Boys Quarters (BQ) 
            sub-occupancy is permitted only for domestic staff or immediate family members registered 
            through the E-Housing Portal, subject to the maximum occupancy limit per unit.
          </Clause>
          <Clause number="4.3">
            The Tenant shall grant access to authorised University personnel for inspection purposes 
            on reasonable notice of no less than 48 hours, except in cases of emergency.
          </Clause>
          <Clause number="4.4">
            The Tenant shall bear the cost of minor repairs (not exceeding ₦50,000) resulting from 
            damage caused by misuse, negligence, or improper use of the premises or its fixtures.
          </Clause>
          <Clause number="4.5">
            On or before vacating the premises, the Tenant shall pass all three-stage exit 
            inspections (Housing, Electrical, and Estate) as prescribed by the University&apos;s 
            Exit Clearance Policy. Failure to obtain clearance may result in financial liability.
          </Clause>

          {/* Obligations of Landlord */}
          <SectionTitle>5. Obligations of the Landlord</SectionTitle>
          <Clause number="5.1">
            The University shall maintain the structural integrity of the premises and shall be 
            responsible for major repairs to roofing, plumbing, and electrical infrastructure.
          </Clause>
          <Clause number="5.2">
            The University shall provide reasonable access to communal amenities in accordance with 
            the Staff Housing Policy and available University resources.
          </Clause>

          {/* Termination */}
          <SectionTitle>6. Termination &amp; Exit Procedure</SectionTitle>
          <Clause number="6.1">
            The Tenant must submit a Housing Exit Notice through the E-Housing Portal at least thirty 
            (30) days before the intended vacating date. Early submission is strongly advised to allow 
            for scheduling of all three inspection stages.
          </Clause>
          <Clause number="6.2">
            A Clearance Certificate shall only be issued after all three inspection stages have been 
            marked as PASSED. Outstanding repairs or damages identified during inspection must be 
            remedied by the Tenant at their own cost before clearance is granted.
          </Clause>

          {/* Signatures */}
          <SectionTitle>7. Signatures</SectionTitle>
          <div className="grid md:grid-cols-2 gap-10 mt-6 print:grid-cols-2">
            <div className="space-y-8">
              <div>
                <div className="border-b-2 border-foreground/30 print:border-black mb-2 h-12" />
                <p className="text-sm font-semibold">{fullName}</p>
                <p className="text-xs text-muted-foreground print:text-black/60">Tenant — {profile?.rank ?? 'Staff'}</p>
                <p className="text-xs text-muted-foreground print:text-black/60">Date: {formatDate(occupancy.checkInDate)}</p>
              </div>
            </div>
            <div className="space-y-8">
              <div>
                <div className="border-b-2 border-foreground/30 print:border-black mb-2 h-12" />
                <p className="text-sm font-semibold">The Registrar / Authorised Representative</p>
                <p className="text-xs text-muted-foreground print:text-black/60">On behalf of OAU University Council</p>
                <p className="text-xs text-muted-foreground print:text-black/60">Date: ___________________</p>
              </div>
            </div>
          </div>

          {/* Official stamp area */}
          <div className="mt-12 flex items-center justify-center">
            <div className="w-28 h-28 rounded-full border-4 border-dashed border-muted-foreground/30 print:border-black/30 flex items-center justify-center">
              <div className="text-center">
                <p className="text-xs font-bold text-muted-foreground print:text-black/50 uppercase tracking-wider">Official</p>
                <p className="text-xs font-bold text-muted-foreground print:text-black/50 uppercase tracking-wider">Stamp</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 pt-6 border-t text-center space-y-1 print:border-black">
            <p className="text-[11px] text-muted-foreground print:text-black/50">
              This document was generated by the OAU E-Housing Portal. Agreement ID: {agreement?.id ?? 'N/A'}
            </p>
            <p className="text-[11px] text-muted-foreground print:text-black/50">
              {agreement?.signed
                ? '✓ Digitally confirmed on system. Physical signature required for full legal effect.'
                : 'Pending signature. Please sign and return a physical copy to the Housing Secretariat.'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
