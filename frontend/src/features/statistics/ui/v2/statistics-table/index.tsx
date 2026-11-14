import * as React from "react";

import clsx from "clsx";

import { Table as BaseTable } from "@/components/v2/ui/table";

export const Table = ({
  caption,
  className,
  children,
  ...props
}: Omit<React.TableHTMLAttributes<HTMLTableElement>, "caption"> & {
  caption?: string;
}) => (
  <div className="overflow-x-auto">
    <BaseTable
      plain
      {...props}
      className={clsx("min-w-full text-v2-caption", className)}
    >
      {caption && <caption className="sr-only">{caption}</caption>}
      {children}
    </BaseTable>
  </div>
);
export const TableHead = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead
    {...props}
    className={clsx("bg-v2-brand-soft text-v2-text-secondary", className)}
  />
);
export const TableBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody {...props} className={clsx("text-v2-text", className)} />
);
export const TableRow = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr
    {...props}
    className={clsx(
      "border-b border-v2-border-subtle last:border-0",
      className
    )}
  />
);
export const TableHeadCell = ({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    {...props}
    className={clsx(
      "whitespace-nowrap px-2 py-2 text-center font-semibold",
      className
    )}
  />
);
export const TableCell = ({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td {...props} className={clsx("px-2 py-3 text-center", className)} />
);
