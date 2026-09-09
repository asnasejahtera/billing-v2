"use client";

import { useState, useTransition } from "react";
import { Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { deleteOltAction } from "../actions/delete-olt.action";
import { EditOltDialog } from "./edit-olt-dialog";

type Props = {
    olt: {
        id: number;
        name: string;
    };
};

export function OltRowActions({ olt }: Props) {
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    function handleDelete() {
        startTransition(async () => {
            const result = await deleteOltAction(olt.id);

            if (!result.success) {
                toast.error(result.message);
                return;
            }

            toast.success(result.message);
            setDeleteOpen(false);
        });
    }

    return (
        <>
            {/* Desktop */}
            <div className="hidden items-center justify-end gap-2 md:flex">
                <Button type="button" size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                    <Pencil className="size-4" />
                    Edit
                </Button>

                <Button type="button" size="sm" variant="destructive" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="size-4" />
                    Hapus
                </Button>
            </div>

            {/* Mobile */}
            <div className="flex justify-end md:hidden">
                <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    aria-label={`Aksi ${olt.name}`}
                    onClick={() => setMobileOpen(true)}
                >
                    <MoreHorizontal className="size-4" />
                </Button>
            </div>

            <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>{olt.name}</DialogTitle>
                        <DialogDescription>Pilih aksi OLT.</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="justify-start"
                            onClick={() => {
                                setMobileOpen(false);
                                setEditOpen(true);
                            }}
                        >
                            <Pencil className="size-4" />
                            Edit OLT
                        </Button>

                        <Button
                            type="button"
                            variant="destructive"
                            className="justify-start"
                            onClick={() => {
                                setMobileOpen(false);
                                setDeleteOpen(true);
                            }}
                        >
                            <Trash2 className="size-4" />
                            Hapus OLT
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <EditOltDialog
                id={olt.id}
                open={editOpen}
                onOpenChange={setEditOpen}
            />

            <AlertDialog open={deleteOpen} onOpenChange={(open) => {
                if (!isPending) setDeleteOpen(open);
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus {olt.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Jika OLT belum digunakan topology, OLT dan physical PON port akan dihapus.
                            Jika sudah digunakan topology, OLT hanya akan dinonaktifkan agar relasi jaringan tetap aman.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>

                        <AlertDialogAction
                            disabled={isPending}
                            onClick={(event) => {
                                event.preventDefault();
                                handleDelete();
                            }}
                        >
                            {isPending && <Loader2 className="size-4 animate-spin" />}
                            {isPending ? "Memproses..." : "Hapus"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}