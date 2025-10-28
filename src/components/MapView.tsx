import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  WMSTileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import { Icon } from "leaflet";
import { Typography, Box } from "@mui/material";
import type { WFSFeature, WFSResponse } from "../services/wfsService";
import type { ServiceError } from "../types/errorTypes";
import { getWMSUrl } from "../services/wmsService";
import { useWFSQuery } from "../hooks/useAsync";
import ErrorBoundary from "./ErrorBoundary";
import { MapLoadingOverlay } from "./LoadingStates";
import { TypedErrorDisplay } from "./TypedErrorDisplay";
import { useWMSConnection } from "../hooks/useAsync";
import { useErrorNotifications } from "../contexts/NotificationContext";

interface MapViewProps {
  selectedLayers: {
    wms: boolean;
    wfs: boolean;
    zws: boolean;
  };
  onFeatureClick: (feature: WFSFeature) => void;
}

const FeatureMarker: React.FC<{
  feature: WFSFeature | null;
}> = ({ feature }) => {
  if (!feature) {
    return null;
  }

  if (!feature.geometry || feature.geometry.type !== "Point") {
    return null;
  }

  const coordinates = feature.geometry.coordinates as [number, number];
  const [lng, lat] = coordinates;

  const customIcon = new Icon({
    iconUrl:
      "data:image/svg+xml;base64," +
      btoa(`
      <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="#3388ff"/>
        <circle cx="12.5" cy="12.5" r="8" fill="white"/>
      </svg>
    `),
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41],
  });

  return (
    <Marker position={[lat, lng]} icon={customIcon}>
      <Popup>
        <Box sx={{ p: 1 }}>
          <Typography variant="h6" gutterBottom>
            {import.meta.env.VITE_DEFAULT_LAYER_NAME || "Объект"}
          </Typography>

          <Typography
            variant="caption"
            sx={{ color: "text.secondary", display: "block", mb: 1 }}
          >
            Coordinates: [{lat.toFixed(6)}, {lng.toFixed(6)}]
          </Typography>

          {Object.entries(feature.properties).map(([key, value]) => (
            <Box key={key} sx={{ mb: 0.5 }}>
              <Typography
                variant="body2"
                component="span"
                sx={{ fontWeight: "bold" }}
              >
                {key}:
              </Typography>
              <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                {String(value)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Popup>
    </Marker>
  );
};

const MapClickHandler: React.FC<{
  onFeatureClick: (feature: WFSFeature) => void;
  layerName?: string;
}> = ({ onFeatureClick, layerName }) => {
  const wfsQuery = useWFSQuery();

  useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;

      if (!layerName) {
        const testFeature: WFSFeature = {
          type: "Feature",
          properties: {
            name: "Клик по карте",
            description: "Создано кликом",
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
        const result = await wfsQuery.execute(lat, lng, layerName);

        if (
          result &&
          typeof result === "object" &&
          "features" in result &&
          (result as WFSResponse).features &&
          (result as WFSResponse).features.length > 0
        ) {
          const feature = (result as WFSResponse).features[0];
          onFeatureClick(feature);
        } else {
          const testFeature: WFSFeature = {
            type: "Feature",
            properties: {
              name: "Клик по карте",
              description: "Создано кликом (WFS пустой)",
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
        }
      } catch (error) {
        console.error("Error fetching WFS data:", error);
        const testFeature: WFSFeature = {
          type: "Feature",
          properties: {
            name: "Клик по карте",
            description: "Создано кликом (WFS ошибка)",
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
      }
    },
  });

  return null;
};

const MapView: React.FC<MapViewProps> = ({
  selectedLayers,
  onFeatureClick,
}) => {
  const [selectedFeature, setSelectedFeature] = useState<WFSFeature | null>(
    null
  );
  const [layerName] = useState(
    import.meta.env.VITE_DEFAULT_LAYER_NAME || "test_layer"
  );

  const center: [number, number] = [
    Number(import.meta.env.VITE_MAP_CENTER_LAT) || 55.7558,
    Number(import.meta.env.VITE_MAP_CENTER_LNG) || 37.6176,
  ];
  const zoom = Number(import.meta.env.VITE_MAP_ZOOM) || 10;

  const handleFeatureClick = (feature: WFSFeature) => {
    setSelectedFeature(feature);
    onFeatureClick(feature);
  };

  const wmsUrlOrError = getWMSUrl(layerName);
  const wmsError = typeof wmsUrlOrError !== "string" ? wmsUrlOrError : null;
  const wmsConnection = useWMSConnection();
  const { handleError } = useErrorNotifications();

  useEffect(() => {
    if (selectedLayers.wms && !wmsError) {
      wmsConnection.execute(layerName);
    }
  }, [selectedLayers.wms, layerName, wmsError, wmsConnection]);

  useEffect(() => {
    if (wmsConnection.error) {
      handleError(wmsConnection.error as ServiceError);
    }
  }, [wmsConnection.error, handleError]);

  return (
    <ErrorBoundary>
      <Box sx={{ position: "relative", height: "100%", width: "100%" }}>
        <MapContainer
          center={center}
          zoom={zoom}
          style={{
            height: "100%",
            width: "100%",
            zIndex: 1,
            position: "relative",
          }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {selectedLayers.wms && (
            <>
              {wmsError ? (
                <Box
                  sx={{
                    position: "absolute",
                    top: 10,
                    left: 60,
                    right: 10,
                    pointerEvents: "none",
                  }}
                >
                  <TypedErrorDisplay
                    error={wmsError}
                    compact={true}
                    onRetry={() => {
                      if (selectedLayers.wms) {
                        wmsConnection.execute(layerName);
                      }
                    }}
                  />
                </Box>
              ) : (
                <WMSTileLayer
                  url={wmsUrlOrError as string}
                  layers={layerName}
                  format="image/png"
                  transparent={true}
                  version="1.3.0"
                />
              )}
            </>
          )}

          <MapClickHandler
            onFeatureClick={handleFeatureClick}
            layerName={selectedLayers.wfs ? layerName : undefined}
          />

          <FeatureMarker feature={selectedFeature} />
        </MapContainer>

        <MapLoadingOverlay
          loading={wmsConnection.loading}
          message="Проверка соединения с WMS сервисом..."
        />
      </Box>
    </ErrorBoundary>
  );
};

export default MapView;
