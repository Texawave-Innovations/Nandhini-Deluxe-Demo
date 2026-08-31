import React from 'react';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  keyField: (row: T) => string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export default function DataTable<T>({ columns, rows, keyField, emptyMessage = 'No records found.', onRowClick }: DataTableProps<T>) {
  return (
    <div className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[#F3F0E9] border-b border-[#E5E2DB]">
              {columns.map((col) => (
                <th key={col.key} className={`text-left px-4 py-2.5 font-semibold text-[#66706B] uppercase text-[11px] tracking-wide whitespace-nowrap ${col.className ?? ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="text-center py-8 text-[#66706B] text-[13px]">{emptyMessage}</td>
              </tr>
            )}
            {rows.map((row) => (
              <tr
                key={keyField(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-[#E5E2DB] last:border-0 ${onRowClick ? 'cursor-pointer hover:bg-[#F8F5EE]' : ''}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-2.5 text-[#202522] ${col.className ?? ''}`}>{col.render(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
