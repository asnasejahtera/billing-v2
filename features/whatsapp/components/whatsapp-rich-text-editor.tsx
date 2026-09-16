"use client";

import {
    Bold,
    IndentDecrease,
    IndentIncrease,
    Italic,
    List,
    ListOrdered,
    Redo2,
    Strikethrough,
    Undo2,
} from "lucide-react";

import {
    useEffect,
} from "react";

import {
    EditorContent,
    useEditor,
} from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";

import {
    Button,
} from "@/components/ui/button";

import {
    richTextToWhatsApp,
} from "../lib/rich-text-to-whatsapp";

import {
    EMPTY_WHATSAPP_TEMPLATE_CONTENT,
} from "../schemas/whatsapp-template.schema";

/**
 * ============================================
 * PROPS
 * ============================================
 */
type Props = {
    value?:
    | Record<string, unknown>
    | null;

    disabled?: boolean;

    onChange: (
        content:
            Record<string, unknown>,
        whatsappBody: string,
    ) => void;
};

/**
 * ============================================
 * CONTENT COMPARE
 * ============================================
 */
function sameContent(
    first: Record<string, unknown>,
    second: Record<string, unknown>,
): boolean {
    return (
        JSON.stringify(first) ===
        JSON.stringify(second)
    );
}

/**
 * ============================================
 * EDITOR
 * ============================================
 */
