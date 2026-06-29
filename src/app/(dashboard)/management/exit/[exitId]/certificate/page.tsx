import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getExitNoticeById } from '@/lib/mock-api/endpoints/exit';
import { mockDB } from '@/lib/mock-api/db';
import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';

export const metadata = { title: 'Clearance Certificate — OAU E-Housing' };

const MANAGEMENT_ROLES = [
  'SUPER_ADMIN', 'HOUSING_SECRETARY', 'ELECTRICAL_OFFICER', 'ESTATE_OFFICER',
] as const;
type ManagementRole = typeof MANAGEMENT_ROLES[number];

interface Props {
  params: Promise<{ exitId: string }>;
}

export default async function ClearanceCertificatePage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (!MANAGEMENT_ROLES.includes(session.user.role as ManagementRole)) redirect('/staff');

  const { exitId } = await params;
  const notice = await getExitNoticeById(exitId);
  if (!notice || !notice.isCleared) notFound();

  const staff = mockDB.findUserById(notice.userId);
  const staffProfile = mockDB.findProfileByUserId(notice.userId);
  const unit = mockDB.findUnitById(notice.housingUnitId);
  const housingType = unit ? mockDB.housingTypes.find(t => t.id === unit.housingTypeId) : null;

  // Inspectors
  const housingInspector = notice.housingInspectedById ? mockDB.findUserById(notice.housingInspectedById) : null;
  const electricalInspector = notice.electricalInspectedById ? mockDB.findUserById(notice.electricalInspectedById) : null;
  const estateInspector = notice.estateInspectedById ? mockDB.findUserById(notice.estateInspectedById) : null;

  // Certificate number derived deterministically
  const certNumber = `OAU/CLR/${new Date(notice.submittedAt).getFullYear()}/${exitId.slice(-6).toUpperCase()}`;

  const occupancy = mockDB.occupancies.find(
    o => o.userId === notice.userId && o.housingUnitId === notice.housingUnitId
  );

  function fmt(dateStr: string | null | undefined, opts?: Intl.DateTimeFormatOptions) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', opts ?? {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  return (
    <>
      {/* Screen-only controls */}
      <div className="print:hidden flex items-center justify-between gap-4 mb-8 max-w-4xl">
        <Link
          href={`/management/exit/${exitId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Exit Notice
        </Link>
        <button
          onClick={() => { if (typeof window !== 'undefined') window.print(); }}
          suppressHydrationWarning
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-oau-navy text-oau-cream text-sm font-semibold hover:bg-oau-navy/90 transition shadow-md"
        >
          <Printer className="h-4 w-4" />
          Print Certificate
        </button>
      </div>

      {/* ============================================================
          CERTIFICATE — Print-optimised
          ============================================================ */}
      <div
        id="clearance-certificate"
        className="max-w-4xl mx-auto bg-white text-gray-900 rounded-2xl shadow-xl overflow-hidden print:shadow-none print:rounded-none"
      >
        {/* Header band */}
        <div className="bg-oau-navy px-10 py-8 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/oaulogo.png" alt="OAU Logo" width={64} height={64} className="object-contain" />
            <div className="text-left">
              <p className="text-oau-gold font-bold text-lg leading-tight">Obafemi Awolowo University</p>
              <p className="text-oau-cream/80 text-sm">Ile-Ife, Osun State, Nigeria</p>
              <p className="text-oau-cream/60 text-xs">Housing Management Division — E-Housing Portal</p>
            </div>
          </div>
          <div className="border-t border-oau-gold/30 pt-4">
            <h1 className="text-2xl font-extrabold text-oau-gold tracking-wide uppercase">
              Housing Clearance Certificate
            </h1>
            <p className="text-oau-cream/70 text-xs mt-1 tracking-widest">
              CERT. NO: {certNumber}
            </p>
          </div>
        </div>

        {/* Gold accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-oau-gold via-amber-300 to-oau-gold" />

        {/* Certificate body */}
        <div className="px-12 py-10 space-y-8">

          {/* Preamble */}
          <div className="text-center text-sm leading-relaxed text-gray-600 border-b pb-6">
            <p>
              This is to certify that the staff member named herein has satisfactorily completed
              all required departure inspections and has been granted full clearance from university
              housing premises in accordance with the OAU Housing Management Regulations.
            </p>
          </div>

          {/* Staff Details */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-oau-navy mb-4 flex items-center gap-2">
              <span className="h-px flex-1 bg-border" />
              Staff Information
              <span className="h-px flex-1 bg-border" />
            </h2>
            <div className="grid grid-cols-2 gap-5 text-sm">
              {[
                { label: 'Full Name', value: staff ? `${staff.firstName} ${staff.lastName}` : '—' },
                { label: 'Email Address', value: staff?.email ?? '—' },
                { label: 'Staff ID', value: staffProfile?.staffId ?? '—' },
                { label: 'Rank / Grade', value: staffProfile ? `${staffProfile.rank} · ${staffProfile.salaryGradeLevel}` : '—' },
                { label: 'Faculty', value: staffProfile?.faculty ?? '—' },
                { label: 'Department', value: staffProfile?.department ?? '—' },
              ].map(row => (
                <div key={row.label} className="border-b border-dashed pb-2">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">{row.label}</p>
                  <p className="font-semibold text-gray-800 mt-0.5">{row.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Property Details */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-oau-navy mb-4 flex items-center gap-2">
              <span className="h-px flex-1 bg-border" />
              Property Details
              <span className="h-px flex-1 bg-border" />
            </h2>
            <div className="grid grid-cols-2 gap-5 text-sm">
              {[
                { label: 'Housing Unit', value: unit?.name ?? '—' },
                { label: 'Housing Type', value: housingType?.name ?? '—' },
                { label: 'Exit Reason', value: notice.reason.replace('_', ' ') },
                { label: 'Check-In Date', value: fmt(occupancy?.checkInDate) },
                { label: 'Check-Out Date', value: fmt(occupancy?.checkOutDate) },
                { label: 'Clearance Date', value: fmt(notice.clearedAt) },
              ].map(row => (
                <div key={row.label} className="border-b border-dashed pb-2">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">{row.label}</p>
                  <p className="font-semibold text-gray-800 mt-0.5 capitalize">{row.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Inspection Sign-offs */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-oau-navy mb-4 flex items-center gap-2">
              <span className="h-px flex-1 bg-border" />
              Inspection Sign-offs
              <span className="h-px flex-1 bg-border" />
            </h2>
            <div className="grid grid-cols-3 gap-4 text-sm">
              {[
                {
                  stage: 'Housing Unit',
                  inspector: housingInspector ? `${housingInspector.firstName} ${housingInspector.lastName}` : '—',
                  role: 'Housing Secretary',
                  date: fmt(notice.housingInspectionDate, { day: 'numeric', month: 'short', year: 'numeric' }),
                },
                {
                  stage: 'Electrical / Power',
                  inspector: electricalInspector ? `${electricalInspector.firstName} ${electricalInspector.lastName}` : '—',
                  role: 'Electrical Officer',
                  date: fmt(notice.electricalInspectionDate, { day: 'numeric', month: 'short', year: 'numeric' }),
                },
                {
                  stage: 'Estate Office',
                  inspector: estateInspector ? `${estateInspector.firstName} ${estateInspector.lastName}` : '—',
                  role: 'Estate Officer',
                  date: fmt(notice.estateInspectionDate, { day: 'numeric', month: 'short', year: 'numeric' }),
                },
              ].map(sig => (
                <div key={sig.stage} className="border border-emerald-200 rounded-xl bg-emerald-50 p-4 text-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-2">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">{sig.stage}</p>
                  <p className="font-semibold text-gray-800 text-sm mt-2">{sig.inspector}</p>
                  <p className="text-xs text-gray-500">{sig.role}</p>
                  <p className="text-xs text-emerald-600 font-medium mt-1">{sig.date}</p>
                  {/* Signature line */}
                  <div className="mt-4 border-t-2 border-dashed border-emerald-300 pt-1">
                    <p className="text-xs text-gray-400">Signature / Seal</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Official seal / footer */}
          <div className="border-t pt-6 mt-6 grid grid-cols-2 gap-6 items-end">
            <div className="text-xs text-gray-400 space-y-1">
              <p>Certificate No: <span className="font-mono font-bold text-gray-600">{certNumber}</span></p>
              <p>Issue Date: <span className="font-semibold text-gray-600">{fmt(notice.clearedAt)}</span></p>
              <p>Generated by: OAU E-Housing Digital Platform</p>
            </div>
            <div className="text-right">
              <div className="inline-block border-2 border-oau-navy rounded-xl px-6 py-3 text-center">
                <p className="text-xs text-oau-navy font-bold uppercase tracking-widest mb-1">Official Stamp</p>
                <p className="text-xs text-muted-foreground">Housing Management Division</p>
                <p className="text-xs font-semibold text-oau-navy mt-1">OAU, Ile-Ife</p>
              </div>
            </div>
          </div>

          {/* Legal note */}
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-xs text-gray-500 text-center">
            This certificate is digitally generated and is valid without a physical signature unless otherwise requested.
            For verification, contact the Housing Management Division at housing@oauife.edu.ng
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          #clearance-certificate {
            box-shadow: none !important;
            border-radius: 0 !important;
            max-width: 100% !important;
          }
          .print\\:hidden { display: none !important; }
          @page { margin: 1cm; size: A4; }
        }
      `}</style>
    </>
  );
}
