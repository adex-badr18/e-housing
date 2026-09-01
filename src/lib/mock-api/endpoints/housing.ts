// =============================================================================
// Mock API — Housing Endpoint
// Covers: Housing Types, Housing Units, BQs, and BQ Occupants
// =============================================================================
// Access-control legend (enforced at server-action layer, mirrored here):
//   Create/Edit HousingType  → SUPER_ADMIN, HOUSING_SECRETARY, ESTATE_OFFICER
//   Create/Edit HousingUnit  → SUPER_ADMIN, HOUSING_SECRETARY, ESTATE_OFFICER
//   Add/Remove BQOccupant    → STAFF (the main occupant)
// =============================================================================

import {
  mockDB,
  HousingType,
  HousingUnit,
  BQ,
  BQOccupant,
  UnitStatus,
} from '../db';

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// HOUSING TYPES
// ---------------------------------------------------------------------------

export async function getAllHousingTypes(): Promise<HousingType[]> {
  await delay(200);
  return [...mockDB.housingTypes];
}

export async function getActiveHousingTypes(): Promise<HousingType[]> {
  await delay(200);
  return mockDB.housingTypes.filter(ht => ht.isActive);
}

export async function getHousingTypeById(id: string): Promise<HousingType | null> {
  await delay(200);
  return mockDB.housingTypes.find(ht => ht.id === id) ?? null;
}

