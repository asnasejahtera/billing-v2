import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CircleDollarSign,
  ReceiptText,
  Router,
  UsersRound,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const stats = [
  {
    title: "Pelanggan Aktif",
    value: "0",
    description: "Pelanggan aktif saat ini",
    icon: UsersRound,
  },
  {
    title: "Router",
    value: "0",
    description: "Router terdaftar",
    icon: Router,
  },
  {
    title: "Invoice Bulan Ini",
    value: "0",
    description: "Invoice periode berjalan",
    icon: ReceiptText,
  },
  {
    title: "Pendapatan",
    value: "Rp 0",
    description: "Pembayaran bulan ini",
    icon: CircleDollarSign,
  },
];

const quickLinks = [
  { title: "Kelola Router", href: "/routers", description: "Tambah dan kelola MikroTik router." },
  { title: "Kelola Pelanggan", href: "/customers", description: "Lihat seluruh pelanggan internet." },
  { title: "Invoice", href: "/billing/invoices", description: "Kelola tagihan pelanggan." },
  { title: "Pembayaran", href: "/billing/payments", description: "Kelola pembayaran pelanggan." },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ringkasan operasional billing dan jaringan.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="min-w-0">
                  <CardDescription>{item.title}</CardDescription>
                  <CardTitle className="mt-2 text-2xl">{item.value}</CardTitle>
                </div>
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Icon className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
            <CardDescription>
              Aktivitas penting dari billing dan jaringan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
              <div className="mb-4 flex size-10 items-center justify-center rounded-full bg-muted">
                <Activity className="size-5 text-muted-foreground" />
              </div>
              <p className="font-medium">Belum ada aktivitas</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Aktivitas router, pelanggan, invoice, dan pembayaran akan muncul di sini.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Akses Cepat</CardTitle>
            <CardDescription>
              Menu operasional yang sering digunakan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex min-h-16 items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/60"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}