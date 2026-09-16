"use client";

import type {
    WhatsAppTemplateVariable,
} from "@/db/schema/whatsapp-message-templates";

import {
    renderWhatsAppTemplate,
} from "../lib/render-whatsapp-template";

/**
 * ============================================
 * PROPS
 * ============================================
 */
type Props = {
    body: string;
    variables: WhatsAppTemplateVariable[];
};

/**
 * ============================================
 * PREVIEW
 * ============================================
 */
export function WhatsAppTemplatePreview({
    body,
    variables,
}: Props) {
    /**
     * Gunakan example variable sebagai data preview.
     */
    const values =
        Object.fromEntries(
            variables.map(
                (variable) => [
                    variable.key,
                    variable.example ||
                    `{{${variable.key}}}`,
                ],
            ),
        );

    const result =
        renderWhatsAppTemplate(
            body,
            values,
        );

    return (
        <div className="space-y-2">
            {/* ======================================
          HEADER
      ====================================== */}
            <div>
                <p className="text-sm font-medium">
                    Preview Pesan
                </p>

                <p className="text-xs text-muted-foreground">
                    Menggunakan contoh nilai dari variable.
                </p>
            </div>

            {/* ======================================
          MESSAGE
      ====================================== */}
            <div className="rounded-lg border bg-muted/30 p-4">
                {body ? (
                    <p className="whitespace-pre-wrap text-sm">
                        {result.body}
                    </p>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Isi pesan masih kosong.
                    </p>
                )}
            </div>

            {/* ======================================
          MISSING VARIABLE
      ====================================== */}
            {!result.success &&
                result.missingVariables.length > 0 && (
                    <div className="text-xs text-destructive">
                        Variable belum memiliki contoh:{" "}
                        {result.missingVariables.join(", ")}
                    </div>
                )}
        </div>
    );
}