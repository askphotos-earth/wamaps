//import leaflet styling explicitly to avoid errors
import "../node_modules/leaflet/dist/leaflet.css";

import "leaflet-easybutton";
import "leaflet-easyprint";
import { useTranslation } from "react-i18next";
import React, { useEffect, useState, useRef, useCallback } from "react";
import "./styles/map-etc.css";
import "./styles/image-viewer.css";
import "./styles/image-popup.css";
import { isMobileOrTablet } from "./main.js";

import L from "leaflet";

// Dynamically set #map height for mobile browsers to ensure controls are visible
function setMapHeight() {
    const mapEl = document.getElementById('map');
    if (mapEl) {
        mapEl.style.height = window.innerHeight + 'px';
    }
}

// Force Leaflet scale control positioning and height
function forceLeafletControlPositioning() {
    const leafletBottomLeft = document.querySelector('.leaflet-bottom.leaflet-left');
    const leafletBottomRight = document.querySelector('.leaflet-bottom.leaflet-right');

    if (leafletBottomLeft) {
        leafletBottomLeft.style.position = 'fixed';
        leafletBottomLeft.style.bottom = '-2px';
        leafletBottomLeft.style.left = '5px';
        leafletBottomLeft.style.height = '24px';
        // leafletBottomLeft.style.zIndex = '9999';
        leafletBottomLeft.style.pointerEvents = 'auto';
    }
    if (leafletBottomRight) {
        leafletBottomRight.style.position = 'fixed';
        leafletBottomRight.style.bottom = '-8px';
        leafletBottomRight.style.right = '5px';
        leafletBottomRight.style.height = '24px';
        // leafletBottomRight.style.zIndex = '9999';
        leafletBottomRight.style.pointerEvents = 'auto';
    }

    
    // const scaleControl = document.querySelector('.leaflet-control-scale');
    // if (scaleControl) {
    //     scaleControl.style.position = 'fixed';
    //     scaleControl.style.bottom = '80px';
    //     scaleControl.style.left = '10px';
    //     scaleControl.style.height = '24px';
    //     scaleControl.style.zIndex = '9999';
    //     scaleControl.style.pointerEvents = 'auto';
    // }
}

window.addEventListener('resize', () => {
    setMapHeight();
    forceLeafletControlPositioning();
});
window.addEventListener('orientationchange', () => {
    setMapHeight();
    forceLeafletControlPositioning();
});
document.addEventListener('DOMContentLoaded', () => {
    setMapHeight();
    // Delay to ensure Leaflet controls are rendered
    setTimeout(forceLeafletControlPositioning, 1000);
});

// Also force positioning after map loads
window.addEventListener('load', () => {
    setTimeout(forceLeafletControlPositioning, 2000);
});
import {
	MapContainer,
	TileLayer,
	Marker,
	Popup,
	CircleMarker,
	useMap,
	ScaleControl,
	AttributionControl,
} from "react-leaflet";

import { MapActionArea, ShareModal } from "./mapOverlays.js";
import { setGlobalProcessedChatFile } from "./import_whatsapp.js";
import * as JSZip from "jszip";
import {
	GPSPositionIcn,
	WhatAppMapMarkerPosition,
	WhatAppMapMarker,
	WhatAppMapper,
	WhatAppMapperPosition,
	nextIcn,
	editIcon,
	deleteIcon,
} from "./icons.js";
import { UploadDialog } from "./UploadDialog.jsx";
import SuccessModal from "./SuccessModal.jsx";
import { wamapperslocations } from "./wamapperslocations.js";
import WAMapsMarker from "./images/WAMapsMarker.png"; // Import the image

/************************************************************************************************
 *   Image Download Helper
 ************************************************************************************************/
// Open image in a new browser tab (no download)
const openImageInNewTab = async (imgElement) => {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = imgElement.naturalWidth || imgElement.width;
        canvas.height = imgElement.naturalHeight || imgElement.height;
        ctx.drawImage(imgElement, 0, 0);
        canvas.toBlob((blob) => {
            if (!blob) {
                const newWin = window.open(imgElement.src, '_blank');
                if (!newWin) window.location.href = imgElement.src;
                return;
            }
            const url = URL.createObjectURL(blob);
            const newWin = window.open(url, '_blank', 'noopener');
            if (!newWin) {
                // popup blocked: open in same tab
                window.location.href = url;
            }
            setTimeout(() => URL.revokeObjectURL(url), 10000);
        }, 'image/png');
    } catch (err) {
        console.error('Error opening image in new tab:', err);
        const newWin = window.open(imgElement.src, '_blank');
        if (!newWin) window.location.href = imgElement.src;
    }
};

