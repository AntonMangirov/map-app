import React, { useState } from "react";
import {
  MapContainer,
  TileLayer,
  WMSTileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import { Icon } from "leaflet";
import { Typography, Box, Alert } from "@mui/material";
import { useMapClick } from "../hooks/useMapClick";
import type { WFSFeature } from "../services/wfsService";
import { getWMSUrl } from "../services/wmsService";
import ErrorBoundary from "./ErrorBoundary";

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
      <Popup maxWidth={300}>
        <Box sx={{ p: 1, minWidth: 200 }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ fontSize: "14px", fontWeight: "bold" }}
          >
            {import.meta.env.VITE_DEFAULT_LAYER_NAME || "Объект"}
          </Typography>

          <Typography
            variant="caption"
            sx={{ color: "text.secondary", display: "block", mb: 1 }}
          >
            📍 [{lat.toFixed(6)}, {lng.toFixed(6)}]
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
  useMapClick({ onFeatureClick, layerName });
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

  return (
    <ErrorBoundary>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
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
                <Alert
                  severity="warning"
                  sx={{
                    mb: 1,
                    pointerEvents: "auto",
                    "& .MuiAlert-message": {
                      fontSize: "0.875rem",
                    },
                  }}
                >
                  <Typography variant="body2">{wmsError.message}</Typography>
                </Alert>
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
    </ErrorBoundary>
  );
};

export default MapView;
