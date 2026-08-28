"use client";

import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
    CSS,
} from "@dnd-kit/utilities";
import {
    GripVertical,
    RotateCcw,
    Settings2,
} from "lucide-react";
import type {
    CustomerColumnConfig,
    CustomerColumnId,
} from "@/features/customers/config/customer-table-columns";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

type Props = {
    columns: CustomerColumnConfig[];
    onVisibleChange: (
        id: CustomerColumnId,
        visible: boolean,
    ) => void;
    onReorder: (
        oldIndex: number,
        newIndex: number,
    ) => void;
    onReset: () => void;
};

export function CustomerColumnSettingsDialog({
    columns,
    onVisibleChange,
    onReorder,
    onReset,
}: Props) {
    const sensors = useSensors(
        useSensor(
            PointerSensor,
            {
                activationConstraint: {
                    distance: 6,
                },
            },
        ),
        useSensor(
            KeyboardSensor,
            {
                coordinateGetter:
                    sortableKeyboardCoordinates,
            },
        ),
    );

    function handleDragEnd(
        event: DragEndEvent,
    ) {
        const {
            active,
            over,
        } = event;

        if (
            !over ||
            active.id === over.id
        ) {
            return;
        }

        const oldIndex =
            columns.findIndex(
                (column) =>
                    column.id === active.id,
            );

        const newIndex =
            columns.findIndex(
                (column) =>
                    column.id === over.id,
            );

        onReorder(
            oldIndex,
            newIndex,
        );
    }

    const visibleCount =
        columns.filter(
            (column) =>
                column.visible,
        ).length;

    return (
        <Dialog>
            <DialogTrigger
                render={
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                    />
                }
            >
                <Settings2 />
                Atur Kolom
            </DialogTrigger>

            <DialogContent className="max-h-[90svh] overflow-hidden sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        Atur Kolom
                    </DialogTitle>

                    <DialogDescription>
                        Tampilkan, sembunyikan,
                        dan tarik kolom untuk
                        mengubah urutannya.
                    </DialogDescription>
                </DialogHeader>

                <div className="max-h-[60svh] overflow-y-auto pr-1">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={
                            closestCenter
                        }
                        onDragEnd={
                            handleDragEnd
                        }
                    >
                        <SortableContext
                            items={columns.map(
                                (column) =>
                                    column.id,
                            )}
                            strategy={
                                verticalListSortingStrategy
                            }
                        >
                            <div className="space-y-2">
                                {columns.map(
                                    (column) => (
                                        <SortableColumn
                                            key={
                                                column.id
                                            }
                                            column={
                                                column
                                            }
                                            disableHide={
                                                column.visible &&
                                                visibleCount ===
                                                1
                                            }
                                            onVisibleChange={
                                                onVisibleChange
                                            }
                                        />
                                    ),
                                )}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onReset}
                    >
                        <RotateCcw />
                        Reset Default
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function SortableColumn({
    column,
    disableHide,
    onVisibleChange,
}: {
    column: CustomerColumnConfig;
    disableHide: boolean;
    onVisibleChange: (
        id: CustomerColumnId,
        visible: boolean,
    ) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: column.id,
    });

    return (
        <div
            ref={setNodeRef}
            style={{
                transform:
                    CSS.Transform.toString(
                        transform,
                    ),
                transition,
            }}
            className={`flex items-center gap-3 rounded-lg border bg-background p-3 ${isDragging
                    ? "z-10 opacity-70 shadow-md"
                    : ""
                }`}
        >
            <button
                type="button"
                className="cursor-grab touch-none rounded-md p-1 text-muted-foreground hover:bg-muted active:cursor-grabbing"
                aria-label={`Pindahkan ${column.label}`}
                {...attributes}
                {...listeners}
            >
                <GripVertical className="size-4" />
            </button>

            <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {column.label}
            </span>

            <Switch
                checked={
                    column.visible
                }
                disabled={
                    disableHide
                }
                onCheckedChange={(
                    checked,
                ) =>
                    onVisibleChange(
                        column.id,
                        checked,
                    )
                }
            />
        </div>
    );
}