export function WhatsAppRichTextEditor({
    value,
    disabled = false,
    onChange,
}: Props) {
    const initialContent =
        value ??
        EMPTY_WHATSAPP_TEMPLATE_CONTENT;

    const editor =
        useEditor({
            extensions: [
                StarterKit.configure({
                    heading: false,
                    codeBlock: false,
                    horizontalRule:
                        false,
                }),
            ],

            /**
             * Value database digunakan langsung
             * saat instance editor dibuat.
             */
            content:
                initialContent,

            editable:
                !disabled,

            /**
             * Wajib untuk Next.js SSR.
             */
            immediatelyRender:
                false,

            editorProps: {
                attributes: {
                    class:
                        "min-h-44 px-3 py-3 text-sm outline-none [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul_ul]:pl-6 [&_ol_ol]:pl-6 [&_li]:my-1",
                },
            },

            /**
             * ======================================
             * USER EDIT
             * ======================================
             */
            onUpdate({
                editor,
            }) {
                const json =
                    editor.getJSON() as Record<
                        string,
                        unknown
                    >;

                onChange(
                    json,
                    richTextToWhatsApp(
                        json,
                    ),
                );
            },
        });

    /**
     * ============================================
     * SYNC DATABASE VALUE
     * ============================================
     *
     * Backup synchronization jika value parent
     * berubah tanpa remount.
     */
    useEffect(() => {
        if (!editor) {
            return;
        }

        const next =
            value ??
            EMPTY_WHATSAPP_TEMPLATE_CONTENT;

        const current =
            editor.getJSON() as Record<
                string,
                unknown
            >;

        if (
            sameContent(
                current,
                next,
            )
        ) {
            return;
        }

        editor.commands.setContent(
            next,
            {
                emitUpdate:
                    false,
            },
        );
    }, [
        editor,
        value,
    ]);

    /**
     * ============================================
     * EDITABLE
     * ============================================
     */
    useEffect(() => {
        if (!editor) {
            return;
        }

        editor.setEditable(
            !disabled,
        );
    }, [
        editor,
        disabled,
    ]);

    /**
     * ============================================
     * LOADING
     * ============================================
     */
    if (!editor) {
        return (
            <div className="h-44 animate-pulse rounded-md border bg-muted/30" />
        );
    }

    const currentEditor =
        editor;

    /**
     * ============================================
     * INDENT
     * ============================================
     */
    function indent() {
        if (
            currentEditor.isActive(
                "listItem",
            )
        ) {
            currentEditor
                .chain()
                .focus()
                .sinkListItem(
                    "listItem",
                )
                .run();

            return;
        }

        currentEditor
            .chain()
            .focus()
            .insertContent(
                "    ",
            )
            .run();
    }

    /**
     * ============================================
     * OUTDENT
     * ============================================
     */
    function outdent() {
        if (
            !currentEditor.isActive(
                "listItem",
            )
        ) {
            return;
        }

        currentEditor
            .chain()
            .focus()
            .liftListItem(
                "listItem",
            )
            .run();
    }

    return (
        <div className="overflow-hidden rounded-md border">
            {/* ======================================
          TOOLBAR
      ====================================== */}
            <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 p-1">
                <Button
                    type="button"
                    size="icon"
                    variant={
                        currentEditor.isActive(
                            "bold",
                        )
                            ? "secondary"
                            : "ghost"
                    }
                    disabled={
                        disabled
                    }
                    onClick={() =>
                        currentEditor
                            .chain()
                            .focus()
                            .toggleBold()
                            .run()
                    }
                    title="Bold"
                >
                    <Bold />
                </Button>

                <Button
                    type="button"
                    size="icon"
                    variant={
                        currentEditor.isActive(
                            "italic",
                        )
                            ? "secondary"
                            : "ghost"
                    }
                    disabled={
                        disabled
                    }
                    onClick={() =>
                        currentEditor
                            .chain()
                            .focus()
                            .toggleItalic()
                            .run()
                    }
                    title="Italic"
                >
                    <Italic />
                </Button>

                <Button
                    type="button"
                    size="icon"
                    variant={
                        currentEditor.isActive(
                            "strike",
                        )
                            ? "secondary"
                            : "ghost"
                    }
                    disabled={
                        disabled
                    }
                    onClick={() =>
                        currentEditor
                            .chain()
                            .focus()
                            .toggleStrike()
                            .run()
                    }
                    title="Coret"
                >
                    <Strikethrough />
                </Button>

                <div className="mx-1 h-6 w-px bg-border" />

                <Button
                    type="button"
                    size="icon"
                    variant={
                        currentEditor.isActive(
                            "bulletList",
                        )
                            ? "secondary"
                            : "ghost"
                    }
                    disabled={
                        disabled
                    }
                    onClick={() =>
                        currentEditor
                            .chain()
                            .focus()
                            .toggleBulletList()
                            .run()
                    }
                    title="Bullet List"
                >
                    <List />
                </Button>

                <Button
                    type="button"
                    size="icon"
                    variant={
                        currentEditor.isActive(
                            "orderedList",
                        )
                            ? "secondary"
                            : "ghost"
                    }
                    disabled={
                        disabled
                    }
                    onClick={() =>
                        currentEditor
                            .chain()
                            .focus()
                            .toggleOrderedList()
                            .run()
                    }
                    title="Numbered List"
                >
                    <ListOrdered />
                </Button>

                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={
                        disabled
                    }
                    onClick={
                        indent
                    }
                    title="Indent / Tab"
                >
                    <IndentIncrease />
                </Button>

                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={
                        disabled ||
                        !currentEditor.isActive(
                            "listItem",
                        )
                    }
                    onClick={
                        outdent
                    }
                    title="Outdent / Shift+Tab"
                >
                    <IndentDecrease />
                </Button>

                <div className="mx-1 h-6 w-px bg-border" />

                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={
                        disabled ||
                        !currentEditor
                            .can()
                            .undo()
                    }
                    onClick={() =>
                        currentEditor
                            .chain()
                            .focus()
                            .undo()
                            .run()
                    }
                    title="Undo"
                >
                    <Undo2 />
                </Button>

                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={
                        disabled ||
                        !currentEditor
                            .can()
                            .redo()
                    }
                    onClick={() =>
                        currentEditor
                            .chain()
                            .focus()
                            .redo()
                            .run()
                    }
                    title="Redo"
                >
                    <Redo2 />
                </Button>
            </div>

            {/* ======================================
          CONTENT
      ====================================== */}
            <EditorContent
                editor={
                    currentEditor
                }
            />
        </div>
    );
}