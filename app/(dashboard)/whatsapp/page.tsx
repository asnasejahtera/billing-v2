import { redirect } from "next/navigation";

import { WhatsAppConnectionCard } from "@/features/whatsapp/components/whatsapp-connection-card";
import { getWhatsAppConnectionSnapshotService } from "@/features/whatsapp/services/whatsapp-connection.service";
// import { getCurrentUser } from "@/lib/auth/get-current-user";

/**
 * ============================================
 * WHATSAPP PAGE
 * ============================================
 */
export default async function WhatsAppPage() {
    //   const user = await getCurrentUser();

    //   if (!user) {
    //     redirect("/login");
    //   }

    /**
     * Page hanya memanggil service.
     * Query database tetap berada di repository.
     */
    const connection =
        await getWhatsAppConnectionSnapshotService();

    return (
        <div className="space-y-6">
            {/* ======================================
          WHATSAPP CONNECTION
      ====================================== */}
            <WhatsAppConnectionCard
                initialData={connection}
            />
        </div>
    );
}