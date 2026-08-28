"use client";

import { useActionState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { loginAction } from "@/features/auth/actions/login.action";
import { initialLoginState } from "@/features/auth/types/login-action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
    const [state, formAction, isPending] = useActionState(
        loginAction,
        initialLoginState,
    );

    return (
        <form action={formAction} className="space-y-5">
            {state.message && (
                <div
                    role="alert"
                    className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                    {state.message}
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="email">
                    Email
                </Label>

                <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@example.com"
                    aria-invalid={Boolean(state.errors?.email)}
                    disabled={isPending}
                />

                {state.errors?.email?.[0] && (
                    <p className="text-xs text-destructive">
                        {state.errors.email[0]}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">
                    Password
                </Label>

                <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Masukkan password"
                    aria-invalid={Boolean(state.errors?.password)}
                    disabled={isPending}
                />

                {state.errors?.password?.[0] && (
                    <p className="text-xs text-destructive">
                        {state.errors.password[0]}
                    </p>
                )}
            </div>

            <Button
                type="submit"
                className="w-full"
                disabled={isPending}
            >
                {isPending ? (
                    <Loader2 className="animate-spin" />
                ) : (
                    <LogIn />
                )}

                {isPending ? "Memproses..." : "Masuk"}
            </Button>
        </form>
    );
}