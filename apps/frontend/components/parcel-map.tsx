"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, Polygon, TileLayer, Tooltip } from "react-leaflet";
import { stageLabel } from "@/lib/demo-data";
import type { ParcelFeature } from "@/lib/types";

const colors: Record<string, string> = { notification: "#7c8b85", verification: "#3f7cac", objection: "#d97706", award: "#7c3aed", compensation: "#13966f", possession: "#185c42" };

export default function ParcelMap({ parcels, onSelect }: { parcels: ParcelFeature[]; onSelect?: (caseId: string) => void }) {
  return (
    <MapContainer center={[18.5538, 73.9505]} zoom={15} scrollWheelZoom className="mapCanvas">
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {parcels.map((parcel) => <Polygon key={parcel.id} positions={parcel.coordinates} pathOptions={{ color: colors[parcel.stage], fillColor: colors[parcel.stage], fillOpacity: 0.58, weight: 2 }} eventHandlers={{ click: () => onSelect?.(parcel.case_id) }}><Tooltip><strong>{parcel.survey_number}</strong><br />{stageLabel(parcel.stage)} · {parcel.area_hectares.toFixed(2)} ha</Tooltip></Polygon>)}
    </MapContainer>
  );
}
