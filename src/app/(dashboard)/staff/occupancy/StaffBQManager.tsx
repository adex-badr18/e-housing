'use client';

import { useState, useTransition, FormEvent } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit2, Trash2, Home, User } from 'lucide-react';
import { addBQOccupantAction, updateBQOccupantAction, removeBQOccupantAction } from '@/app/actions/housing';


interface BQData {
  id: string;
  label: string;
}

interface OccupantData {
  id: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  relationship: string;
}

export function StaffBQManager({
  bqs,
  bqOccupants,
}: {
  bqs: BQData[];
  bqOccupants: OccupantData[];
}) {
  const [isPending, startTransition] = useTransition();
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: 'ADD' | 'EDIT';
    bqId?: string;
    occupantId?: string;
  }>({ isOpen: false, mode: 'ADD' });

  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    relationship: '',
  });

  const openAddModal = (bqId: string) => {
    setFormData({ fullName: '', phoneNumber: '', email: '', relationship: '' });
    setModalState({ isOpen: true, mode: 'ADD', bqId });
  };

  const openEditModal = (occupant: OccupantData) => {
    setFormData({
      fullName: occupant.fullName,
      phoneNumber: occupant.phoneNumber,
      email: occupant.email || '',
      relationship: occupant.relationship,
    });
    setModalState({ isOpen: true, mode: 'EDIT', occupantId: occupant.id });
  };

  const handleRemove = (occupantId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from this BQ?`)) return;

    startTransition(async () => {
      const res = await removeBQOccupantAction(occupantId);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success('BQ occupant removed successfully.');
      }
    });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phoneNumber || !formData.relationship) {
      toast.error('Please fill in all required fields');
      return;
    }

    startTransition(async () => {
      try {
        if (modalState.mode === 'ADD') {
          const res = await addBQOccupantAction({
            bqId: modalState.bqId,
            ...formData,
          });
          if (res?.error) throw new Error(res.error);
          toast.success('Occupant added successfully');
        } else if (modalState.mode === 'EDIT' && modalState.occupantId) {
          const res = await updateBQOccupantAction(modalState.occupantId, formData);
          if (res?.error) throw new Error(res.error);
          toast.success('Occupant updated successfully');
        }
        setModalState({ isOpen: false, mode: 'ADD' });
      } catch (err: any) {
        toast.error(err.message || 'Something went wrong');
      }
    });
  };

  if (bqs.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden mt-6">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
            <Home className="h-4 w-4" />
          </div>
          <h2 className="text-base font-semibold text-gray-800">Boys Quarters (BQ) Occupants</h2>
        </div>
        <div className="px-5 py-4">
          <p className="text-base text-gray-500 italic py-2 text-center">No BQs attached to this housing unit.</p>
        </div>
      </div>
    );
  }

  // Enforce Max 1 BQ restriction per the user request
  const displayBqs = bqs.slice(0, 1);

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden mt-6">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
            <Home className="h-4 w-4" />
          </div>
          <h2 className="text-base font-semibold text-gray-800">Boys Quarters (BQ) Occupants</h2>
        </div>
        <div className="px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {displayBqs.map(bq => {
              // Find active occupant for this bq
              const bqOcc = bqOccupants.find(o => (o as any).bqId === bq.id);
              
              return (
                <div key={bq.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-start gap-4 justify-between sm:col-span-2">
                  <div className="flex items-start gap-3 w-full">
                    <div className="bg-white p-2 border border-gray-200 rounded-lg shrink-0 shadow-sm">
                      <User className="h-6 w-6 text-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-semibold text-gray-800">{bq.label}</span>
                        <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${bqOcc ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600'}`}>
                          {bqOcc ? 'OCCUPIED' : 'VACANT'}
                        </span>
                      </div>
                      {bqOcc ? (
                        <div className="text-base text-gray-600 mt-1 space-y-0.5">
                          <p className="font-semibold text-base text-gray-900">{bqOcc.fullName}</p>
                          <p className="text-gray-500">Relationship: <span className="font-medium text-gray-700">{bqOcc.relationship}</span></p>
                          <p className="text-gray-500">Phone: <span className="font-medium text-gray-700">{bqOcc.phoneNumber}</span></p>
                          {bqOcc.email && <p className="text-gray-500">Email: <span className="font-medium text-gray-700">{bqOcc.email}</span></p>}
                        </div>
                      ) : (
                        <p className="text-base text-gray-400 italic mt-1">Available for allocation. Click "Add Occupant" to assign someone.</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex sm:flex-col gap-2 shrink-0 mt-3 sm:mt-0 w-full sm:w-auto">
                    {bqOcc ? (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-9 text-base flex-1 sm:flex-none justify-start"
                          onClick={() => openEditModal(bqOcc)}
                          disabled={isPending}
                        >
                          <Edit2 className="h-4 w-4 mr-2 text-blue-600" />
                          Update
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-9 text-base flex-1 sm:flex-none justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemove(bqOcc.id, bqOcc.fullName)}
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="default"
                        className="h-9 text-base w-full justify-start bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={() => openAddModal(bq.id)}
                        disabled={isPending}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Occupant
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Dialog open={modalState.isOpen} onOpenChange={(open) => !open && setModalState({ isOpen: false, mode: 'ADD' })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{modalState.mode === 'ADD' ? 'Add BQ Occupant' : 'Update BQ Occupant'}</DialogTitle>
            <DialogDescription>
              {modalState.mode === 'ADD' 
                ? 'Enter the details of the person occupying this Boys Quarters unit.' 
                : 'Update the details of the current BQ occupant.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={onSubmit} className="space-y-4 pt-4">
            <div>
              <label className="text-base font-medium mb-1 block">Full Name</label>
              <Input 
                required 
                placeholder="e.g. John Doe" 
                value={formData.fullName} 
                onChange={(e) => setFormData(p => ({ ...p, fullName: e.target.value }))} 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-base font-medium mb-1 block">Phone Number</label>
                <Input 
                  required 
                  placeholder="e.g. 08012345678" 
                  value={formData.phoneNumber} 
                  onChange={(e) => setFormData(p => ({ ...p, phoneNumber: e.target.value }))} 
                />
              </div>
              <div>
                <label className="text-base font-medium mb-1 block">Relationship</label>
                <Input 
                  required 
                  placeholder="e.g. Domestic Staff" 
                  value={formData.relationship} 
                  onChange={(e) => setFormData(p => ({ ...p, relationship: e.target.value }))} 
                />
              </div>
            </div>

            <div>
              <label className="text-base font-medium mb-1 block">Email (Optional)</label>
              <Input 
                type="email" 
                placeholder="e.g. john@example.com" 
                value={formData.email} 
                onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} 
              />
            </div>

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setModalState({ isOpen: false, mode: 'ADD' })}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="bg-oau-navy text-white hover:bg-oau-navy/90">
                {isPending ? 'Saving...' : modalState.mode === 'ADD' ? 'Add Occupant' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
