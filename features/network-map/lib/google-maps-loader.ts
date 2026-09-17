import {
  importLibrary,
  setOptions,
} from "@googlemaps/js-api-loader";

let configured = false;

function configureGoogleMaps() {
  if (configured) return;

  const apiKey = "AIzaSyBDD4lrYzv2d5xihld0InRiGXxn4ILJQSA";

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
  return ("4cfb869e2eca19db4cb4fc2b");
}