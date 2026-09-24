import React from 'react';
import { clsx } from 'clsx';
import './Table.css';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  className?: string;
}

export const Table: React.FC<TableProps> = ({ children, className, ...props }) => {
  return (
    <div className="table-wrapper">
      <table className={clsx('table', className)} {...props}>
        {children}
      </table>
    </div>
  );
};

export const TableHead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, ...props }) => (
  <thead className="table-head" {...props}>
    {children}
  </thead>
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, ...props }) => (
  <tbody className="table-body" {...props}>
    {children}
  </tbody>
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className, children, ...props }) => (
  <tr className={clsx('table-row', className)} {...props}>
    {children}
  </tr>
);

export const TableHeader: React.FC<React.ThHTMLAttributes<HTMLTableHeaderCellElement>> = ({ className, children, ...props }) => (
  <th className={clsx('table-header-cell', className)} {...props}>
    {children}
  </th>
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableDataCellElement>> = ({ className, children, ...props }) => (
  <td className={clsx('table-cell', className)} {...props}>
    {children}
  </td>
);
