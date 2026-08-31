'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { DiningFloor, DiningTable, TableStatus } from '@/types/pos';

const STATUS_STYLES: Record<TableStatus, string> = {
  AVAILABLE: 'bg-[#23865B]/10 border-[#23865B]/30 text-[#23865B]',
  OCCUPIED: 'bg-[#C94B45]/10 border-[#C94B45]/30 text-[#C94B45]',
  RESERVED: 'bg-[#C68A28]/10 border-[#C68A28]/30 text-[#C68A28]',
  BILLING: 'bg-[#3377A8]/10 border-[#3377A8]/30 text-[#3377A8]',
};

interface TableGridProps {
  floors: DiningFloor[];
  tables: DiningTable[];
  selectedTableId?: string;
  onSelectTable?: (table: DiningTable) => void;
  disableUnavailable?: boolean;
}

export default function TableGrid({ floors, tables, selectedTableId, onSelectTable, disableUnavailable }: TableGridProps) {
  return (
    <div className="space-y-5">
      {floors.map((floor) => (
        <div key={floor.id}>
          <div className="text-[12px] font-semibold uppercase tracking-wide text-[#66706B] mb-2">{floor.name}</div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {tables.filter((t) => t.floorId === floor.id).map((t) => {
              const isDisabled = disableUnavailable && t.status !== 'AVAILABLE';
              return (
                <button
                  key={t.id}
                  disabled={isDisabled}
                  onClick={() => onSelectTable?.(t)}
                  className={`relative rounded-xl border-2 p-4 text-center transition-all ${STATUS_STYLES[t.status]} ${
                    selectedTableId === t.id ? 'ring-2 ring-[#0F5B55] ring-offset-2' : ''
                  } ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:scale-[1.03] cursor-pointer'}`}
                >
                  <div className="text-[18px] font-bold">{t.code}</div>
                  <div className="flex items-center justify-center gap-1 text-[11px] mt-1 opacity-80">
                    <Users className="w-3 h-3" /> {t.capacity}
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide mt-1.5">{t.status}</div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
