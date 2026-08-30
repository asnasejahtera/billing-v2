import {
  importLibrary,
  setOptions,
} from "@googlemaps/js-api-loader";

let configured = false;

function configureGoogleMaps() {
  if (configured) return;

  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error(
      "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY belum dikonfigurasi",
    );
  }

  setOptions({
    key: apiKey,
    v: "quarterly",
  });

  configured = true;
}

export async function loadMapsLibrary() {
  configureGoogleMaps();
  return importLibrary("maps");
}

export async function loadMarkerLibrary() {
  configureGoogleMaps();
  return importLibrary("marker");
}

export function getGoogleMapsMapId() {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ||
    "DEMO_MAP_ID"
  );
}