export interface WFSFeature {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
}

export interface WFSResponse {
  type: "FeatureCollection";
  features: WFSFeature[];
}

export const getFeatureByPoint = async (
  lat: number,
  lng: number,
  layerName: string
): Promise<WFSResponse | null> => {
  try {
    const baseUrl = import.meta.env.VITE_WFS_BASE_URL;
    const username = import.meta.env.VITE_WFS_USERNAME || "mo";
    const password = import.meta.env.VITE_WFS_PASSWORD || "mo";

    if (!baseUrl) {
      console.error("WFS URL not configured");
      return null;
    }

    const buffer = 0.001;
    const bbox = `${lng - buffer},${lat - buffer},${lng + buffer},${
      lat + buffer
    }`;

    const params = new URLSearchParams({
      service: "WFS",
      version: "1.1.0",
      request: "GetFeature",
      typeName: layerName,
      outputFormat: "application/json",
      bbox: bbox,
      srsname: "EPSG:4326",
    });

    const url = `${baseUrl}?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${btoa(`${username}:${password}`)}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error("Auth error");
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("WFS error:", error);
    return null;
  }
};
