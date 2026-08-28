"use client";

import { useFormStatus } from "react-dom";
import {
    Loader2,
    LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutSubmitButton() {
    const { pending } = useFormStatus();

    return (
        <Button
            type="submit"
            variant="ghost"
            size="icon"
            disabled={pending}
            aria-label="Keluar"
            title="Keluar"
        >
            {pending ? (
                <Loader2 className="size-4 animate-spin" />
            ) : (
                <LogOut className="size-4" />
            )}
        </Button>
    );
}