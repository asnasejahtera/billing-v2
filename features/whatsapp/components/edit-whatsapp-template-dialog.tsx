"use client";

import {
    Pencil,
    Plus,
    Trash2,
} from "lucide-react";
import {
    useState,
    useTransition,
} from "react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import type {
    WhatsAppMessageTemplate,
    WhatsAppTemplateVariable,
} from "@/db/schema/whatsapp-message-templates";

import {
    updateWhatsAppTemplateAction,
} from "../actions/whatsapp-template.actions";
import {
    whatsappTemplateCategories,
} from "../schemas/whatsapp-template.schema";
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
type Props = {
    template: WhatsAppMessageTemplate;
};

type VariableInput = {
    key: string;
    label: string;
    example: string;
};

type TiptapNode = {
    type?: string;
    text?: string;
    content?: TiptapNode[];
};

/**
 * ============================================
 * CHECK REAL TIPTAP CONTENT
 * ============================================
 *
 * Dokumen seperti:
 *
 * {
 *   type: "doc",
 *   content: [{ type: "paragraph" }]
 * }
 *
 * HARUS dianggap kosong.
 */
function hasMeaningfulContent(
    value: Record<string, unknown> | null,
): boolean {
    if (!value) return false;

    const root =
        value as TiptapNode;

    function check(
        node: TiptapNode,
    ): boolean {
        /**
         * Text benar-benar mempunyai karakter.
         */
        if (
            node.type === "text" &&
            typeof node.text === "string" &&
            node.text.length > 0
        ) {
            return true;
        }

        /**
         * Cari isi pada child node.
         */
        return (
            node.content?.some(
                check,
            ) ??
            false
        );
    }

    return check(root);
}

/**
 * ============================================
 * TEXT NODE
 * ============================================
 */
function createTextParagraph(
    text: string,
): Record<string, unknown> {
    if (!text) {
        return {
            type: "paragraph",
        };
    }

    return {
        type: "paragraph",
        content: [
            {
                type: "text",
                text,
            },
        ],
    };
}

/**
 * ============================================
 * LIST ITEM
 * ============================================
 */
function createListItem(
    text: string,
): Record<string, unknown> {
    return {
        type: "listItem",
        content: [
            createTextParagraph(
                text,
            ),
        ],
    };
}

/**
 * ============================================
 * BODY → TIPTAP
 * ============================================
 *
 * Dipakai untuk:
 *
 * - template lama
 * - content_json NULL
 * - content_json kosong
 * - migration dari textarea lama
 *
 * Bullet dan numbering dasar ikut dikembalikan
 * menjadi struktur Tiptap.
 */
function bodyToRichText(
    body: string,
): Record<string, unknown> {
    if (!body.trim()) {
        return {
            type: "doc",
            content: [
                {
                    type: "paragraph",
                },
            ],
        };
    }

    const lines =
        body.replace(
            /\r\n/g,
            "\n",
        ).split("\n");

    const content: Record<
        string,
        unknown
    >[] = [];

    let index = 0;

    while (
        index <
        lines.length
    ) {
        const line =
            lines[index] ?? "";

        /**
         * ----------------------------------------
         * BULLET LIST
         * ----------------------------------------
         */
        if (
            /^-\s+/.test(
                line,
            )
        ) {
            const items: Record<
                string,
                unknown
            >[] = [];

            while (
                index <
                lines.length &&
                /^-\s+/.test(
                    lines[index] ??
                    "",
                )
            ) {
                const text =
                    (
                        lines[index] ??
                        ""
                    ).replace(
                        /^-\s+/,
                        "",
                    );

                items.push(
                    createListItem(
                        text,
                    ),
                );

                index++;
            }

            content.push({
                type: "bulletList",
                content: items,
            });

            continue;
        }

        /**
         * ----------------------------------------
         * ORDERED LIST
         * ----------------------------------------
         */
        if (
            /^\d+\.\s+/.test(
                line,
            )
        ) {
            const items: Record<
                string,
                unknown
            >[] = [];

            const firstNumber =
                Number(
                    line.match(
                        /^(\d+)\./,
                    )?.[1] ??
                    "1",
                );

            while (
                index <
                lines.length &&
                /^\d+\.\s+/.test(
                    lines[index] ??
                    "",
                )
            ) {
                const text =
                    (
                        lines[index] ??
                        ""
                    ).replace(
                        /^\d+\.\s+/,
                        "",
                    );

                items.push(
                    createListItem(
                        text,
                    ),
                );

                index++;
            }

            content.push({
                type: "orderedList",
                attrs: {
                    start:
                        firstNumber,
                },
                content:
                    items,
            });

            continue;
        }

        /**
         * ----------------------------------------
         * NORMAL PARAGRAPH
         * ----------------------------------------
         */
        content.push(
            createTextParagraph(
                line,
            ),
        );

        index++;
    }

    return {
        type: "doc",
        content,
    };
}

