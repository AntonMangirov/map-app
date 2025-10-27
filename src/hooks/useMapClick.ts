import { useMapEvents } from "react-leaflet";
import type { WFSFeature } from "../services/wfsService";
import { useWFSQuery } from "./useAsync";

interface UseMapClickProps {
  onFeatureClick: (feature: WFSFeature) => void;
  layerName?: string;
}

export const useMapClick = ({
  onFeatureClick,
  layerName,
}: UseMapClickProps) => {
  const wfsQuery = useWFSQuery();

  const map = useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;

      if (!layerName) {
        const testFeature: WFSFeature = {
          type: "Feature",
          properties: {
            name: "Тестовый объект",
            description: "Тестовый объект",
            coordinates: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            timestamp: new Date().toLocaleString(),
            id: Math.random().toString(36).substr(2, 9),
          },
          geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
        };
        onFeatureClick(testFeature);
        return;
      }

      const result = await wfsQuery.execute(lat, lng, layerName);

      if (
        result &&
        typeof result === "object" &&
        "features" in result &&
        (result as any).features &&
        (result as any).features.length > 0
      ) {
        const feature = (result as any).features[0];
        onFeatureClick(feature);
      } else if (!wfsQuery.loading && !wfsQuery.error) {
        console.log("No features found at this location");
      }
    },
  });

  return { map, wfsQuery };
};
