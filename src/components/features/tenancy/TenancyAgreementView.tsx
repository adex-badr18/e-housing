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

export function TenancyAgreementView({ agreement }: Props) {

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
          /* 1. Hide non-essential layout elements */
          .print-hide { display: none !important; }
          .flex.h-screen > :not(.flex-1) { display: none !important; }
          .flex.h-screen > .flex-1 > :not(main) { display: none !important; }

          /* 2. Reset height and overflow to allow natural pagination */
          html, body, body > div, .flex.h-screen, .flex-1, main {
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            position: static !important;
            display: block !important;
          }

          /* 3. Strip out layout paddings */
          main, body, html {
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }

          /* 4. Format the document container — padding acts as page margins */
          #print-root {
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 2cm !important;
            width: 100% !important;
            border-radius: 0 !important;
            box-sizing: border-box !important;
          }

          /* Zero out @page margins so the browser doesn't add its own on top */
          @page {
            size: A4 portrait;
            margin: 0;
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
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Digitally Signed
            </div>
          )}
          <button
            id="save-pdf-btn"
            onClick={handleSavePDF}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-primary/30 text-primary hover:bg-primary/5 font-semibold text-base transition-all"
          >
            <Download className="h-4 w-4" />
            Save as PDF
          </button>
          <button
            id="print-agreement-btn"
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-base transition-all shadow-md shadow-primary/20"
          >
            <Printer className="h-4 w-4" />
            Print Agreement
          </button>
        </div>
      </div>

      {/* ── The printable document ── */}
      <div
        id="print-root"
        className="print-doc bg-white rounded-2xl border shadow-xl overflow-hidden font-serif"
      >
        <div className="px-10 py-12 print:px-0 print:py-0 print:m-0 text-base leading-relaxed text-black">
          <div className="text-center font-bold mb-8 space-y-1">
            <h1 className="text-xl underline uppercase">OBAFEMI AWOLOWO UNIVERSITY, ILE-IFE</h1>
            <h2 className="text-lg">TENANCY AGREEMENT (2017)</h2>
          </div>

          <p className="mb-6 text-justify leading-loose">
            AN AGREEMENT is made the………. day of………………………20…… BETWEEN the OBAFEMI AWOLOWO UNIVERSITY, ILE-IFE, Nigeria, an institution of higher learning created by Statute (hereinafter called &quot;the University&quot;) of the one part AND ……………………………………………………………………………
            <br />
            ……………………………………………………. (HEREINAFTER CALLED &quot;THE occupant&quot;) of the other part.
          </p>

          <p className="font-bold mb-2 uppercase">WHEREAS</p>
          <div className="space-y-4 mb-6 text-justify">
            <p>The occupant is the employee/staff of the Obafemi Awolowo University.</p>
            <div className="flex gap-4">
              <span className="font-bold">II.</span>
              <p>It is desirous and the University has agreed subject to the terms and conditions following to allocate to the occupant the premises described in the schedule hereto.</p>
            </div>
            <div className="flex gap-4">
              <span className="font-bold">III.</span>
              <p>The premises allocated is tied solely, and only to the period during which the occupant shall continue to be in the employment of the University.</p>
            </div>
            <div className="flex gap-4">
              <span className="font-bold">IV.</span>
              <p>The premises allocated to the occupant is for the purposes of enhancing his welfare to the end that he is committed to his duties as employee/staff of the University by being conveniently lodged/situated his/her employment.</p>
            </div>
          </div>

          <p className="font-bold mb-4 uppercase">NOW THIS AGREEMENT WITNESSETH AS FOLLOWS:</p>
          <div className="space-y-4 mb-6 text-justify">
            <p>
              The University hereby agrees to let to the occupant, and the occupant hereby agrees to take a yearly rent of…................................................................................................................................................................Naira) Nigerian currency subject to the stipulations and agreements hereto (hereinafter called &quot;the Premises&quot;) from the month of checking into the house, for the period of his/her employment determinable as hereinafter mentioned.
            </p>
            <p>
              The Occupant shall pay for the agreed rent for premises on monthly basis through deductions from the occupant&apos;s monthly salary commencing from the month of checking into the house.
            </p>
          </div>

          <p className="font-bold mb-4">3. The Occupant hereby covenants with the University as follows:</p>
          <ol className="list-[lower-alpha] pl-8 space-y-3 mb-6 pr-4 text-justify">
            <li>To pay the said rent at the times and in the manner aforesaid;</li>
            <li>To pay the University the cost of electricity that may be used by the occupant on the demised premises during the tenancy as may be ascribed and/or computed from time to time by the University;</li>
            <li>To use the demised premises solely as private residences;</li>
            <li>The Occupant shall not make any additional extension or alteration to the premises without the approval of the University Administration;</li>
            <li>To keep the premises including the ground in good and tenantable condition.</li>
            <li>Not to do or permit or suffer to be done on the demised Premises any act or thing which shall or may constitute a nuisance to the University or to the occupiers of the adjoining Premises and neighbors</li>
            <li>Not to sublet or part with possession of the premises or any part thereof under any conditions whatsoever;</li>
            <li>If the occupant shall retire voluntarily or compulsorily from his employment, he shall be allowed three months effective from the date his retirement takes effect to remain in occupations to allow him to process his/her clearance papers upon his/her request and to vacate and yield up vacant possession of the premises. ANY FURTHER EXTENSION OF STAY SHALL BE PREMISED ON AN UPFRONT PAYMENT OF ECONOMIC RENT WHICH SHALL BE FIVE TIMES THE CURRENT RENT RATE.</li>
            <li>If the occupant shall fail, or neglect to vacate his/her premises at the expiration of three months after his retirement or at the end of the additional three months as may be granted on compassionate ground by the University, then the University shall be at liberty to take reasonable steps to eject the occupant therefrom including but not limited to evacuating the occupant&apos;s properties from the premises, changing the locks thereof and or effectively allocating the premises to any other occupant(s) as the University may deem fit in its absolute discretion and for the avoidance of doubt it is hereby further agreed that any such steps shall not make the University liable for any loss or damages arising from or connected &apos;with such steps;</li>
            <li>If the occupant shall be dismissed from the service for any reason whatsoever or if he/she shall fail or neglect to resume from any approved leave without any approval then the occupant shall forfeit his/her premises immediately and upon any failure, refusal or neglect in vacating his/her premises, the University shall be at liberty to take any steps it deems fit to effectively eject the occupant therefrom including, but not limited to, evacuating the occupant&apos;s properties from the premises, changing the locks thereof and or effectively allocating the premises to any other occupant(s) as the: University may deem fit in its absolute discretion and for the avoidance of doubt it is hereby further agreed that any such steps shall not make the University liable for any loss or damages arising from or connected with such steps to eject the occupant therefrom;</li>
            <li>If the Occupant is dismissed, resigns or withdraws, from the service of the University and shall for any reason whatsoever abandons his/her premises the Housing and Allocating Committee shall formally, notify him/her to vacate his/her premises within thirty (30) days and shall simultaneously allocate the occupant&apos;s premises to another staff who shall take possession immediately the occupant shall have yield possession or at the expiration of the thirty-day period whichever is sooner:</li>
            <li>If the occupant is liable for the breach of any of the covenants in this clause (clause 3) or of clause 5 (c) of these presents, then the Housing and Allocating Committee shall formally notify him/her to vacate his/her premises within thirty (30) days and shall simultaneously allocate the occupant&apos;s premises, to another staff who shall take possession immediately the occupant shall have yielded possession or at the expiration of the thirty-day period whichever is sooner, PROVIDED that the question whether the occupant is liable or not for the breach of his/her covenants shall be determined solely by the Housing and Allocating Committee whose decision shall be final.</li>
            <li>Not to organize noisy parties in the premises;</li>
            <li>Not to take in lodgers or paying guests and not to carry-on in the premises any trade, profession or business whatsoever.</li>
            <li>Rearing of animals is prohibited within the residential areas. Stray animals/pets will be killed.</li>
            <li>Not to assign, sublet/underlet or otherwise part with possession of the premises or any part thereof (including the Boys quarters), without the written consent of the Housing Allocating Committee.</li>
            <li>To keep the interior of the premises and fixtures thereof in good and tenantable condition (fair wear and tear and damage by act of God excepted). At the expiration or determination of the said term to yield up peaceably to the University the premises with all the fixtures (except occupant&apos;s fixtures) and addition thereto in such repair and condition.</li>
            <li>Clearing of lawns and bush within a residential area is the responsibility of Occupants.</li>
            <li>To abide by whatever regulations concerning the tenancy that the University may decide upon from time to time.</li>
          </ol>

          <p className="font-bold mb-4">4. The University hereby agrees with the occupant as follows:</p>
          <ol className="list-[lower-alpha] pl-8 space-y-3 mb-6 pr-4 text-justify">
            <li>To make the premises fit for habitation and free from dangerous defects upon taking up tenancy;</li>
            <li>To maintain external facilities that is, roads, water distribution, security, etc. at the premises at all times;</li>
            <li>To pay all present and future rates taxes assessment and outgoing payable in respect of the premises;</li>
            <li>To carry out all capital maintenance on the building;</li>
            <li>To guarantee quiet enjoyment of the premises without any interruption by the University, except on occasions where there are security concerns;</li>
            <li>To be responsible for insuring the premises against fire and other hazards.</li>
          </ol>

          <p className="font-bold mb-4">5. The parties hereby further agree:</p>
          <ol className="list-[lower-alpha] pl-8 space-y-3 mb-8 pr-4 text-justify">
            <li>Subject to sub-paragraphs (f), (g), (h), (i), (j), (k) and (i) of clause 3 of this Agreement, and only in cases where the parties&apos; desires to terminate the tenancy on grounds other than those stated in the afore-mentioned sub-paragraphs of clause three then the tenancy may be determined by either party given to the other three or six months&apos; notice, as the case may be, in advance;</li>
            <li>So long as the occupant continues in the employment of the University and for the purpose only of the Occupant being more conveniently situated in his/her said employment the tenancy shall subsist subject nevertheless to the covenants, terms and conditions of these presents but shall terminate automatically on the occasion of the said employment for any reason whatsoever and or on sooner termination of the tenancy as provided in this agreement and the Occupant shall vacate the demised Premises immediately thereafter.</li>
            <li>If the rent hereby reserved or any part thereof shall be unpaid for 14 days after becoming payable whether formally demanded or not or if the occupant shall commit any breach of his covenants or obligations under this Agreement, then University may re-enter upon the Premises or any part thereof in the name of the whole and the tenancy shall immediately terminate without any Notice;</li>
            <li>If the University shall commit any breach of its obligation under this Agreement, the Occupant may terminate the tenancy without any Notice;</li>
            <li>The rent reserved herein before is subject to periodic review and the new rent shall become payable by the Occupant on the expiry of appropriate Notice to be issued by the University or its agents:</li>
          </ol>

          <p className="font-bold mb-8 uppercase text-justify">
            IN WITNESS WHEREOF THE PARTIES hereto have set their hands and seals the day and year first above-written.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 text-base pb-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="font-bold">SIGNED, STAMPED AND DELIVERED by the</p>
                <p>Obafemi Awolowo University, lle-Ife.</p>
                <div className="h-12"></div>
                <p className="font-bold">Secretary, Housing Allocating Committee</p>
              </div>
              <div className="space-y-3">
                <p className="font-bold">In the presence of:</p>
                <p>Signature: <span className="inline-block w-48 border-b border-black"></span></p>
                <p>Name: <span className="inline-block w-[210px] border-b border-black"></span></p>
                <p>Address: <span className="underline">Estate Office, Division of Works and Maintenance Services.</span></p>
                <p>Occupation: <span className="underline">Estate Surveying and Valuation</span></p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <p className="font-bold">SIGNED, SEALED AND DELIVERED</p>
                <p>On behalf of the within named Occupant:</p>
                <p className="mt-4">Signature: ...................................................................................</p>
                <p>Department/Unit: ......................................................................</p>
              </div>
              <div className="space-y-3 mt-6">
                <p className="font-bold">In the presence of: (Head of Department/Unit)</p>
                <p>Signature: ...................................................................................</p>
                <p>Name: ..........................................................................................</p>
                <p>Address: .......................................................................................</p>
                <p>Occupation:  ...............................................................................</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
