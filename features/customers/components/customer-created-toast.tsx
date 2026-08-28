"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function CustomerCreatedToast({
    created,
}: {
    created: boolean;
}) {
    useEffect(() => {
        if (!created) return;

        toast.success(
            "Data berhasil disimpan",
            {
                description:
                    "Customer dan PPP Secret MikroTik berhasil dibuat.",
            },
        );

        window.history.replaceState(
            null,
            "",
            "/customers",
        );
    }, [created]);

    return null;
}