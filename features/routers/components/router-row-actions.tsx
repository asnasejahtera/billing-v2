"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Eye,
    MoreHorizontal,
    Pencil,
    Trash2,
} from "lucide-react";
import { EditRouterDialog } from "@/features/routers/components/edit-router-dialog";
import { DeactivateRouterDialog } from "@/features/routers/components/deactivate-router-dialog";
import { TestRouterConnectionButton } from "@/features/routers/components/test-router-connection-button";
import { Button, buttonVariants } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

type RouterRowActionsProps = {
    router: {
        id: number;
        name: string;
        host: string;
        port: number;
        username: string;
        useHttps: boolean;
        description: string | null;
        isActive: boolean;
    };
};

export function RouterRowActions({
    router,
}: RouterRowActionsProps) {
    const [actionOpen, setActionOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deactivateOpen, setDeactivateOpen] = useState(false);

    return (
        <>
            {/* DESKTOP */}
            <div
                className="hidden items-center justify-end gap-2 lg:flex"
                onClick={(event) => event.stopPropagation()}
            >
                <Link
                    href={`/routers/${router.id}`}
                    className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                    })}
                >
                    <Eye />
                    Detail
                </Link>

                <TestRouterConnectionButton
                    routerId={router.id}
                    disabled={!router.isActive}
                />

                <EditRouterDialog
                    router={{
                        id: router.id,
                        name: router.name,
                        host: router.host,
                        port: router.port,
                        username: router.username,
                        useHttps: router.useHttps,
                        description: router.description,
                    }}
                />

                <DeactivateRouterDialog
                    router={{
                        id: router.id,
                        name: router.name,
                        isActive: router.isActive,
                    }}
                />
            </div>

            {/* MOBILE / TABLE SEMPIT */}
            <div
                className="flex justify-end lg:hidden"
                onClick={(event) => event.stopPropagation()}
            >
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Aksi router ${router.name}`}
                    onClick={() => setActionOpen(true)}
                >
                    <MoreHorizontal />
                </Button>
            </div>

            <Dialog
                open={actionOpen}
                onOpenChange={setActionOpen}
            >
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>
                            {router.name}
                        </DialogTitle>

                        <DialogDescription>
                            Pilih aksi router yang ingin dilakukan.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-2">
                        <Link
                            href={`/routers/${router.id}`}
                            className={buttonVariants({
                                variant: "outline",
                            })}
                            onClick={() => setActionOpen(false)}
                        >
                            <Eye />
                            Detail Router
                        </Link>

                        <TestRouterConnectionButton
                            routerId={router.id}
                            disabled={!router.isActive}
                        />

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setActionOpen(false);

                                requestAnimationFrame(() => {
                                    setEditOpen(true);
                                });
                            }}
                        >
                            <Pencil />
                            Edit Router
                        </Button>

                        <Button
                            type="button"
                            variant="destructive"
                            disabled={!router.isActive}
                            onClick={() => {
                                setActionOpen(false);

                                requestAnimationFrame(() => {
                                    setDeactivateOpen(true);
                                });
                            }}
                        >
                            <Trash2 />
                            Hapus / Nonaktifkan
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Dialog ini sibling, BUKAN nested di Dialog Aksi */}
            <EditRouterDialog
                router={{
                    id: router.id,
                    name: router.name,
                    host: router.host,
                    port: router.port,
                    username: router.username,
                    useHttps: router.useHttps,
                    description: router.description,
                }}
                open={editOpen}
                onOpenChange={setEditOpen}
                showTrigger={false}
            />

            <DeactivateRouterDialog
                router={{
                    id: router.id,
                    name: router.name,
                    isActive: router.isActive,
                }}
                open={deactivateOpen}
                onOpenChange={setDeactivateOpen}
                showTrigger={false}
            />
        </>
    );
}