export type ParsedPlanComment = {
  name: string;
  price: string;
};

export function parsePlanComment(
  comment: string | undefined,
  profileName: string,
): ParsedPlanComment {
  const value = comment?.trim() ?? "";

  if (!value) {
    return {
      name: profileName,
      price: "0",
    };
  }

  const separatorIndex =
    value.lastIndexOf("|");

  if (separatorIndex === -1) {
    return {
      name: value,
      price: "0",
    };
  }

  const name =
    value
      .slice(0, separatorIndex)
      .trim() || profileName;

  const priceText =
    value
      .slice(separatorIndex + 1)
      .trim();

  const digits =
    priceText.replace(
      /[^\d]/g,
      "",
    );

  return {
    name,
    price:
      digits.length > 0
        ? digits
        : "0",
  };
}