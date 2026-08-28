import type { MikroTikPppProfile } from "@/services/mikrotik/resources/ppp-profile/types";
import { parsePlanComment } from "@/features/internet-plans/services/parse-plan-comment";

export type SyncedInternetPlan = {
  name: string;
  price: string;
  pppProfileName: string;
  bandwidthUpTo: string;
  rateLimit?: string;
  onlyOne:
    | "yes"
    | "no"
    | "default";
  status: "ACTIVE";
  ipPool?: string;
  localAddress?: string;
  mikrotikRef?: string;
  sourceComment?: string;
};

export function mapMikroTikProfileToInternetPlan(
  profile: MikroTikPppProfile,
): SyncedInternetPlan | null {
  const profileName =
    profile.name?.trim();

  if (!profileName) {
    return null;
  }

  const parsed =
    parsePlanComment(
      profile.comment,
      profileName,
    );

  return {
    name: parsed.name,
    price: parsed.price,

    pppProfileName:
      profileName,

    bandwidthUpTo:
      profileName,

    rateLimit:
      profile[
        "rate-limit"
      ]?.trim() ||
      undefined,

    onlyOne:
      normalizeOnlyOne(
        profile["only-one"],
      ),

    status: "ACTIVE",

    ipPool:
      profile[
        "remote-address"
      ]?.trim() ||
      undefined,

    localAddress:
      profile[
        "local-address"
      ]?.trim() ||
      undefined,

    mikrotikRef:
      profile[".id"],

    sourceComment:
      profile.comment?.trim() ||
      undefined,
  };
}

function normalizeOnlyOne(
  value?: string,
):
  | "yes"
  | "no"
  | "default" {
  if (
    value === "yes" ||
    value === "no"
  ) {
    return value;
  }

  return "default";
}