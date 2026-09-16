"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createWhatsAppTemplateAction } from "../actions/whatsapp-template.actions";
import { whatsappTemplateCategories, EMPTY_WHATSAPP_TEMPLATE_CONTENT } from "../schemas/whatsapp-template.schema";
import {
    WhatsAppRichTextEditor,
} from "./whatsapp-rich-text-editor";
import {
    WhatsAppTemplatePreview,
} from "./whatsapp-template-preview";

/**
 * ============================================
 * TYPES
 * ============================================
 */
type VariableInput = {
    key: string;
    label: string;
    example: string;
};

const EMPTY_VARIABLE: VariableInput = {
    key: "",
    label: "",
    example: "",
};

/**
 * ============================================
 * CREATE TEMPLATE DIALOG
 * ============================================
 */
export function CreateWhatsAppTemplateDialog() {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const [key, setKey] = useState("");
    const [name, setName] = useState("");
    const [category, setCategory] =
        useState<(typeof whatsappTemplateCategories)[number]>("BILLING");
    const [description, setDescription] = useState("");
    const [
        contentJson,
        setContentJson,
    ] = useState<
        Record<string, unknown>
    >(
        EMPTY_WHATSAPP_TEMPLATE_CONTENT,
    );

    const [
        body,
        setBody,
    ] = useState("");
    const [variables, setVariables] = useState<VariableInput[]>([]);

    /**
     * ========================================
     * RESET FORM
     * ========================================
     */
    function resetForm() {
        setKey("");
        setName("");
        setCategory("BILLING");
        setDescription("");
        setVariables([]);
        setError(null);
        setContentJson(
            EMPTY_WHATSAPP_TEMPLATE_CONTENT,
        );
        setBody("");
    }

    /**
     * ========================================
     * DIALOG STATE
     * ========================================
     */
    function handleOpenChange(value: boolean) {
        setOpen(value);

        if (!value) {
            resetForm();
        }
    }

    /**
     * ========================================
     * ADD VARIABLE
     * ========================================
     */
    function addVariable() {
        setVariables((current) => [
            ...current,
            { ...EMPTY_VARIABLE },
        ]);
    }

    /**
     * ========================================
     * UPDATE VARIABLE
     * ========================================
     */
    function updateVariable(
        index: number,
        field: keyof VariableInput,
        value: string,
    ) {
        setVariables((current) =>
            current.map((variable, variableIndex) =>
                variableIndex === index
                    ? { ...variable, [field]: value }
                    : variable,
            ),
        );
    }

    /**
     * ========================================
     * REMOVE VARIABLE
     * ========================================
     */
    function removeVariable(index: number) {
        setVariables((current) =>
            current.filter((_, variableIndex) => variableIndex !== index),
        );
    }

    /**
     * ========================================
     * CREATE TEMPLATE
     * ========================================
     */
    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        startTransition(async () => {
            const result = await createWhatsAppTemplateAction({
                key,
                name,
                category,
                description,
                body,
                variables,
            });

            if (!result.success) {
                setError(result.message);
                return;
            }

            resetForm();
            setOpen(false);
        });
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger
                render={
                    <Button>
                        <Plus />
                        Tambah Template
                    </Button>
                }
            />

            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Tambah Template WhatsApp</DialogTitle>
                    <DialogDescription>
                        Buat template pesan yang dapat digunakan untuk billing, pelanggan, pembayaran,
                        atau gangguan jaringan.
                    </DialogDescription>
                </DialogHeader>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    {/* ==================================
              BASIC INFORMATION
          ================================== */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label htmlFor="template-key" className="text-sm font-medium">
                                Key
                            </label>

                            <Input
                                id="template-key"
                                value={key}
                                onChange={(event) => setKey(event.target.value)}
                                placeholder="invoice_created"
                                disabled={isPending}
                            />

                            <p className="text-xs text-muted-foreground">
                                Gunakan lowercase snake_case dan jangan diubah setelah dipakai automation.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="template-name" className="text-sm font-medium">
                                Nama
                            </label>

                            <Input
                                id="template-name"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                placeholder="Invoice Baru"
                                disabled={isPending}
                            />
                        </div>
                    </div>

                    {/* ==================================
              CATEGORY
          ================================== */}
                    <div className="space-y-2">
                        <label htmlFor="template-category" className="text-sm font-medium">
                            Category
                        </label>

                        <select
                            id="template-category"
                            value={category}
                            onChange={(event) =>
                                setCategory(
                                    event.target.value as (typeof whatsappTemplateCategories)[number],
                                )
                            }
                            disabled={isPending}
                            className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                            {whatsappTemplateCategories.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* ==================================
              DESCRIPTION
          ================================== */}
                    <div className="space-y-2">
                        <label htmlFor="template-description" className="text-sm font-medium">
                            Deskripsi
                        </label>

                        <textarea
                            id="template-description"
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            rows={2}
                            maxLength={1000}
                            disabled={isPending}
                            placeholder="Template dikirim ketika invoice pelanggan dibuat."
                            className="flex w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
                        />
                    </div>

                    {/* ==================================
                            MESSAGE BODY
                        ================================== */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Isi Pesan
                        </label>

                        <WhatsAppRichTextEditor
                            value={
                                contentJson
                            }
                            disabled={
                                isPending
                            }
                            onChange={(
                                content,
                                whatsappBody,
                            ) => {
                                setContentJson(
                                    content,
                                );

                                setBody(
                                    whatsappBody,
                                );
                            }}
                        />

                        <p className="text-xs text-muted-foreground">
                            Gunakan toolbar untuk Bold, Italic, Bullet, Numbering dan Indent. Pada list Anda juga bisa memakai Tab dan Shift+Tab.
                        </p>
                    </div>
                    {/* ==================================
                            WHATSAPP PREVIEW
                        ================================== */}
                    {body && (
                        <WhatsAppTemplatePreview
                            body={body}
                            variables={variables}
                        />
                    )}

                    {/* ==================================
                            VARIABLES
                        ================================== */}
                    <div className="space-y-3 rounded-lg border p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-medium">Variables</p>
                                <p className="text-xs text-muted-foreground">
                                    Daftar variable yang boleh digunakan oleh template.
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isPending}
                                onClick={addVariable}
                            >
                                <Plus />
                                Tambah Variable
                            </Button>
                        </div>

                        {variables.length === 0 ? (
                            <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                                Template belum memiliki variable.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {variables.map((variable, index) => (
                                    <div
                                        key={index}
                                        className="grid gap-3 rounded-md border p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
                                    >
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium">Key</label>

                                            <Input
                                                value={variable.key}
                                                onChange={(event) =>
                                                    updateVariable(index, "key", event.target.value)
                                                }
                                                placeholder="customer_name"
                                                disabled={isPending}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-medium">Label</label>

                                            <Input
                                                value={variable.label}
                                                onChange={(event) =>
                                                    updateVariable(index, "label", event.target.value)
                                                }
                                                placeholder="Nama Customer"
                                                disabled={isPending}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-medium">Contoh</label>

                                            <Input
                                                value={variable.example}
                                                onChange={(event) =>
                                                    updateVariable(index, "example", event.target.value)
                                                }
                                                placeholder="Budi"
                                                disabled={isPending}
                                            />
                                        </div>

                                        <div className="flex items-end">
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                disabled={isPending}
                                                onClick={() => removeVariable(index)}
                                                aria-label="Hapus variable"
                                            >
                                                <Trash2 />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ==================================
              ERROR
          ================================== */}
                    {error && (
                        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    {/* ==================================
              ACTION
          ================================== */}
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => setOpen(false)}
                        >
                            Batal
                        </Button>

                        <Button
                            type="submit"
                            disabled={isPending || !key.trim() || !name.trim() || !body.trim()}
                        >
                            {isPending ? "Menyimpan..." : "Simpan Template"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}