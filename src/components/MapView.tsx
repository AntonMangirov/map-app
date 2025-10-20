import React, { useState } from "react";
import {
  MapContainer,
  TileLayer,
  WMSTileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import { Icon } from "leaflet";
import { Button, Typography, Box } from "@mui/material";
import { useMapClick } from "../hooks/useMapClick";
import { WFSService } from "../services/wfsService";
import type { WFSFeature } from "../services/wfsService";
import { WMSService } from "../services/wmsService";

interface MapViewProps {
  selectedLayers: {
    wms: boolean;
    wfs: boolean;
    zws: boolean;
  };
  onFeatureClick: (feature: WFSFeature) => void;
  onError?: (error: Error) => void;
}

const MapClickHandler: React.FC<{
  onFeatureClick: (feature: WFSFeature) => void;
  onError?: (error: Error) => void;
  wfsService?: WFSService;
  layerName?: string;
}> = ({ onFeatureClick, onError, wfsService, layerName }) => {
  useMapClick({ onFeatureClick, onError, wfsService, layerName });
  return null;
};

const FeatureMarker: React.FC<{
  feature: WFSFeature | null;
  onShowDetails: (feature: WFSFeature) => void;
}> = ({ feature, onShowDetails }) => {
  if (!feature || !feature.geometry || feature.geometry.type !== "Point") {
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

  // Ключевые поля для Popup (первые 3-4 свойства)
  const keyProperties = Object.entries(feature.properties).slice(0, 4);
  const hasMoreProperties = Object.keys(feature.properties).length > 4;

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

          {/* Координаты */}
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", display: "block", mb: 1 }}
          >
            📍 [{lat.toFixed(6)}, {lng.toFixed(6)}]
          </Typography>

          {/* Ключевые свойства */}
          {keyProperties.map(([key, value]) => (
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

          {/* Кнопка "Подробнее" */}
          {hasMoreProperties && (
            <Box sx={{ mt: 1, textAlign: "center" }}>
              <Button
                variant="contained"
                size="small"
                onClick={() => onShowDetails(feature)}
                sx={{
                  fontSize: "11px",
                  py: 0.5,
                  px: 1,
                }}
              >
                Подробнее ({Object.keys(feature.properties).length - 4} ещё)
              </Button>
            </Box>
          )}
        </Box>
      </Popup>
    </Marker>
  );
};

const MapView: React.FC<MapViewProps> = ({
  selectedLayers,
  onFeatureClick,
  onError,
}) => {
  const [wfsService] = useState(() => new WFSService());
  const [wmsService] = useState(() => new WMSService());
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

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {selectedLayers.wms && (
        <WMSTileLayer
          url={wmsService.baseUrl}
          layers={layerName}
          format="image/png"
          transparent={true}
          version="1.3.0"
        />
      )}

      <MapClickHandler
        onFeatureClick={handleFeatureClick}
        onError={onError}
        wfsService={selectedLayers.wfs ? wfsService : undefined}
        layerName={layerName}
      />

      <FeatureMarker feature={selectedFeature} onShowDetails={onFeatureClick} />
    </MapContainer>
  );
};

export default MapView;
