import { Skeleton } from "@/components/ui/skeleton";

/**
 * ============================================
 * WHATSAPP LOADING
 * ============================================
 */
export default function WhatsAppLoading() {
    return (
        <div className="space-y-6">
            {/* ======================================
          HEADER
      ====================================== */}
            <div className="space-y-2">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-4 w-80 max-w-full" />
            </div>

            {/* ======================================
          CONNECTION CARD
      ====================================== */}
            <div className="rounded-xl border p-6">
                <div className="space-y-3">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-80 max-w-full" />
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Skeleton className="h-24" />
                            <Skeleton className="h-24" />
                        </div>

                        <Skeleton className="h-56" />
                    </div>

                    <Skeleton className="h-[340px]" />
                </div>
            </div>
        </div>
    );
}