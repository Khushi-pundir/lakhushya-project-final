import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const markerColors = {
  donor: "#2f855a",
  ngo: "#dd6b20",
  volunteer: "#2563eb",
  default: "#4b5563",
};

async function getRouteGeometry(segment) {
  if (!segment?.from || !segment?.to) {
    return [];
  }

  const { from, to } = segment;
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Route fetch failed");
  }

  const data = await response.json();
  const coordinates = data?.routes?.[0]?.geometry?.coordinates || [];

  return coordinates.map(([lng, lat]) => [lat, lng]);
}

function createDivIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 10px 25px rgba(15,23,42,0.18);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export default function MapView({
  markers = [],
  segments = [],
  title = "Live route",
  subtitle = "From donor to destination",
  heightClass = "h-80",
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef([]);
  const [routeError, setRouteError] = useState("");

  const validMarkers = useMemo(
    () =>
      markers.filter(
        (marker) =>
          marker &&
          typeof marker.lat === "number" &&
          typeof marker.lng === "number"
      ),
    [markers]
  );

  useEffect(() => {
    if (!mapRef.current || !validMarkers.length) {
      return undefined;
    }

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;
    layersRef.current.forEach((layer) => map.removeLayer(layer));
    layersRef.current = [];

    validMarkers.forEach((marker) => {
      const leafletMarker = L.marker([marker.lat, marker.lng], {
        icon: createDivIcon(markerColors[marker.kind] || markerColors.default),
      })
        .addTo(map)
        .bindPopup(
          `<strong>${marker.label || "Location"}</strong><br/>${
            marker.description || ""
          }`
        );

      layersRef.current.push(leafletMarker);
    });

    const bounds = L.latLngBounds(validMarkers.map((marker) => [marker.lat, marker.lng]));
    map.fitBounds(bounds.pad(0.2));

    let isCancelled = false;

    const drawRoutes = async () => {
      setRouteError("");

      for (const segment of segments) {
        if (!segment?.from || !segment?.to) {
          continue;
        }

        let points = [
          [segment.from.lat, segment.from.lng],
          [segment.to.lat, segment.to.lng],
        ];

        try {
          const routedPoints = await getRouteGeometry(segment);
          if (routedPoints.length) {
            points = routedPoints;
          }
        } catch (error) {
          if (!isCancelled) {
            setRouteError("Showing a straight-line preview. Routed directions are temporarily unavailable.");
          }
        }

        if (isCancelled) {
          return;
        }

        const polyline = L.polyline(points, {
          color: segment.color || "#2f855a",
          weight: 5,
          opacity: 0.82,
          dashArray: segment.dashed ? "10 10" : undefined,
        }).addTo(map);

        layersRef.current.push(polyline);
      }
    };

    drawRoutes();

    return () => {
      isCancelled = true;
    };
  }, [validMarkers, segments]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  if (!validMarkers.length) {
    return (
      <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-emerald-950">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        <div className="mt-4 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-8 text-sm text-slate-500">
          Map will appear once donor and NGO locations are available.
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
      <div className="border-b border-emerald-100 px-5 py-4">
        <h3 className="text-lg font-semibold text-emerald-950">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        {routeError ? (
          <p className="mt-2 text-xs text-amber-700">{routeError}</p>
        ) : null}
      </div>
      <div ref={mapRef} className={`w-full ${heightClass}`} />
    </div>
  );
}
