import {
  LockKeyhole,
  RadioTower,
  ShieldCheck,
  Wifi,
} from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LoginForm } from "@/features/auth/components/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/services/current-user.service";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="relative grid min-h-svh lg:grid-cols-2">
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>

      <section className="relative hidden overflow-hidden bg-foreground p-10 text-background lg:flex lg:flex-col">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-background text-foreground">
            <RadioTower className="size-5" />
          </div>

          <div>
            <p className="font-semibold">
              MikroTik Billing
            </p>
            <p className="text-xs opacity-70">
              RT/RW Net Management
            </p>
          </div>
        </div>

        <div className="my-auto max-w-lg">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Kelola billing dan jaringan dari satu tempat.
          </h1>

          <p className="mt-4 max-w-md text-sm leading-6 opacity-70">
            Aplikasi ringan untuk pengelolaan pelanggan,
            MikroTik, PPPoE, invoice, pembayaran, dan
            monitoring jaringan.
          </p>

          <div className="mt-10 grid gap-4">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0" />

              <div>
                <p className="text-sm font-medium">
                  Akses aman
                </p>
                <p className="mt-1 text-sm opacity-60">
                  Session dan authorization dikelola dari
                  server.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Wifi className="mt-0.5 size-5 shrink-0" />

              <div>
                <p className="text-sm font-medium">
                  Terintegrasi MikroTik
                </p>
                <p className="mt-1 text-sm opacity-60">
                  Konfigurasi jaringan tetap dipisahkan
                  melalui service layer.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs opacity-50">
          MikroTik Billing Management System
        </p>
      </section>

      <section className="flex items-center justify-center bg-background p-4 sm:p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <RadioTower className="size-5" />
            </div>

            <div>
              <p className="font-semibold">
                MikroTik Billing
              </p>
              <p className="text-xs text-muted-foreground">
                RT/RW Net Management
              </p>
            </div>
          </div>

          <Card className="border-0 shadow-none sm:border sm:shadow-sm">
            <CardHeader>
              <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-muted">
                <LockKeyhole className="size-5" />
              </div>

              <CardTitle className="text-2xl">
                Masuk
              </CardTitle>

              <CardDescription>
                Masukkan akun administrator untuk
                melanjutkan.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <LoginForm />
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}