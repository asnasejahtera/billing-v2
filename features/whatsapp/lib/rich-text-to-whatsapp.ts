/**
 * ============================================
 * TYPES
 * ============================================
 */
type RichTextMark = {
  type?: string;
};

type RichTextNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: RichTextMark[];
  content?: RichTextNode[];
};

/**
 * ============================================
 * TEXT
 * ============================================
 */
function serializeText(
  node: RichTextNode,
): string {
  let text =
    node.text ?? "";

  if (!text) return "";

  for (
    const mark of
    node.marks ?? []
  ) {
    switch (
      mark.type
    ) {
      case "bold":
        text =
          `*${text}*`;
        break;

      case "italic":
        text =
          `_${text}_`;
        break;

      case "strike":
        text =
          `~${text}~`;
        break;

      case "code":
        text =
          `\`${text}\``;
        break;
    }
  }

  return text;
}

/**
 * ============================================
 * INLINE
 * ============================================
 */
function serializeInline(
  nodes: RichTextNode[] = [],
): string {
  return nodes
    .map(
      (
        node,
      ): string => {
        if (
          node.type ===
          "text"
        ) {
          return serializeText(
            node,
          );
        }

        if (
          node.type ===
          "hardBreak"
        ) {
          return "\n";
        }

        return serializeInline(
          node.content ?? [],
        );
      },
    )
    .join("");
}

/**
 * ============================================
 * LIST ITEM
 * ============================================
 */
function serializeListItem(
  node: RichTextNode,
  prefix: string,
  depth: number,
): string {
  const indent =
    "    ".repeat(
      depth,
    );

  const children =
    node.content ?? [];

  const firstParagraph =
    children.find(
      (child) =>
        child.type ===
        "paragraph",
    );

  const lines: string[] = [
    `${indent}${prefix}${serializeInline(
      firstParagraph?.content ??
        [],
    )}`,
  ];

  for (
    const child of
    children
  ) {
    if (
      child ===
      firstParagraph
    ) {
      continue;
    }

    if (
      child.type ===
        "bulletList" ||
      child.type ===
        "orderedList"
    ) {
      lines.push(
        serializeList(
          child,
          depth + 1,
        ),
      );

      continue;
    }

    if (
      child.type ===
      "paragraph"
    ) {
      const value =
        serializeInline(
          child.content ?? [],
        );

      if (value) {
        lines.push(
          `${"    ".repeat(
            depth + 1,
          )}${value}`,
        );
      }
    }
  }

  return lines.join(
    "\n",
  );
}

/**
 * ============================================
 * LIST
 * ============================================
 */
function serializeList(
  node: RichTextNode,
  depth = 0,
): string {
  const ordered =
    node.type ===
    "orderedList";

  const start =
    typeof node.attrs
      ?.start ===
    "number"
      ? node.attrs.start
      : 1;

  return (
    node.content ?? []
  )
    .filter(
      (item) =>
        item.type ===
        "listItem",
    )
    .map(
      (
        item,
        index,
      ): string =>
        serializeListItem(
          item,
          ordered
            ? `${start + index}. `
            : "- ",
          depth,
        ),
    )
    .join("\n");
}

/**
 * ============================================
 * BLOCK
 * ============================================
 */
function serializeBlock(
  node: RichTextNode,
): string {
  switch (
    node.type
  ) {
    case "paragraph":
      return serializeInline(
        node.content ?? [],
      );

    case "bulletList":
    case "orderedList":
      return serializeList(
        node,
      );

    case "blockquote":
      return serializeBlocks(
        node.content ?? [],
      )
        .split("\n")
        .map(
          (line) =>
            `> ${line}`,
        )
        .join("\n");

    default:
      return serializeInline(
        node.content ?? [],
      );
  }
}

/**
 * ============================================
 * BLOCK COLLECTION
 * ============================================
 */
function serializeBlocks(
  nodes: RichTextNode[],
): string {
  return nodes
    .map(
      serializeBlock,
    )
    .filter(Boolean)
    .join("\n\n");
}

/**
 * ============================================
 * TIPTAP → WHATSAPP
 * ============================================
 */
export function richTextToWhatsApp(
  json: Record<string, unknown>,
): string {
  const root =
    json as RichTextNode;

  return serializeBlocks(
    root.content ?? [],
  ).trim();
}