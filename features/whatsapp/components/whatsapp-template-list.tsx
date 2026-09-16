import {
    Badge,
} from "@/components/ui/badge";

import type {
    WhatsAppMessageTemplate,
} from "@/db/schema/whatsapp-message-templates";

import {
    EditWhatsAppTemplateDialog,
} from "./edit-whatsapp-template-dialog";

/**
 * ============================================
 * PROPS
 * ============================================
 */
type Props = {
    templates:
    WhatsAppMessageTemplate[];
};

/**
 * ============================================
 * LIST
 * ============================================
 */
export function WhatsAppTemplateList({
    templates,
}: Props) {
    if (
        templates.length ===
        0
    ) {
        return (
            <div className="rounded-lg border border-dashed p-10 text-center">
                <p className="font-medium">
                    Belum ada template WhatsApp
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 xl:grid-cols-2">
            {templates.map(
                (
                    template,
                ) => (
                    <div
                        key={
                            template.id
                        }
                        className="rounded-lg border p-4"
                    >
                        {/* ==================================
                HEADER
            ================================== */}
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="font-medium">
                                    {template.name}
                                </p>

                                <p className="mt-1 font-mono text-xs text-muted-foreground">
                                    {template.key}
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <Badge variant="outline">
                                    {template.category}
                                </Badge>

                                <Badge
                                    variant={
                                        template.isActive
                                            ? "default"
                                            : "secondary"
                                    }
                                >
                                    {template.isActive
                                        ? "ACTIVE"
                                        : "INACTIVE"}
                                </Badge>
                            </div>
                        </div>

                        {/* ==================================
                DESCRIPTION
            ================================== */}
                        {template.description && (
                            <p className="mt-3 text-sm text-muted-foreground">
                                {template.description}
                            </p>
                        )}

                        {/* ==================================
                BODY
            ================================== */}
                        <div className="mt-4 whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-sm">
                            {template.body}
                        </div>

                        {/* ==================================
                VARIABLES
            ================================== */}
                        {template.variables.length >
                            0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {template.variables.map(
                                        (
                                            variable,
                                        ) => (
                                            <Badge
                                                key={
                                                    variable.key
                                                }
                                                variant="secondary"
                                            >
                                                {`{{${variable.key}}}`}
                                            </Badge>
                                        ),
                                    )}
                                </div>
                            )}

                        {/* ==================================
                ACTION
            ================================== */}
                        <div className="mt-4 flex justify-end">
                            <EditWhatsAppTemplateDialog
                                template={
                                    template
                                }
                            />
                        </div>
                    </div>
                ),
            )}
        </div>
    );
}