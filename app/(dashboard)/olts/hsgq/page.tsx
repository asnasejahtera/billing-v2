import { HsgqOnuMonitor } from "@/features/olts/components/hsgq-onu-monitor";
import { getHsgqOnuList } from "@/features/olts/services/hsgq-onu.service";

export const dynamic = "force-dynamic";

export default async function HsgqPage() {
    try {
        const result =
            await getHsgqOnuList();

        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        HSGQ OLT
                    </h1>

                    <p className="text-sm text-muted-foreground">
                        Monitoring ONU langsung dari HSGQ Web API.
                    </p>
                </div>

                <HsgqOnuMonitor
                    initialData={result}
                />
            </div>
        );
    } catch (error) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">
                        HSGQ OLT
                    </h1>

                    <p className="text-sm text-muted-foreground">
                        Monitoring ONU langsung dari HSGQ Web API.
                    </p>
                </div>

                <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                    <p className="font-medium text-destructive">
                        Gagal mengambil data ONU
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                        {error instanceof Error
                            ? error.message
                            : "Terjadi kesalahan saat menghubungi HSGQ"}
                    </p>
                </div>
            </div>
        );
    }
}