/**
 * ============================================
 * RESOLVE TEMPLATE CONTENT
 * ============================================
 *
 * Prioritas:
 *
 * 1. content_json jika BENAR-BENAR memiliki isi.
 * 2. fallback ke body database.
 */
function getTemplateContent(
    template:
        WhatsAppMessageTemplate,
): Record<string, unknown> {
    if (
        hasMeaningfulContent(
            template.contentJson,
        )
    ) {
        return template.contentJson!;
    }

    /**
     * content_json kosong tidak boleh mengalahkan
     * body yang sebenarnya berisi pesan.
     */
    return bodyToRichText(
        template.body,
    );
}

/**
 * ============================================
 * VARIABLES
 * ============================================
 */
function normalizeVariables(
    variables:
        WhatsAppTemplateVariable[],
): VariableInput[] {
    return variables.map(
        (variable) => ({
            key:
                variable.key,
            label:
                variable.label,
            example:
                variable.example ??
                "",
        }),
    );
}

/**
 * ============================================
 * EDIT TEMPLATE DIALOG
 * ============================================
 */
export function EditWhatsAppTemplateDialog({
    template,
}: Props) {
    const [
        open,
        setOpen,
    ] =
        useState(false);

    /**
     * Setiap Dialog dibuka editor dibuat ulang.
     */
    const [
        editorVersion,
        setEditorVersion,
    ] =
        useState(0);

    const [
        isPending,
        startTransition,
    ] =
        useTransition();

    const [
        error,
        setError,
    ] =
        useState<
            string | null
        >(null);

    const [
        name,
        setName,
    ] =
        useState(
            template.name,
        );

    const [
        category,
        setCategory,
    ] =
        useState<
            (
                typeof whatsappTemplateCategories
            )[number]
        >(
            template.category as (
                typeof whatsappTemplateCategories
            )[number],
        );

    const [
        description,
        setDescription,
    ] =
        useState(
            template.description ??
            "",
        );

    const [
        body,
        setBody,
    ] =
        useState(
            template.body,
        );

    const [
        contentJson,
        setContentJson,
    ] =
        useState<
            Record<
                string,
                unknown
            >
        >(
            getTemplateContent(
                template,
            ),
        );

    const [
        variables,
        setVariables,
    ] =
        useState<
            VariableInput[]
        >(
            normalizeVariables(
                template.variables,
            ),
        );

    /**
     * ========================================
     * RESET FROM DATABASE
     * ========================================
     */
    function resetForm() {
        const resolvedContent =
            getTemplateContent(
                template,
            );

        setName(
            template.name,
        );

        setCategory(
            template.category as (
                typeof whatsappTemplateCategories
            )[number],
        );

        setDescription(
            template.description ??
            "",
        );

        setBody(
            template.body,
        );

        /**
         * Inilah data yang langsung diberikan
         * kepada instance Tiptap baru.
         */
        setContentJson(
            resolvedContent,
        );

        setVariables(
            normalizeVariables(
                template.variables,
            ),
        );

        setError(null);
    }

    /**
     * ========================================
     * OPEN
     * ========================================
     */
    function handleOpen() {
        resetForm();

        setEditorVersion(
            (current) =>
                current + 1,
        );

        setOpen(true);
    }

    /**
     * ========================================
     * DIALOG STATE
     * ========================================
     */
    function handleOpenChange(
        value: boolean,
    ) {
        setOpen(
            value,
        );

        if (!value) {
            setError(null);
        }
    }

    /**
     * ========================================
     * VARIABLE ACTIONS
     * ========================================
     */
    function addVariable() {
        setVariables(
            (current) => [
                ...current,
                {
                    key: "",
                    label: "",
                    example: "",
                },
            ],
        );
    }

    function updateVariable(
        index: number,
        field:
            keyof VariableInput,
        value: string,
    ) {
        setVariables(
            (current) =>
                current.map(
                    (
                        variable,
                        variableIndex,
                    ) =>
                        variableIndex ===
                            index
                            ? {
                                ...variable,
                                [field]:
                                    value,
                            }
                            : variable,
                ),
        );
    }

    function removeVariable(
        index: number,
    ) {
        setVariables(
            (current) =>
                current.filter(
                    (
                        _,
                        variableIndex,
                    ) =>
                        variableIndex !==
                        index,
                ),
        );
    }

    /**
     * ========================================
     * SUBMIT
     * ========================================
     */
    function handleSubmit(
        event:
            React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setError(null);

        startTransition(
            async () => {
                const result =
                    await updateWhatsAppTemplateAction(
                        {
                            id:
                                template.id,
                            name,
                            category,
                            description,
                            body,
                            contentJson,
                            variables,
                        },
                    );

                if (
                    !result.success
                ) {
                    setError(
                        result.message,
                    );

                    return;
                }

                setOpen(false);
            },
        );
    }

    return (
        <>
            {/* ======================================
          OPEN BUTTON
      ====================================== */}
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={
                    handleOpen
                }
            >
                <Pencil />
                Edit
            </Button>

            {/* ======================================
          DIALOG
      ====================================== */}
            <Dialog
                open={
                    open
                }
                onOpenChange={
                    handleOpenChange
                }
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            Edit Template WhatsApp
                        </DialogTitle>

                        <DialogDescription>
                            Ubah isi dan format template WhatsApp.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        className="space-y-5"
                        onSubmit={
                            handleSubmit
                        }
                    >
                        {/* ==================================
                KEY + NAME
            ================================== */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Key
                                </label>

                                <Input
                                    value={
                                        template.key
                                    }
                                    disabled
                                />

                                <p className="text-xs text-muted-foreground">
                                    Key merupakan identifier sistem dan tidak dapat diubah.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Nama
                                </label>

                                <Input
                                    value={
                                        name
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setName(
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    disabled={
                                        isPending
                                    }
                                />
                            </div>
                        </div>

                        {/* ==================================
                CATEGORY
            ================================== */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Category
                            </label>

                            <select
                                value={
                                    category
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setCategory(
                                        event
                                            .target
                                            .value as (
                                                typeof whatsappTemplateCategories
                                            )[number],
                                    )
                                }
                                disabled={
                                    isPending
                                }
                                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                            >
                                {whatsappTemplateCategories.map(
                                    (
                                        item,
                                    ) => (
                                        <option
                                            key={
                                                item
                                            }
                                            value={
                                                item
                                            }
                                        >
                                            {item}
                                        </option>
                                    ),
                                )}
                            </select>
                        </div>

                        {/* ==================================
                DESCRIPTION
            ================================== */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Deskripsi
                            </label>

                            <textarea
                                value={
                                    description
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setDescription(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                rows={2}
                                maxLength={
                                    1000
                                }
                                disabled={
                                    isPending
                                }
                                className="flex w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm outline-none"
                            />
                        </div>

                        {/* ==================================
                RICH TEXT MESSAGE
            ================================== */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Isi Pesan
                            </label>

                            {open && (
                                <WhatsAppRichTextEditor
                                    /**
                                     * Paksa instance Tiptap baru
                                     * setiap Dialog dibuka.
                                     */
                                    key={`${template.id}-${editorVersion}`}
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
                            )}
                        </div>


                        {/* ==================================
                                MESSAGE PREVIEW
                            ================================== */}
                        <WhatsAppTemplatePreview
                            body={body}
                            variables={variables}
                        />

                        {/* ==================================
                                VARIABLES
                            ================================== */}
                        <div className="space-y-3 rounded-lg border p-4">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm font-medium">
                                        Variables
                                    </p>

                                    <p className="text-xs text-muted-foreground">
                                        Variable yang tersedia untuk template.
                                    </p>
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={
                                        isPending
                                    }
                                    onClick={
                                        addVariable
                                    }
                                >
                                    <Plus />
                                    Tambah Variable
                                </Button>
                            </div>

                            {variables.length ===
                                0 ? (
                                <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                                    Belum ada variable.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {variables.map(
                                        (
                                            variable,
                                            index,
                                        ) => (
                                            <div
                                                key={
                                                    index
                                                }
                                                className="grid gap-3 rounded-md border p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
                                            >
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium">
                                                        Key
                                                    </label>

                                                    <Input
                                                        value={
                                                            variable.key
                                                        }
                                                        placeholder="customer_name"
                                                        disabled={
                                                            isPending
                                                        }
                                                        onChange={(
                                                            event,
                                                        ) =>
                                                            updateVariable(
                                                                index,
                                                                "key",
                                                                event
                                                                    .target
                                                                    .value,
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium">
                                                        Label
                                                    </label>

                                                    <Input
                                                        value={
                                                            variable.label
                                                        }
                                                        placeholder="Nama Customer"
                                                        disabled={
                                                            isPending
                                                        }
                                                        onChange={(
                                                            event,
                                                        ) =>
                                                            updateVariable(
                                                                index,
                                                                "label",
                                                                event
                                                                    .target
                                                                    .value,
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium">
                                                        Contoh
                                                    </label>

                                                    <Input
                                                        value={
                                                            variable.example
                                                        }
                                                        placeholder="Budi"
                                                        disabled={
                                                            isPending
                                                        }
                                                        onChange={(
                                                            event,
                                                        ) =>
                                                            updateVariable(
                                                                index,
                                                                "example",
                                                                event
                                                                    .target
                                                                    .value,
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="flex items-end">
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        disabled={
                                                            isPending
                                                        }
                                                        onClick={() =>
                                                            removeVariable(
                                                                index,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 />
                                                    </Button>
                                                </div>
                                            </div>
                                        ),
                                    )}
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
                                disabled={
                                    isPending
                                }
                                onClick={() =>
                                    setOpen(
                                        false,
                                    )
                                }
                            >
                                Batal
                            </Button>

                            <Button
                                type="submit"
                                disabled={
                                    isPending ||
                                    !name.trim() ||
                                    !body.trim()
                                }
                            >
                                {isPending
                                    ? "Menyimpan..."
                                    : "Simpan Perubahan"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}