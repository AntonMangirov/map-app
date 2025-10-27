import { useMapEvents } from "react-leaflet";
import { getFeatureByPoint, type WFSError } from "../services/wfsService";
import type { WFSFeature } from "../services/wfsService";
import { ErrorHandler } from "../utils/errorHandler";

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

        if ("type" in response && response.type === "VALIDATION_ERROR") {
          const error = response as WFSError;
          console.warn(`WFS Error: ${error.message}`, error.context);
          return;
        }

        if (
          response &&
          "features" in response &&
          response.features &&
          response.features.length > 0
        ) {
          const feature = response.features[0];
          onFeatureClick(feature);
        } else {
          console.log("No features found at this location");
        }
      } catch (error) {
        const appError = ErrorHandler.handleFetchError(error, {
          layerName,
          coordinates: { lat, lng },
        });
        console.warn(`Map click error: ${appError.message}`, appError.context);
      }
    },
  });

  return map;
};
