import { ReactNode } from 'react';

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className = '' }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className={`w-full ${className}`}>
        {children}
      </table>
    </div>
  );
}

interface TableHeadProps {
  children: ReactNode;
}

export function TableHead({ children }: TableHeadProps) {
  return (
    <thead className="bg-gray-50 border-b border-gray-200">
      {children}
    </thead>
  );
}

interface TableBodyProps {
  children: ReactNode;
}

export function TableBody({ children }: TableBodyProps) {
  return (
    <tbody className="divide-y divide-gray-200">
      {children}
    </tbody>
  );
}

interface TableRowProps {
  children: ReactNode;
  hover?: boolean;
  className?: string;
}

export function TableRow({ children, hover = true, className = '' }: TableRowProps) {
  return (
    <tr className={`${hover ? 'hover:bg-gray-50' : ''} transition-colors ${className}`}>
      {children}
    </tr>
  );
}

interface TableHeaderCellProps {
  children: ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export function TableHeaderCell({ children, align = 'left', width }: TableHeaderCellProps) {
  const alignClass = { left: 'text-left', center: 'text-center', right: 'text-right' }[align];

  return (
    <th className={`px-6 py-4 font-bold text-gray-900 text-sm ${alignClass} ${width || ''}`}>
      {children}
    </th>
  );
}

interface TableCellProps {
  children: ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export function TableCell({ children, align = 'left', className = '' }: TableCellProps) {
  const alignClass = { left: 'text-left', center: 'text-center', right: 'text-right' }[align];

  return (
    <td className={`px-6 py-4 text-gray-700 text-sm ${alignClass} ${className}`}>
      {children}
    </td>
  );
}

interface StatusBadgeProps {
  status:
    | 'pending'
    | 'diproses'
    | 'dikirim_ke_kepala_desa'
    | 'perlu_revisi'
    | 'ditandatangani'
    | 'selesai'
    | 'ditolak';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const badgeStyles = {
    pending: 'bg-gray-100 text-gray-800',
    diproses: 'bg-yellow-100 text-yellow-800',
    dikirim_ke_kepala_desa: 'bg-indigo-100 text-indigo-800',
    perlu_revisi: 'bg-orange-100 text-orange-800',
    ditandatangani: 'bg-emerald-100 text-emerald-800',
    selesai: 'bg-green-100 text-green-800',
    ditolak: 'bg-red-100 text-red-800',
  };

  const labels = {
    pending: 'Menunggu',
    diproses: 'Diproses',
    dikirim_ke_kepala_desa: 'Dikirim ke Kepala Desa',
    perlu_revisi: 'Perlu Revisi',
    ditandatangani: 'Ditandatangani',
    selesai: 'Selesai',
    ditolak: 'Ditolak',
  };

  return (
    <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold ${badgeStyles[status]}`}>
      {labels[status]}
    </span>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-600 mb-4">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
