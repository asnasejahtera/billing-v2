"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CUSTOMER_COLUMNS_STORAGE_KEY,
  defaultCustomerColumns,
  type CustomerColumnConfig,
  type CustomerColumnId,
} from "@/features/customers/config/customer-table-columns";

export function useCustomerTableColumns() {
  const [columns, setColumns] =
    useState<CustomerColumnConfig[]>(
      defaultCustomerColumns,
    );

  useEffect(() => {
    try {
      const saved = localStorage.getItem(
        CUSTOMER_COLUMNS_STORAGE_KEY,
      );

      if (!saved) return;

      const parsed = JSON.parse(
        saved,
      ) as CustomerColumnConfig[];

      const validIds = new Set(
        defaultCustomerColumns.map(
          (column) => column.id,
        ),
      );

      const savedColumns = parsed.filter(
        (column) =>
          validIds.has(column.id),
      );

      const savedIds = new Set(
        savedColumns.map(
          (column) => column.id,
        ),
      );

      const missing =
        defaultCustomerColumns.filter(
          (column) =>
            !savedIds.has(column.id),
        );

      setColumns([
        ...savedColumns,
        ...missing,
      ]);
    } catch {
      localStorage.removeItem(
        CUSTOMER_COLUMNS_STORAGE_KEY,
      );
    }
  }, []);

  function save(
    next: CustomerColumnConfig[],
  ) {
    setColumns(next);

    localStorage.setItem(
      CUSTOMER_COLUMNS_STORAGE_KEY,
      JSON.stringify(next),
    );
  }

  function setVisible(
    id: CustomerColumnId,
    visible: boolean,
  ) {
    const visibleCount =
      columns.filter(
        (column) => column.visible,
      ).length;

    if (
      !visible &&
      visibleCount === 1
    ) {
      return;
    }

    save(
      columns.map(
        (column) =>
          column.id === id
            ? {
                ...column,
                visible,
              }
            : column,
      ),
    );
  }

  function reorder(
    oldIndex: number,
    newIndex: number,
  ) {
    if (
      oldIndex === newIndex ||
      oldIndex < 0 ||
      newIndex < 0
    ) {
      return;
    }

    const next = [
      ...columns,
    ];

    const [moved] =
      next.splice(
        oldIndex,
        1,
      );

    next.splice(
      newIndex,
      0,
      moved,
    );

    save(next);
  }

  function reset() {
    save(
      defaultCustomerColumns.map(
        (column) => ({
          ...column,
        }),
      ),
    );
  }

  const visibleColumns =
    useMemo(
      () =>
        columns.filter(
          (column) =>
            column.visible,
        ),
      [columns],
    );

  return {
    columns,
    visibleColumns,
    setVisible,
    reorder,
    reset,
  };
}