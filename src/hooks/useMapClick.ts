import { useCallback } from "react";
import { useMapEvents } from "react-leaflet";
import { LatLng } from "leaflet";
import { WFSService } from "../services/wfsService";
import type { WFSFeature } from "../services/wfsService";

interface UseMapClickProps {
  onFeatureClick: (feature: WFSFeature) => void;
  wfsService?: WFSService;
  layerName?: string;
}

export const useMapClick = ({
  onFeatureClick,
  wfsService,
  layerName,
}: UseMapClickProps) => {
  const map = useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;

      if (!wfsService || !layerName) {
        console.log("WFS service or layer name not provided - using test mode");
        // В тестовом режиме создаем фиктивную фичу
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
        // Получаем фичи по точке
        const response = await wfsService.getFeatureByPoint(
          lat,
          lng,
          layerName
        );

        if (response && response.features && response.features.length > 0) {
          // Берем первую найденную фичу
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
