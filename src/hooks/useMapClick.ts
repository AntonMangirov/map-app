import { useMapEvents } from "react-leaflet";
import { getFeatureByPoint } from "../services/wfsService";
import type { WFSFeature } from "../services/wfsService";

interface UseMapClickProps {
  onFeatureClick: (feature: WFSFeature) => void;
  layerName?: string;
}

export const useMapClick = ({
  onFeatureClick,
  layerName,
}: UseMapClickProps) => {
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

      try {
        const response = await getFeatureByPoint(lat, lng, layerName);

        if (response && response.features && response.features.length > 0) {
          const feature = response.features[0];
          onFeatureClick(feature);
        } else {
          console.log("No features found at this location");
        }
      } catch (error) {
        console.error("Error fetching features:", error);
      }
    },
  });

  return map;
};
