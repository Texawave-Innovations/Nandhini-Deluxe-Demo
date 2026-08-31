// Outlet domain service. Pure read helpers over the Location (=Outlet) master — the functions
// here are the seam a future NestJS `GET /outlets` etc. would replace; UI/stores never inspect
// the Location array directly for outlet-scoping logic.

import { Location } from '@/types/erp-core';
import { UserRole } from '@/types/erp-core';
import { ROLE_OUTLET_SCOPE, DEFAULT_ASSIGNED_OUTLET_IDS } from '@/permissions/roleAccess';

export const outletService = {
  listOutlets(locations: Location[]): Location[] {
    return locations.filter((l) => l.isOutlet && l.status === 'ACTIVE');
  },

  // Outlets a given role is allowed to see in the Outlet Switcher.
  listOutletsForRole(locations: Location[], role: UserRole): Location[] {
    const outlets = outletService.listOutlets(locations);
    if (ROLE_OUTLET_SCOPE[role] === 'ALL') return outlets;
    return outlets.filter((o) => DEFAULT_ASSIGNED_OUTLET_IDS.includes(o.id));
  },

  getOutletById(locations: Location[], outletId: string): Location | undefined {
    return locations.find((l) => l.id === outletId);
  },
};