// Download image as PNG (used by long-press/context menu)
const downloadImageAsPNG = async (imgElement, filename) => {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = imgElement.naturalWidth || imgElement.width;
        canvas.height = imgElement.naturalHeight || imgElement.height;
        ctx.drawImage(imgElement, 0, 0);
        canvas.toBlob((blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
            link.href = url;
            link.download = `${nameWithoutExt}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 10000);
        }, 'image/png');
    } catch (error) {
        console.error('Error downloading image as PNG:', error);
        // fallback to original src download
        const link = document.createElement('a');
        link.href = imgElement.src;
        const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
        link.download = `${nameWithoutExt}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

/************************************************************************************************
 *   Basemaps (TileLayers)
 ************************************************************************************************/

function OpenStreetMapTileLayer() {
	return (
		<TileLayer
			url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			minZoom={2}
			maxZoom={19}
			attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
		/>
	);
}

/************************************************************************************************
 * Display Data
 ***********************************************************************************************/
var markerOptions = {
	radius: 5,
	weight: 0,
	opacity: 1,
	fillOpacity: 0.8,
};

function getFriendlyDatetime(datetime) {
	// Convert the datetime string into a more readable form
	return datetime.split("T").join(" ").replaceAll("-", "/");
}
const getImageURLFromZip = async (zip, imgFilename) => {
	try {
		const file = zip.file(
			new RegExp(imgFilename.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + "$")
		);
		if (!file) {
			console.error(`File not found in ZIP: ${imgFilename}`);
			return null;
		}
		const blob = await file[0].async("blob");
		let urlCreator = window.URL || window.webkitURL;
		let url = urlCreator.createObjectURL(blob);
		return url;
	} catch (error) {
		console.error(`Error extracting file ${imgFilename}:`, error);
		return null;
	}
};



function MapDataLayer({ data, onUpdateFeature, onDeleteFeature, onUpdateImageLocation, onDeleteImageLocation, setMapData, updateGlobalDataFile, onMapRenderComplete }) {
	const { t } = useTranslation();
	const map = useMap();
	const boundsRef = useRef([]);
	const hasInitiallyFitBounds = useRef(false); // Track if we've already fit bounds initially
	const { data: geoJSON, imgZip } = data;
	const [featureImages, setFeatureImages] = useState({}); // this is basically a cache
	const [editingFeature, setEditingFeature] = useState(null);
	const [editObservation, setEditObservation] = useState("");
	const [editingLocation, setEditingLocation] = useState(null);
	const [editLocationDescription, setEditLocationDescription] = useState("");
    // Define a custom GPS icon
    const WhatsAppMarkerIcon = L.divIcon({
		html: WhatAppMapMarkerPosition, // 
		className: "whatsapp-marker-icon",
		iconSize: [30, 30], // Adjust size as needed
		iconAnchor: [15, 30], // Anchor point for the icon
	});
	
	// Check if it's the old WhatsApp format with features array or new format with locations object
	const isOldFormat = geoJSON.hasOwnProperty('features');
	const isNewImageFormat = !isOldFormat && geoJSON.hasOwnProperty('locations');
	
	// Clear bounds array at the start of each render to avoid accumulation
	boundsRef.current = [];
	
	useEffect(() => {
		// Call the render complete callback when map is ready
		if (onMapRenderComplete) {
			// Small delay to ensure bounds fitting and markers are fully rendered
			setTimeout(() => {
				onMapRenderComplete();
			}, 300);
		}
	}, [onMapRenderComplete]);

	useEffect(() => {
		// fit map to bounds only on initial load, not when data changes due to edits/deletes
		if (boundsRef.current.length > 0 && !hasInitiallyFitBounds.current) {
			setTimeout(() => {
				map.fitBounds(boundsRef.current);
				hasInitiallyFitBounds.current = true;
			}, 100); // Small delay to ensure markers are rendered
		}
	});

	const handleMarkerClick = useCallback(
		async (feature) => {
			// Handle WhatsApp style image zip
			if (imgZip && feature.properties?.imgFilenames?.length > 0) {
				// will want to map over imgFilenames when we support multiple
				feature.properties.imgFilenames.map(async (filename) =>
					// check the image isn't already loaded
					{
						if (filename && !featureImages[filename]) {
							const url = await getImageURLFromZip(imgZip, filename);
							setFeatureImages((prev) => ({
								...prev,
								[filename]: url,
							}));
						}
					}
				);
			}
		},
		[imgZip, featureImages]
	);
	
	// If it's the old format with no features
	if (isOldFormat && geoJSON.features.length === 0) {
		// need translation
		return <ErrorPopup
  error={
    <>
      <span style={{ fontSize: "1rem", align: "center" }}>
        No data to display or parsing error. {" "}
      </span>
      <a
        href="https://form.typeform.com/to/jnnU3B1I"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-block",
		  marginTop: "1rem",
		  align: "center",
          marginLeft: "0.5rem",
          padding: "0.4rem 0.75rem",
          backgroundColor: "white",
          color: "black",
          border: "black 1px solid",
          borderRadius: "8px",
          textDecoration: "none",
          fontWeight: "bold",
          fontSize: "1rem",
		  fontFamily: "Ubuntu, sans-serif",
          cursor: "pointer"
        }}
      >
        Contact us
      </a>
    </>
  }
/>

	}

	// Handle edit observation
	const handleEditObservation = (feature, newObservation) => {
		if (!data?.data?.features) return;
        
        const updatedData = { ...data };
        const featureIndex = updatedData.data.features.findIndex(f => 
            f.geometry.coordinates[0] === feature.geometry.coordinates[0] &&
            f.geometry.coordinates[1] === feature.geometry.coordinates[1] &&
            f.properties.datetime === feature.properties.datetime
        );
        
        if (featureIndex !== -1) {
            updatedData.data.features[featureIndex].properties.observations = newObservation;
            setMapData(updatedData);
            updateGlobalDataFile(updatedData);
        }
        
		setEditingFeature(null);
		setEditObservation("");
	};

	// Handle delete feature
	const handleDeleteFeature = (feature) => {
		if (window.confirm("Are you sure you want to delete this point?")) {
			if (!data?.data?.features) return;
        
            const updatedData = { ...data };
            updatedData.data.features = updatedData.data.features.filter(f => 
                !(f.geometry.coordinates[0] === feature.geometry.coordinates[0] &&
                  f.geometry.coordinates[1] === feature.geometry.coordinates[1] &&
                  f.properties.datetime === feature.properties.datetime)
            );
            setMapData(updatedData);
            updateGlobalDataFile(updatedData);
		}
	};

	// Handle edit image location description
	const handleEditLocationDescription = (locationId, newDescription) => {
		if (onUpdateImageLocation) {
			onUpdateImageLocation(locationId, { description: newDescription, address: newDescription });
		}
		setEditingLocation(null);
		setEditLocationDescription("");
	};

	// Handle delete image location
	const handleDeleteImageLocation = (locationId) => {
		if (window.confirm("Are you sure you want to delete this point?")) {
			if (onDeleteImageLocation) {
				onDeleteImageLocation(locationId);
			}
		}
	};

	// If it's the new image format with locations object
	if (isNewImageFormat) {
		return (
			<>
				{Object.values(geoJSON.locations).map((location, index) => {
					const latlng = { lat: location.latitude, lng: location.longitude };
					boundsRef.current.push([latlng.lat, latlng.lng]);
					
					return (
						<Marker
							key={index}
							position={latlng}
							icon={WhatsAppMarkerIcon}
						>
							<Popup offset={L.point(2, -15)} maxWidth={300} maxHeight={400}>
								<div className="map-popup-body">
									{location.imageUrl && (
										<div className="feature-images">
											<img
												src={location.imageUrl}
												alt="Geotagged image"
												style={{ display: "block", maxWidth: "100%" }}
                                                // onClick={(e) => {
                                                //     e.stopPropagation();
                                                //     openImageInNewTab(e.target);
                                                // }}
                                                onContextMenu={async (e) => {
													// Handle right-click to ensure PNG download
													e.preventDefault();
													await downloadImageAsPNG(e.target, location.name || 'image');
												}}
												onTouchStart={(e) => {
													// Handle long press on mobile devices
													const img = e.target;
													const longPressTimeout = setTimeout(() => {
														downloadImageAsPNG(img, location.name || 'image');
													}, 800); // 800ms long press
													
													img.dataset.longPressTimeout = longPressTimeout;
												}}
												onTouchEnd={(e) => {
													// Clear long press timeout
													const timeoutId = e.target.dataset.longPressTimeout;
													if (timeoutId) {
														clearTimeout(timeoutId);
														delete e.target.dataset.longPressTimeout;
													}
												}}
												onTouchMove={(e) => {
													// Cancel long press if user moves finger
													const timeoutId = e.target.dataset.longPressTimeout;
													if (timeoutId) {
														clearTimeout(timeoutId);
														delete e.target.dataset.longPressTimeout;
													}
												}}
											/>
										</div>
									)}
									{/* Editable description section */}
									{editingLocation === location.id ? (
										<div className="popup-observation-container">
											<textarea
												value={editLocationDescription}
												onChange={(e) => setEditLocationDescription(e.target.value)}
												className="popup-edit-textarea"
												autoFocus
											/>
											<div className="popup-edit-actions">
												<button
													onClick={(e) => {
														e.stopPropagation();
														handleEditLocationDescription(location.id, editLocationDescription);
													}}
													className="popup-save-btn"
												>
													Save
												</button>
												<button
													onClick={(e) => {
														e.stopPropagation();
														setEditingLocation(null);
														setEditLocationDescription("");
													}}
													className="popup-cancel-btn"
												>
													Cancel
												</button>
											</div>
										</div>
									) : (
										<div className="popup-observation-container">
											<div className="popup-observation-display">
												<div className="popup-observation-text">
													<p>{location.description || location.address || "Geotagged image location"}</p>
												</div>
												<div className="popup-edit-button-container">
													<button
														onClick={() => {
															setEditingLocation(location.id);
															setEditLocationDescription(location.description || location.address || "");
														}}
														className="popup-edit-btn"
														title="Edit description"
													>
														{editIcon}
													</button>
												</div>
											</div>
										</div>
									)}
								</div>
								<div className="map-popup-footer">
									{t("date")}: {location.timestamp ? new Date(location.timestamp).toLocaleString() : "-"}
									<br />
									{t("observer")}: {geoJSON.people[location.sender]?.name || "Unknown"}
									<br />
									<strong>Coordinates:</strong><br />
									lat {latlng.lat.toFixed(6)}<br />
									lng {latlng.lng.toFixed(6)}
									<br />
									<strong>Direction:</strong> {location.gpsImgDirection ? `${location.gpsImgDirection}°` : "not recorded"}
									{/* Delete button at bottom */}
									<div className="popup-bottom-delete-container">
										<button
											onClick={(e) => {
												e.stopPropagation();
												handleDeleteImageLocation(location.id);
											}}
											className="popup-bottom-delete-btn"
											title="Delete this point"
										>
											Delete
										</button>
									</div>
								</div>
							</Popup>
						</Marker>
					);
				})}
			</>
		);
	}

	// Handle old WhatsApp format
	return (
		<>
			{geoJSON.features.map((feature, index) => {
				if (feature.geometry?.coordinates) {
					const { coordinates } = feature.geometry;
					const latlng = { lat: coordinates[1], lng: coordinates[0] };

					const observations = feature.properties.observations
						.replace(/remove_this_msg/g, "")
						.replace(/<br\s*\/?>/gi, "\n");
					boundsRef.current.push([latlng.lat, latlng.lng]);

					const markerColour = feature.properties.markerColour
						? feature.properties.markerColour
						: "red";

					const imgFilenames = feature.properties.imgFilenames;
					return (
			
							<Marker
								key={index}
								position={latlng}
								icon={WhatsAppMarkerIcon}
								eventHandlers={{
									click: () => handleMarkerClick(feature),
								}}
							>
								<Popup offset={L.point(2, -15)} maxWidth={250} maxHeight={400}>
								<div className="map-popup-body">
									{imgFilenames && imgFilenames.length > 0 && (
										<div
											className="feature-images"
											onClick={(e) => {
												e.stopPropagation();
												const images = document.querySelectorAll(
													".feature-images img"
												);
												const currentIndex = [...images].findIndex(
													(img) => img.style.display === "block"
												);
												for (let i = 0; i < images.length; i++) {
													images[i].style.display = "none"; // Hide all images
												}
												const nextIndex = (currentIndex + 1) % images.length; // Loop back to the first image
												images[nextIndex].style.display = "block"; // Show the next image
											}}
										>
											{imgFilenames.map(
												(filename, index) =>
													featureImages[filename] && (
														<img
															key={index}
															src={featureImages[filename]}
															alt={`Feature image ${index + 1}`}
															style={{
																display: index > 0 ? "none" : "block",
															}}
															onContextMenu={async (e) => {
																// Handle right-click to ensure PNG download
																e.preventDefault();
																await downloadImageAsPNG(e.target, filename);
															}}
                                                        // onClick={(e) => {
                                                        //     e.stopPropagation();
                                                        //     openImageInNewTab(e.target);
                                                        // }}
                                                        onTouchStart={(e) => {
																// Handle long press on mobile devices
																const img = e.target;
																const longPressTimeout = setTimeout(() => {
																	downloadImageAsPNG(img, filename);
																}, 800); // 800ms long press
																
																img.dataset.longPressTimeout = longPressTimeout;
															}}
															onTouchEnd={(e) => {
																// Clear long press timeout
																const timeoutId = e.target.dataset.longPressTimeout;
																if (timeoutId) {
																	clearTimeout(timeoutId);
																	delete e.target.dataset.longPressTimeout;
																}
															}}
															onTouchMove={(e) => {
																// Cancel long press if user moves finger
																const timeoutId = e.target.dataset.longPressTimeout;
																if (timeoutId) {
																	clearTimeout(timeoutId);
																	delete e.target.dataset.longPressTimeout;
																}
															}}
														/>
													)
											)}
											{imgFilenames.length > 1 && (
												<div className="next-image">{nextIcn}</div>
											)}
										</div>
									)}
									{/* Editable observations section */}
									{editingFeature === feature ? (
										<div className="popup-observation-container">
											<textarea
												value={editObservation}
												onChange={(e) => setEditObservation(e.target.value)}
												className="popup-edit-textarea"
												autoFocus
											/>
											<div className="popup-edit-actions">
												<button
													onClick={(e) => {
														e.stopPropagation();
														handleEditObservation(feature, editObservation);
													}}
													className="popup-save-btn"
												>
													Save
												</button>
												<button
													onClick={(e) => {
														e.stopPropagation();
														setEditingFeature(null);
														setEditObservation("");
													}}
													className="popup-cancel-btn"
												>
													Cancel
												</button>
											</div>
										</div>
									) : (
										<div className="popup-observation-container">
											<div className="popup-observation-display">
												<div className="popup-observation-text">
													{observations.split("\n").map((o, index) => (
														<p key={index}>{o}</p>
													))}
												</div>
												<div className="popup-edit-button-container">
													<button
														onClick={(e) => {
															e.stopPropagation();
															setEditingFeature(feature);
															setEditObservation(observations);
														}}
														className="popup-edit-btn"
														title="Edit observation"
													>
														{editIcon}
													</button>
												</div>
											</div>
										</div>
									)}
								</div>
								<div className="map-popup-footer">
									{t("date")}:{" "}
									{getFriendlyDatetime(feature.properties.datetime)}
									<br />
									{t("observer")}: {feature.properties.observer}
									<br />
									<strong>Coordinates:</strong><br />
									lat {latlng.lat}<br />
									lng {latlng.lng}
									<br />
									<strong>Direction:</strong> {feature.properties.gpsImgDirection ? `${feature.properties.gpsImgDirection}°` : "not recorded"}
									{/* Delete button at bottom */}
									<div className="popup-bottom-delete-container">
										<button
											onClick={(e) => {
												e.stopPropagation();
												handleDeleteFeature(feature);
											}}
											className="popup-bottom-delete-btn"
											title="Delete this point"
										>
											Delete
										</button>
									</div>
								</div>
							</Popup>
							</Marker>
						);
						

				}
			})}
		</>
	);
}

/************************************************************************************************
 *  Location of WhatsApp Mappers
 ************************************************************************************************/

function WhatsAppMappersDataLayer({ data }) {
	const { t } = useTranslation();
	const map = useMap();
	const boundsRef = useRef([]);
	// const { data: geoJSON, imgZip } = data;
	const [featureImages, setFeatureImages] = useState({}); // this is basically a cache
	const geoJSON = wamapperslocations;

    const WhatsAppMapperIcon = L.divIcon({
		html: WhatAppMapperPosition, // Use the imported GPS icon
		className: "whatsapp-mapper-icon",
		iconSize: [20, 20], // Adjust size as needed
		iconAnchor: [10, 20], // Anchor point for the icon
	});
	if (geoJSON.features.length == 0) {
		// need translation
		return <ErrorPopup error="No data to display" />;
	}

	useEffect(() => {
		// fit map to bounds
		if (boundsRef.current.length > 0) {
			map.fitBounds(boundsRef.current);
		}
	}, [geoJSON, map]);

	// const handleMarkerClick = useCallback(
	// 	async (feature) => {
	// 		if (imgZip && feature.properties.imgFilenames.length > 0) {
	// 			// will want to map over imgFilenames when we support multiple
	// 			feature.properties.imgFilenames.map(async (filename) =>
	// 				// check the image isn't already loaded
	// 				{
	// 					if (filename && !featureImages[filename]) {
	// 						const url = await getImageURLFromZip(imgZip, filename);
	// 						setFeatureImages((prev) => ({
	// 							...prev,
	// 							[filename]: url,
	// 						}));
	// 					}
	// 				}
	// 			);
	// 		}
	// 	},
	// 	[imgZip, featureImages]
	// );

	return (
		<>
  {wamapperslocations.features.map((feature, i) => {
    const latlng = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];
    const { name, Description, wamapsMaID} = feature.properties; 
    const whatsappUrl = `https://form.typeform.com/to/ADusU7Tj`;

    return (
      <Marker key={i} position={latlng} icon={WhatsAppMapperIcon}>
        <Popup offset={L.point(2, -15)} maxWidth={200} maxHeight={400}>
            <h3>{name}</h3>
            <p>Get in touch and we will connect you with {wamapsMaID}</p>
            <button
        className="btn"
        style={{
            display: "inline-block",
            marginTop: "0.5rem",
            padding: "0.5rem 1rem",
            backgroundColor: "#25D365",
            color: "white",
            borderRadius: "5px",
            fontWeight: "bold",
            textDecoration: "none",
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
        }}
        onClick={() => {
            navigator.clipboard.writeText(wamapsMaID).then(() => {
            alert("The WAMaps Business Mapper ID has been copied to clipboard! Click OK and paste it when the form opens.");
            window.open(whatsappUrl, "_blank", "noopener,noreferrer");
            });
        }}
        >
        Contact us
        </button>
        </Popup>
      </Marker>
    );
  })}
</>

	);
}

