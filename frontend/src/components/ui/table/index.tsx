// components/ui/table/index.tsx
import * as React from "react";

import clsx from "clsx";

type TableProps = React.TableHTMLAttributes<HTMLTableElement> & {
  className?: string;
};

export const Table: React.FC<TableProps> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <table
      className={clsx("min-w-full text-xs border-collapse", className)}
      {...props}
    >
      {children}
    </table>
  );
};

type SectionProps = React.HTMLAttributes<HTMLTableSectionElement> & {
  className?: string;
};

export const TableHead: React.FC<SectionProps> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <thead className={clsx("bg-brand-50", className)} {...props}>
      {children}
    </thead>
  );
};

export const TableBody: React.FC<SectionProps> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <tbody className={clsx("text-text-muted", className)} {...props}>
      {children}
    </tbody>
  );
};

type RowProps = React.HTMLAttributes<HTMLTableRowElement> & {
  className?: string;
};

export const TableRow: React.FC<RowProps> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <tr
      className={clsx(
        "align-middle border-b border-brand-500 last:border-b-0",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
};

type HeadCellProps = React.ThHTMLAttributes<HTMLTableCellElement> & {
  className?: string;
};

export const TableHeadCell: React.FC<HeadCellProps> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <th
      className={clsx(
        "px-3 py-2 text-center font-semibold text-text-muted whitespace-nowrap border-b border-brand-500",
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
};

type CellProps = React.TdHTMLAttributes<HTMLTableCellElement> & {
  className?: string;
};

export const TableCell: React.FC<CellProps> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <td
      className={clsx("px-3 py-3 text-center align-middle", className)}
      {...props}
    >
      {children}
    </td>
  );
};
