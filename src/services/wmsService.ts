export const getWMSUrl = (layerName: string): string => {
  const baseUrl = import.meta.env.VITE_WMS_BASE_URL;
  if (!baseUrl) {
    console.error("WMS URL not configured");
    return "";
  }

  const params = new URLSearchParams({
    service: "WMS",
    version: "1.3.0",
    request: "GetMap",
    layers: layerName,
    format: "image/png",
    transparent: "true",
    crs: "EPSG:4326",
  });

  return `${baseUrl}?${params.toString()}`;
};
