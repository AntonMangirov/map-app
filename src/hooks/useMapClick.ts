import { useMapEvents } from "react-leaflet";
import { WFSService } from "../services/wfsService";
import type { WFSFeature } from "../services/wfsService";

interface UseMapClickProps {
  onFeatureClick: (feature: WFSFeature) => void;
  onError?: (error: Error) => void;
  wfsService?: WFSService;
  layerName?: string;
}

export const useMapClick = ({
  onFeatureClick,
  onError,
  wfsService,
  layerName,
}: UseMapClickProps) => {
  const map = useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;

      if (!wfsService || !layerName) {
        console.log("WFS service or layer name not provided - using test mode");
        const testFeature = {
          type: "Feature" as const,
          properties: {
            name: "Тестовый объект",
            description: "Это демонстрационный объект",
            coordinates: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            timestamp: new Date().toLocaleString(),
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
        const response = await wfsService.getFeatureByPoint(
          lat,
          lng,
          layerName
        );

        if (response && response.features && response.features.length > 0) {
          const feature = response.features[0];
          onFeatureClick(feature);
        } else {
          console.log("No features found at this location");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error : new Error(String(error));
        console.error("Error fetching features:", errorMessage);
        if (onError) {
          onError(errorMessage);
        }
      }
    },
  });

  return map;
};