/************************************************************************************************
 *  Error Popup
 ************************************************************************************************/
function ErrorPopup({ error }) {
	const map = useMap();
	// Adjust the map view to a central location (e.g., coordinates [0, 0])
	useEffect(() => {
		if (error) {
			map.setView([0, 0], map.getZoom(), { animate: true }); // Center the map
		}
	}, [error, map]);

	return error ? (
		<Popup offset={L.point(0, -15)}
			maxWidth={200} maxHeight={400}
			position={[2, 0]} // Position within the map (centered in this case)
			autoPan={true}
			autoClose={false}
		>
			<div>
				<h2 className="error-popup">{error}</h2>
			</div>
		</Popup>
	) : null;
}

/************************************************************************************************
 *  Map
 ************************************************************************************************/

var southWest = L.latLng(-70, -180);
var northEast = L.latLng(80, 180);
// console.log("ismobileortrable",isMobileOrTablet())
if (!isMobileOrTablet()) {
      var zoomOnload = 3; //to avoid multiple global maps displayed     
    }else{
	  var zoomOnload = 3; 
	}
const mapConfig = {
	center: [0, 0],
	zoom: zoomOnload,
	minZoom: 2,
	maxZoom: 21,
	zoomControl: false,
	attributionControl: false,
	style: { height: "100vh", width: "100%" },
	maxBounds: L.latLngBounds(southWest, northEast),
	preferCanvas: true,
};
const currentPositionIcon = L.divIcon({
	html: GPSPositionIcn,
	className: "position-marker-icon",
	iconSize: [30, 30],
	iconAnchor: [15, 15],
});