export async function createHousingType(
  data: Omit<HousingType, 'id' | 'createdAt' | 'updatedAt'>
): Promise<HousingType> {
  await delay(400);
  const now = new Date().toISOString();
  const newType: HousingType = {
    id: mockDB.generateId('ht'),
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  mockDB.housingTypes.push(newType);
  return newType;
}

export async function updateHousingType(
  id: string,
  data: Partial<Omit<HousingType, 'id' | 'createdAt'>>
): Promise<HousingType> {
  await delay(400);
  const idx = mockDB.housingTypes.findIndex(ht => ht.id === id);
  if (idx === -1) throw new Error(`HousingType ${id} not found`);
  mockDB.housingTypes[idx] = {
    ...mockDB.housingTypes[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  return mockDB.housingTypes[idx];
}

export async function deleteHousingType(id: string): Promise<void> {
  await delay(300);
  const hasUnits = mockDB.housingUnits.some(u => u.housingTypeId === id);
  if (hasUnits) {
    throw new Error('Cannot delete a housing type that has units assigned to it');
  }
  mockDB.housingTypes = mockDB.housingTypes.filter(ht => ht.id !== id);
}

export async function bulkCreateHousingTypes(
  rows: Omit<HousingType, 'id' | 'createdAt' | 'updatedAt'>[]
): Promise<{
  created: HousingType[];
  duplicatesUpdated: HousingType[];
  errors: { row: number; message: string }[];
}> {
  await delay(400);
  const created: HousingType[] = [];
  const duplicatesUpdated: HousingType[] = [];
  const errors: { row: number; message: string }[] = [];
  const now = new Date().toISOString();

  rows.forEach((row, index) => {
    try {
      const existingIdx = mockDB.housingTypes.findIndex(
        ht => ht.name.toLowerCase() === row.name.toLowerCase()
      );
      if (existingIdx !== -1) {
        // Update existing record
        mockDB.housingTypes[existingIdx] = {
          ...mockDB.housingTypes[existingIdx],
          ...row,
          updatedAt: now,
        };
        duplicatesUpdated.push(mockDB.housingTypes[existingIdx]);
      } else {
        // Create new record
        const newType: HousingType = {
          id: mockDB.generateId('ht'),
          ...row,
          createdAt: now,
          updatedAt: now,
        };
        mockDB.housingTypes.push(newType);
        created.push(newType);
      }
    } catch (err) {
      errors.push({
        row: index + 1,
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  });

  return { created, duplicatesUpdated, errors };
}


// ---------------------------------------------------------------------------
// HOUSING UNITS
// ---------------------------------------------------------------------------

export async function getAllHousingUnits(): Promise<HousingUnit[]> {
  await delay(300);
  return [...mockDB.housingUnits];
}

export async function getHousingUnitById(id: string): Promise<HousingUnit | null> {
  await delay(200);
  return mockDB.housingUnits.find(u => u.id === id) ?? null;
}

export async function getVacantHousingUnits(): Promise<HousingUnit[]> {
  await delay(200);
  return mockDB.housingUnits.filter(u => u.status === 'VACANT');
}

/** Returns a unit with its BQs and each BQ's occupants embedded */
export async function getHousingUnitWithBQs(unitId: string): Promise<{
  unit: HousingUnit;
  bqs: Array<BQ & { occupant: BQOccupant | null }>;
} | null> {
  await delay(300);
  const unit = mockDB.housingUnits.find(u => u.id === unitId);
  if (!unit) return null;

  const bqsWithOccupants = mockDB.getBQsForUnit(unitId).map(bq => {
    const occupant = mockDB.bqOccupants.find(o => o.bqId === bq.id) ?? null;
    return { ...bq, occupant };
  });

  return { unit: { ...unit }, bqs: bqsWithOccupants };
}

export async function createHousingUnit(
  data: Omit<HousingUnit, 'id' | 'currentOccupantId' | 'createdAt' | 'updatedAt'>
): Promise<HousingUnit> {
  await delay(400);
  // Validate housing type exists
  const htExists = mockDB.housingTypes.some(ht => ht.id === data.housingTypeId);
  if (!htExists) throw new Error('Housing type not found');

  const now = new Date().toISOString();
  const unit: HousingUnit = {
    id: mockDB.generateId('hu'),
    ...data,
    currentOccupantId: null,
    createdAt: now,
    updatedAt: now,
  };
  mockDB.housingUnits.push(unit);

  // Auto-create BQ sub-units based on the housing type spec
  const ht = mockDB.housingTypes.find(h => h.id === data.housingTypeId)!;
  if (ht.hasBQ && ht.numberOfBQ > 0) {
    for (let i = 1; i <= ht.numberOfBQ; i++) {
      const bq: BQ = {
        id: mockDB.generateId('bq'),
        housingUnitId: unit.id,
        label: `BQ ${i}`,
        status: 'VACANT',
        createdAt: now,
        updatedAt: now,
      };
      mockDB.bqs.push(bq);
    }
  }

  return unit;
}

export async function updateHousingUnitStatus(
  id: string,
  status: UnitStatus
): Promise<HousingUnit> {
  await delay(300);
  const idx = mockDB.housingUnits.findIndex(u => u.id === id);
  if (idx === -1) throw new Error(`HousingUnit ${id} not found`);
  mockDB.housingUnits[idx] = {
    ...mockDB.housingUnits[idx],
    status,
    updatedAt: new Date().toISOString(),
  };
  return mockDB.housingUnits[idx];
}

export async function updateHousingUnit(
  id: string,
  data: Partial<Omit<HousingUnit, 'id' | 'createdAt'>>
): Promise<HousingUnit> {
  await delay(400);
  const idx = mockDB.housingUnits.findIndex(u => u.id === id);
  if (idx === -1) throw new Error(`HousingUnit ${id} not found`);
  mockDB.housingUnits[idx] = {
    ...mockDB.housingUnits[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  return mockDB.housingUnits[idx];
}

export async function deleteHousingUnit(id: string): Promise<void> {
  await delay(300);
  const hasOccupant = mockDB.housingUnits.some(u => u.id === id && u.currentOccupantId != null);
  if (hasOccupant) {
    throw new Error('Cannot delete a housing unit that is currently occupied');
  }
  mockDB.bqs = mockDB.bqs.filter(b => b.housingUnitId !== id);
  mockDB.housingUnits = mockDB.housingUnits.filter(u => u.id !== id);
}

// ---------------------------------------------------------------------------
// BQ OCCUPANTS — managed directly by the main occupant, not request-based
// ---------------------------------------------------------------------------

export async function getBQsForCurrentOccupant(mainOccupantId: string): Promise<
  Array<BQ & { occupant: BQOccupant | null }>
> {
  await delay(300);
  const occupancy = mockDB.findActiveOccupancyByUserId(mainOccupantId);
  if (!occupancy) return [];

  return mockDB.getBQsForUnit(occupancy.housingUnitId).map(bq => {
    const occupant = mockDB.bqOccupants.find(o => o.bqId === bq.id) ?? null;
    return { ...bq, occupant };
  });
}

export async function addBQOccupant(
  mainOccupantId: string,
  data: Omit<BQOccupant, 'id' | 'mainOccupantId' | 'createdAt' | 'updatedAt'>
): Promise<BQOccupant> {
  await delay(500);

  // Ensure the BQ belongs to the main occupant's unit
  const bq = mockDB.bqs.find(b => b.id === data.bqId);
  if (!bq) throw new Error('BQ not found');

  const occupancy = mockDB.findActiveOccupancyByUserId(mainOccupantId);
  if (!occupancy || occupancy.housingUnitId !== bq.housingUnitId) {
    throw new Error('You can only manage BQs in your own housing unit');
  }

  // BQ must be vacant to add an occupant
  if (bq.status === 'OCCUPIED') {
    throw new Error('This BQ already has an occupant. Remove the existing occupant first.');
  }

  const now = new Date().toISOString();
  const newOccupant: BQOccupant = {
    id: mockDB.generateId('bqo'),
    mainOccupantId,
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  mockDB.bqOccupants.push(newOccupant);

  // Update BQ status
  const bqIdx = mockDB.bqs.findIndex(b => b.id === data.bqId);
  mockDB.bqs[bqIdx] = { ...mockDB.bqs[bqIdx], status: 'OCCUPIED', updatedAt: now };

  return newOccupant;
}

export async function updateBQOccupant(
  mainOccupantId: string,
  bqOccupantId: string,
  data: Partial<Pick<BQOccupant, 'fullName' | 'phoneNumber' | 'email' | 'relationship'>>
): Promise<BQOccupant> {
  await delay(400);

  const idx = mockDB.bqOccupants.findIndex(
    o => o.id === bqOccupantId && o.mainOccupantId === mainOccupantId
  );
  if (idx === -1) throw new Error('BQ Occupant not found or you do not have permission to edit it');

  mockDB.bqOccupants[idx] = {
    ...mockDB.bqOccupants[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  return mockDB.bqOccupants[idx];
}

export async function removeBQOccupant(
  mainOccupantId: string,
  bqOccupantId: string
): Promise<void> {
  await delay(400);

  const occupant = mockDB.bqOccupants.find(
    o => o.id === bqOccupantId && o.mainOccupantId === mainOccupantId
  );
  if (!occupant) {
    throw new Error('BQ Occupant not found or you do not have permission to remove it');
  }

  // Remove occupant record
  mockDB.bqOccupants = mockDB.bqOccupants.filter(o => o.id !== bqOccupantId);

  // Set BQ back to VACANT
  const bqIdx = mockDB.bqs.findIndex(b => b.id === occupant.bqId);
  if (bqIdx !== -1) {
    mockDB.bqs[bqIdx] = {
      ...mockDB.bqs[bqIdx],
      status: 'VACANT',
      updatedAt: new Date().toISOString(),
    };
  }
}
