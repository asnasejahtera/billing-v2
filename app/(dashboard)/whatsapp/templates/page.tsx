import { redirect } from "next/navigation";
import { CreateWhatsAppTemplateDialog } from "@/features/whatsapp/components/create-whatsapp-template-dialog";
import { WhatsAppTemplateList } from "@/features/whatsapp/components/whatsapp-template-list";
import { listWhatsAppTemplatesService } from "@/features/whatsapp/services/whatsapp-template.service";

/**
 * ============================================
 * WHATSAPP TEMPLATES PAGE
 * ============================================
 */
export default async function WhatsAppTemplatesPage() {
    // const user = await getCurrentUser();

    // if (!user) {
    //     redirect("/login");
    // }

    const templates = await listWhatsAppTemplatesService();

    return (
        <div className="space-y-4">
            {/* ======================================
          ACTION
      ====================================== */}
            <div className="flex justify-end">
                <CreateWhatsAppTemplateDialog />
            </div>

            {/* ======================================
          TEMPLATE LIST
      ====================================== */}
            <WhatsAppTemplateList templates={templates} />
        </div>
    );
}