function UpdateMap({ currentLocation, flyToLocation, setFlyToLocation }) {
	// this is a functional component, it doesn't render anything
	// hook to fly to current location when updated
	const map = useMap();
	useEffect(() => {
		if (currentLocation && flyToLocation) {
			map.flyTo(currentLocation, map.getZoom());
			setFlyToLocation(false);
		}
	}, [currentLocation, flyToLocation]);

	return null;
}

/************************************************************************************************
 *  Max Zoom Controller for WaMappers Layer
 ************************************************************************************************/

function MaxZoomController({ showWaMappers, setShowWaMappers }) {
    const map = useMap();
    const showRef = useRef(showWaMappers);
    const suppressedRef = useRef(false); // tracks whether we auto-hid the layer due to zoom

    // keep ref in sync with prop
    useEffect(() => {
        showRef.current = showWaMappers;
    }, [showWaMappers]);

    useEffect(() => {
        if (!map || typeof setShowWaMappers !== 'function') return;

        const handleZoom = () => {
            const currentZoom = map.getZoom();

            if (currentZoom > 12) {
                // if the layer is currently visible, hide it and mark suppressed
                if (showRef.current) {
                    suppressedRef.current = true;
                    setShowWaMappers(false);
                }
            } else {
                // zoom <= 12: if we previously auto-hid the layer, restore it
                if (suppressedRef.current) {
                    suppressedRef.current = false;
                    setShowWaMappers(true);
                }
            }
        };

        map.on('zoomend', handleZoom);
        // run once to ensure correct initial state
        handleZoom();

        return () => {
            map.off('zoomend', handleZoom);
        };
    }, [map, setShowWaMappers]);

    return null; // This component doesn't render anything
}

export function Map({
    isVisible,
    data,
    isLoginVisible,
    setIsLoginVisible,
    setMapData, // Add this to update the data
    setFileToParse, // Add this for drag and drop functionality
    setImagesToParse, // Add this for drag and drop functionality
    showMap, // Add this for drag and drop functionality
    onMapRenderComplete, // New callback for when map rendering is complete
}) {
    if (!isVisible) return null;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [successModalVisible, setSuccessModalVisible] = useState(false);

    const [titleValue, setTitleValue] = useState("");
    const [shouldPulse, setShouldPulse] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [flyToLocation, setFlyToLocation] = useState(false);
    const [error, setError] = useState(null);
    const [showWaMappers, setShowWaMappers] = useState(false);

    // State to track the active tile layer

    // Drag and drop state
    const [isDragOver, setIsDragOver] = useState(false);

    // Function to handle max zoom when connecting to WaMappers
    const maxZoomConnect = useCallback(() => {
        // This function will be called from MapActionArea when connecting
        // The actual zoom limiting is handled by MaxZoomController component
        // console.log("MaxZoom connect function called - zoom limiting to 10");
    }, []);

    // Wrapper function to calculate size before parsing
    const setFileToParseWithSizeCalc = async (file) => {
        if (file && file.name.endsWith('.zip')) {
            // Calculate and store image size information immediately
            if (window.calculateAndStoreImageSize) {
                await window.calculateAndStoreImageSize(file);
            }
        }
        setFileToParse(file);
    };

    // Prevent default drag behavior on the document
    useEffect(() => {
        const preventDefaults = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };

        // Add event listeners to prevent default drag behavior
        document.addEventListener('dragenter', preventDefaults);
        document.addEventListener('dragover', preventDefaults);
        document.addEventListener('dragleave', preventDefaults);
        document.addEventListener('drop', preventDefaults);

        return () => {
            // Cleanup event listeners
            document.removeEventListener('dragenter', preventDefaults);
            document.removeEventListener('dragover', preventDefaults);
            document.removeEventListener('dragleave', preventDefaults);
            document.removeEventListener('drop', preventDefaults);
        };
    }, []);

    // Handle feature updates (for editing observations)
    const handleUpdateFeature = (feature, updates) => {
        if (!data?.data?.features) return;
        
        const updatedData = { ...data };
        const featureIndex = updatedData.data.features.findIndex(f => 
            f.geometry.coordinates[0] === feature.geometry.coordinates[0] &&
            f.geometry.coordinates[1] === feature.geometry.coordinates[1] &&
            f.properties.datetime === feature.properties.datetime
        );
        
        if (featureIndex !== -1) {
            updatedData.data.features[featureIndex].properties = {
                ...updatedData.data.features[featureIndex].properties,
                ...updates
            };
            setMapData(updatedData);
            updateGlobalDataFile(updatedData);
        }
    };

    // Handle feature deletion
    const handleDeleteFeature = (feature) => {
        if (!data?.data?.features) return;
        
        const updatedData = { ...data };
        updatedData.data.features = updatedData.data.features.filter(f => 
            !(f.geometry.coordinates[0] === feature.geometry.coordinates[0] &&
              f.geometry.coordinates[1] === feature.geometry.coordinates[1] &&
              f.properties.datetime === feature.properties.datetime)
        );
        setMapData(updatedData);
        updateGlobalDataFile(updatedData);
    };

    // Handle image location updates (for new format)
    const handleUpdateImageLocation = (locationId, updates) => {
        if (!data?.data?.locations) return;
        
        const updatedData = { ...data };
        if (updatedData.data.locations[locationId]) {
            updatedData.data.locations[locationId] = {
                ...updatedData.data.locations[locationId],
                ...updates
            };
            setMapData(updatedData);
            updateGlobalDataFile(updatedData);
        }
    };

    // Handle image location deletion (for new format)
    const handleDeleteImageLocation = (locationId) => {
        if (!data?.data?.locations) return;
        
        const updatedData = { ...data };
        delete updatedData.data.locations[locationId];
        setMapData(updatedData);
        updateGlobalDataFile(updatedData);
    };

    // Function to update the global data file with changes
    const updateGlobalDataFile = async (updatedData) => {
        try {
            if (data?.imgZip) {
                // Re-create the zip file with updated data
                const zip = new JSZip();
                
                // Check if it's the new image format or old WhatsApp format
                if (updatedData.data.features) {
                    // For WhatsApp format, save as standard GeoJSON FeatureCollection
                    const geoJSONData = {
                        type: "FeatureCollection",
                        features: updatedData.data.features
                    };
                    const updatedGeoJSON = JSON.stringify(geoJSONData, null, 2);
                    zip.file("map.geojson", updatedGeoJSON);
                } else if (updatedData.data.locations) {
                    // For image format, convert locations to GeoJSON FeatureCollection format
                    const features = Object.values(updatedData.data.locations).map(location => ({
                        type: "Feature",
                        properties: {
                            contributionid: location.batch || location.id,
                            mainattribute: "Geotagged Images",
                            name: location.name,
                            datetime: location.timestamp,
                            observer: updatedData.data.people[location.senderId]?.name || "Unknown",
                            observations: location.description || location.address || "Add description/tag",
                            // markerColour: "0",
                            imgFilenames: [location.name],
                            altitude: location.altitude?.toString() || "0",
                            gpsImgDirection: location.gpsImgDirection?.toString() || "not recorded"
                        },
                        geometry: {
                            type: "Point",
                            coordinates: [location.longitude, location.latitude]
                        }
                    }));
                    
                    const geoJSONData = {
                        type: "FeatureCollection",
                        features: features
                    };
                    const updatedGeoJSON = JSON.stringify(geoJSONData, null, 2);
                    zip.file("map.geojson", updatedGeoJSON);
                }
                
                // Add existing files from the original zip (except the data file we just updated)
                try {
                    let originalZip;
                    if (data.imgZip instanceof File || data.imgZip instanceof Blob) {
                        originalZip = await JSZip.loadAsync(data.imgZip);
                    } else if (typeof data.imgZip === 'string') {
                        // Handle base64 string
                        originalZip = await JSZip.loadAsync(data.imgZip, {base64: true});
                    } else {
                        // Assume it's already ArrayBuffer or similar
                        originalZip = await JSZip.loadAsync(data.imgZip);
                    }
                    
                    const promises = [];
                    originalZip.forEach((relativePath, file) => {
                        if (relativePath !== "map.geojson" && relativePath !== "data.json") {
                            promises.push(
                                file.async("blob").then(blob => {
                                    zip.file(relativePath, blob);
                                })
                            );
                        }
                    });
                    
                    // Wait for all files to be added
                    await Promise.all(promises);
                } catch (zipError) {
                    console.warn("Could not load original zip, creating new one with just the data file:", zipError);
                }
                
                // Generate the updated zip file
                const updatedZipBlob = await zip.generateAsync({ type: "blob" });
                const updatedFile = new File([updatedZipBlob], "updated_map.zip", { type: "application/zip" });
                
                // Update the global file
                setGlobalProcessedChatFile(updatedFile);
                
                // Calculate and store image size information immediately
                if (window.calculateAndStoreImageSize) {
                    await window.calculateAndStoreImageSize(updatedFile);
                }
            }
        } catch (error) {
            console.error("Error updating global data file:", error);
        }
    };
	useEffect(() => {
		setTimeout(forceLeafletControlPositioning, 500);
	}, []);
	
    // pulse effect on title update
    useEffect(() => {
        if (shouldPulse) {
            const timer = setTimeout(() => {
                setShouldPulse(false);
            }, 6000);
            return () => clearTimeout(timer); // Cleanup to avoid memory leaks
        }
    }, [shouldPulse]);

    const getCurrentPosition = () => {
        currentLocation && setFlyToLocation(true);
        const options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
        };
        const success = (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setCurrentLocation([lat, lng]);
            setFlyToLocation(true);
        };
        const error = (err) => {
            console.warn(`ERROR(${err.code}): ${err.message}`);
            setError(
                "Unable to retrieve location. Please check your device settings."
            );
        };
        // call the above if the browser supports it
        navigator.geolocation
            ? navigator.geolocation.getCurrentPosition(success, error, options)
            : console.error("GPS not available");
    };

    // Drag and drop handlers
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    // Function to merge multiple zip files
    const mergeMultipleZipFiles = async (zipFiles, existingData = null) => {
        try {
            console.log(`Starting merge process for ${zipFiles.length} zip files...`);
            console.log("Existing data passed to merge:", existingData ? "YES" : "NO");
            if (existingData) {
                console.log("Existing data structure:", {
                    hasDataProperty: !!existingData.data,
                    hasImgZip: !!existingData.imgZip,
                    dataType: existingData.data ? (existingData.data.features ? 'features' : existingData.data.locations ? 'locations' : 'unknown') : 'none'
                });
            }
            
            const mergedZip = new JSZip();
            const allFeatures = [];
            let imageCounter = 0;
            
            // Add existing data features if available
            if (existingData?.data?.features && Array.isArray(existingData.data.features)) {
                console.log(`Adding ${existingData.data.features.length} existing features to merge`);
                allFeatures.push(...existingData.data.features);
            } else if (existingData?.data?.locations) {
                console.log(`Converting ${Object.keys(existingData.data.locations).length} existing locations to features`);
                // Convert existing image format locations to features
                Object.values(existingData.data.locations).forEach(location => {
                    const observer = (existingData.data.people && existingData.data.people[location.senderId]) 
                        ? existingData.data.people[location.senderId].name 
                        : "Unknown";
                    
                    allFeatures.push({
                        type: "Feature",
                        properties: {
                            contributionid: location.batch || location.id,
                            mainattribute: "Geotagged Images",
                            name: location.name,
                            datetime: location.timestamp,
                            observer: observer,
                            observations: location.description || location.address || "Add description/tag",
                            // markerColour: "0",
                            imgFilenames: [location.name],
                            altitude: (location.altitude && location.altitude.toString) ? location.altitude.toString() : "0",
                            gpsImgDirection: location.gpsImgDirection?.toString() || "not recorded"
                        },
                        geometry: {
                            type: "Point",
                            coordinates: [location.longitude, location.latitude]
                        }
                    });
                });
            }
            
            // Add existing images to the merged zip if there's an existing imgZip
            if (existingData?.imgZip) {
                try {
                    console.log("Adding existing images to merged zip...");
                    console.log("Existing imgZip type:", typeof existingData.imgZip);
                    console.log("Existing imgZip constructor:", existingData.imgZip.constructor.name);
                    console.log("Is File:", existingData.imgZip instanceof File);
                    console.log("Is Blob:", existingData.imgZip instanceof Blob);
                    
                    let existingZip;
                    if (existingData.imgZip instanceof File || existingData.imgZip instanceof Blob) {
                        console.log("Loading as File/Blob");
                        existingZip = await JSZip.loadAsync(existingData.imgZip);
                    } else if (typeof existingData.imgZip === 'string') {
                        console.log("Loading as base64 string");
                        existingZip = await JSZip.loadAsync(existingData.imgZip, {base64: true});
                    } else if (existingData.imgZip instanceof ArrayBuffer) {
                        console.log("Loading as ArrayBuffer");
                        existingZip = await JSZip.loadAsync(existingData.imgZip);
                    } else if (existingData.imgZip && typeof existingData.imgZip === 'object' && existingData.imgZip.files) {
                        console.log("Already a JSZip object");
                        existingZip = existingData.imgZip;
                    } else {
                        console.log("Attempting to load as raw data");
                        existingZip = await JSZip.loadAsync(existingData.imgZip);
                    }
                    
                    // Count existing files first for debugging
                    let existingFileCount = 0;
                    existingZip.forEach((relativePath, file) => {
                        if (relativePath !== "map.geojson" && relativePath !== "data.json" && !file.dir) {
                            existingFileCount++;
                        }
                    });
                    console.log(`Found ${existingFileCount} existing image files to copy`);
                    
                    // Copy existing images with consistent naming (except data files)
                    const existingImagePromises = [];
                    const existingFilenameMapping = new window.Map();
                    
                    existingZip.forEach((relativePath, file) => {
                        if (relativePath !== "map.geojson" && relativePath !== "data.json" && !file.dir) {
                            // Use consistent naming scheme for existing images too
                            const pathParts = relativePath.split('.');
                            const fileExtension = pathParts.length > 1 ? pathParts.pop() : '';
                            const baseName = pathParts.join('.');
                            const uniqueName = fileExtension 
                                ? `${baseName}_existing_${imageCounter++}.${fileExtension}`
                                : `${baseName}_existing_${imageCounter++}`;
                            
                            // Store the mapping for filename updates
                            existingFilenameMapping.set(relativePath, uniqueName);
                            
                            existingImagePromises.push(
                                file.async("blob").then(blob => {
                                    mergedZip.file(uniqueName, blob);
                                    console.log(`Added existing image: ${uniqueName}`);
                                    return uniqueName;
                                }).catch(error => {
                                    console.error(`Error copying existing file ${relativePath}:`, error);
                                    return null;
                                })
                            );
                        }
                    });
                    
                    await Promise.all(existingImagePromises);
                    console.log(`Successfully processed ${existingImagePromises.length} existing images`);
                    
                    // Update filename references in existing features
                    let updatedFeatureCount = 0;
                    allFeatures.forEach(feature => {
                        if (feature.properties && feature.properties.imgFilenames && Array.isArray(feature.properties.imgFilenames)) {
                            const originalFilenames = [...feature.properties.imgFilenames];
                            feature.properties.imgFilenames = feature.properties.imgFilenames.map(filename => {
                                const mappedName = existingFilenameMapping.get(filename);
                                if (mappedName) {
                                    updatedFeatureCount++;
                                    console.log(`Updated feature image reference: ${filename} -> ${mappedName}`);
                                }
                                return mappedName || filename;
                            });
                        }
                    });
                    console.log(`Updated ${updatedFeatureCount} feature image references for existing images`);
                    
                } catch (existingZipError) {
                    console.warn("Could not load existing images:", existingZipError);
                }
            }
            
            for (let i = 0; i < zipFiles.length; i++) {
                try {
                    const zipFile = zipFiles[i];
                    console.log(`Processing zip file ${i + 1}: ${zipFile.name}`);
                    
                    const zip = await JSZip.loadAsync(zipFile);
                    console.log(`Loaded zip ${i + 1} successfully`);
                    
                    // Look for GeoJSON data file
                    const geoJsonFile = zip.file("map.geojson") || zip.file("data.json");
                    if (geoJsonFile) {
                        try {
                            const geoJsonContent = await geoJsonFile.async("string");
                            const geoData = JSON.parse(geoJsonContent);
                            console.log(`Parsed GeoJSON from zip ${i + 1}:`, geoData.type);
                            
                            // Add features to the merged collection
                            if (geoData.features && Array.isArray(geoData.features)) {
                                console.log(`Adding ${geoData.features.length} features from zip ${i + 1}`);
                                allFeatures.push(...geoData.features);
                            } else if (geoData.locations) {
                                console.log(`Converting ${Object.keys(geoData.locations).length} locations from zip ${i + 1}`);
                                // Handle new image format - convert to features
                                Object.values(geoData.locations).forEach(location => {
                                    const observer = (geoData.people && geoData.people[location.senderId]) 
                                        ? geoData.people[location.senderId].name 
                                        : "Unknown";
                                    
                                    allFeatures.push({
                                        type: "Feature",
                                        properties: {
                                            contributionid: location.batch || location.id,
                                            mainattribute: "Geotagged Images",
                                            name: location.name,
                                            datetime: location.timestamp,
                                            observer: observer,
                                            observations: location.description || location.address || "Add description/tag",
                                            // markerColour: "0",
                                            imgFilenames: [location.name],
                                            altitude: (location.altitude && location.altitude.toString) ? location.altitude.toString() : "0",
                                            gpsImgDirection: location.gpsImgDirection?.toString() || "not recorded"
                                        },
                                        geometry: {
                                            type: "Point",
                                            coordinates: [location.longitude, location.latitude]
                                        }
                                    });
                                });
                            }
                        } catch (parseError) {
                            console.error(`Error parsing GeoJSON from zip ${i + 1}:`, parseError);
                            // Continue with other zips even if one fails to parse
                        }
                    } else {
                        console.warn(`No GeoJSON data found in zip ${i + 1}`);
                    }
                    
                    // Copy all image files with unique names - collect promises first
                    const imagePromises = [];
                    const filenameMapping = new window.Map();
                    
                    zip.forEach((relativePath, file) => {
                        if (relativePath !== "map.geojson" && relativePath !== "data.json" && !file.dir) {
                            try {
                                // Add prefix to avoid filename conflicts
                                const pathParts = relativePath.split('.');
                                const fileExtension = pathParts.length > 1 ? pathParts.pop() : '';
                                const baseName = pathParts.join('.');
                                const uniqueName = fileExtension 
                                    ? `${baseName}_${i}_${imageCounter++}.${fileExtension}`
                                    : `${baseName}_${i}_${imageCounter++}`;
                                
                                // Store the mapping for later filename updates
                                filenameMapping.set(relativePath, uniqueName);
                                
                                // Create promise to copy the file
                                const imagePromise = file.async("blob").then(blob => {
                                    mergedZip.file(uniqueName, blob);
                                    console.log(`Added image: ${uniqueName} from zip ${i + 1}`);
                                    return uniqueName;
                                }).catch(error => {
                                    console.error(`Error copying file ${relativePath} from zip ${i + 1}:`, error);
                                    return null;
                                });
                                
                                imagePromises.push(imagePromise);
                            } catch (fileError) {
                                console.error(`Error processing file ${relativePath} from zip ${i + 1}:`, fileError);
                            }
                        }
                    });
                    
                    // Wait for all images from this zip to be copied
                    if (imagePromises.length > 0) {
                        console.log(`Copying ${imagePromises.length} images from zip ${i + 1}...`);
                        const copiedImages = await Promise.all(imagePromises);
                        const successfulCopies = copiedImages.filter(name => name !== null);
                        console.log(`Successfully copied ${successfulCopies.length} images from zip ${i + 1}`);
                    }
                    
                    // Update filename references in features for this zip
                    allFeatures.forEach(feature => {
                        if (feature.properties && feature.properties.imgFilenames && Array.isArray(feature.properties.imgFilenames)) {
                            feature.properties.imgFilenames = feature.properties.imgFilenames.map(filename => {
                                return filenameMapping.get(filename) || filename;
                            });
                        }
                    });
                    
                } catch (zipError) {
                    console.error(`Error processing zip file ${i + 1} (${zipFiles[i].name}):`, zipError);
                    // Continue with other zips even if one fails
                }
            }
            
            console.log(`Creating merged GeoJSON with ${allFeatures.length} total features`);
            
            // Create merged GeoJSON
            const mergedGeoJSON = {
                type: "FeatureCollection",
                features: allFeatures
            };
            
            // Add merged GeoJSON to zip
            mergedZip.file("map.geojson", JSON.stringify(mergedGeoJSON, null, 2));
            
            // Generate the merged zip file
            console.log("Generating merged zip file...");
            const mergedZipBlob = await mergedZip.generateAsync({ 
                type: "blob",
                compression: "DEFLATE",
                compressionOptions: { level: 6 }
            });
            
            const mergedFile = new File([mergedZipBlob], "Merged_maps.zip", { type: "application/zip" });
            
            console.log(`Successfully merged ${zipFiles.length} zip files with ${allFeatures.length} total features`);
            
            // Log the contents of the merged zip for debugging
            try {
                const testZip = await JSZip.loadAsync(mergedFile);
                const fileList = Object.keys(testZip.files);
                console.log(`Merged zip contains ${fileList.length} files:`, fileList.slice(0, 10)); // Show first 10 files
            } catch (debugError) {
                console.warn("Could not verify merged zip contents:", debugError);
            }
            
            return mergedFile;
            
        } catch (error) {
            console.error("Error merging zip files:", error);
            console.error("Error stack:", error.stack);
            alert(`Error merging zip files: ${error.message}. Please check the console for details.`);
            return null;
        }
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        
        if (files.length === 0) {
            return;
        }

        // Check if all files are images
        const allImages = files.every(file => file.type.startsWith('image/'));
        
        // Check if there are zip files
        const zipFiles = files.filter(file => file.name.toLowerCase().endsWith('.zip'));
        const hasZipFiles = zipFiles.length > 0;
        
        if (allImages && files.length > 0) {
            // Handle image files using ImageParser
            console.log("Dropped image files:", files.length);
            setImagesToParse(files);
        } else if (hasZipFiles) {
            if (zipFiles.length === 1) {
                // Handle single zip file - merge with existing data if available
                console.log("Dropped single zip file:", zipFiles[0].name);
                if (data && (data.data?.features || data.data?.locations)) {
                    console.log("Merging single zip with existing data...");
                    const mergedFile = await mergeMultipleZipFiles(zipFiles, data);
                    if (mergedFile) {
                        setFileToParseWithSizeCalc(mergedFile);
                    }
                } else {
                    // No existing data, just load the single file
                    setFileToParseWithSizeCalc(zipFiles[0]);
                }
            } else {
                // Handle multiple zip files - merge them with existing data if available
                console.log("Dropped multiple zip files:", zipFiles.length);
                const mergedFile = await mergeMultipleZipFiles(zipFiles, data);
                if (mergedFile) {
                    setFileToParseWithSizeCalc(mergedFile);
                }
            }
        } else if (files.length === 1) {
            // Handle single non-image file (could be .txt, .geojson, etc.)
            const file = files[0];
            const allowedExtensions = [".zip", ".txt", ".geojson", ".json"];
            const isAllowed = allowedExtensions.some(ext => 
                file.name.toLowerCase().endsWith(ext)
            );
            
            if (isAllowed) {
                console.log("Dropped allowed file:", file.name);
                if (data && (data.data?.features || data.data?.locations) && 
                    (file.name.toLowerCase().endsWith('.txt') || 
                     file.name.toLowerCase().endsWith('.geojson') ||
                     file.name.toLowerCase().endsWith('.json'))) {
                    // For text/geojson/json files, we might want to merge them too
                    // For now, just replace - but this could be enhanced to merge in the future
                    console.log("Loading file (will replace existing data):", file.name);
                }
                setFileToParseWithSizeCalc(file);
            } else {
                alert("Please drop a valid file (.zip, .txt, .geojson, .json) or image files.");
            }
        } else {
            alert("Please drop either image files, zip files, or a single text/GeoJSON file.");
        }
    };

    return (
        <>
            <SuccessModal
                isVisible={successModalVisible}
                setIsVisible={setSuccessModalVisible}
            />
            <UploadDialog
                isOpen={isUploadDialogOpen}
                setIsOpen={setIsUploadDialogOpen}
                currentDataset={data?.data}
                setSuccessModalVisible={setSuccessModalVisible}
                isLoginVisible={isLoginVisible}
                setIsLoginVisible={setIsLoginVisible}
            />
            <ShareModal
                isOpen={isModalOpen}
                setIsOpen={setIsModalOpen}
                currentDataset={data?.data}
                setIsUploadDialogOpen={setIsUploadDialogOpen}
            />
            <div 
                id="map"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={isDragOver ? "drag-over" : ""}
            >
                {isDragOver && (
                    <div className="drag-overlay">
                        <div className="drag-message">
                            <h3>Drop your files here</h3>
                            <p>Supported: ZIP files (single or multiple), images, TXT, GeoJSON</p>
                        </div>
                    </div>
                )}
                <div className={`map-title ${shouldPulse ? "pulse-shadow" : ""}`}>
                    {titleValue}
                </div>

                <MapContainer {...mapConfig}>
                    {/* OpenStreetMap basemap */}
                    <OpenStreetMapTileLayer />
                    {/* current position marker */}
                    {currentLocation && (
                        <Marker position={currentLocation} icon={currentPositionIcon}>
                            <Popup offset={L.point(0, -5)} maxWidth={200} maxHeight={400}> 
                                <p style={{ textAlign: "center", fontWeight: 600 }}>
                                    You're here!
                                </p>
                                <p style={{ textAlign: "center" }}>
                                    {currentLocation.join(", ")}
                                </p>
                            </Popup>
                        </Marker>
                    )}
                    {/* error if currentLocation can't be found */}
                    {error && <ErrorPopup />}
                    {data && <MapDataLayer 
                        data={data} 
                        onUpdateFeature={handleUpdateFeature}
                        onDeleteFeature={handleDeleteFeature}
                        onUpdateImageLocation={handleUpdateImageLocation}
                        onDeleteImageLocation={handleDeleteImageLocation}
                        setMapData={setMapData}
                        updateGlobalDataFile={updateGlobalDataFile}
                        onMapRenderComplete={onMapRenderComplete}
                    />}
                    {showWaMappers && <WhatsAppMappersDataLayer />}
                    <MaxZoomController showWaMappers={showWaMappers} setShowWaMappers={setShowWaMappers} />
                    <UpdateMap
                        currentLocation={currentLocation}
                        flyToLocation={flyToLocation}
                        setFlyToLocation={setFlyToLocation}
                    />
                    <ScaleControl position="bottomleft" metric={true} imperial={false} />
                    <AttributionControl
                        position="bottomright"
                        prefix="Leaflet"
                    />
                </MapContainer>
                <MapActionArea
                    setTitle={setTitleValue}
                    setPulse={setShouldPulse}
                    setModalOpen={setIsModalOpen}
                    currentDataset={data?.data}
                    showWaMappers={showWaMappers}
                    setShowWaMappers={setShowWaMappers}
                    maxZoomConnect={maxZoomConnect}
                />
            </div>
        </>
    );
}