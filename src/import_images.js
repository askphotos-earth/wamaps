import React, { useCallback } from "react";
import { sha256, slugify } from "./utils.js";
import { uploadProcessedChat } from "./data_submission";
import * as JSZip from "jszip";
import { setGlobalProcessedChatFile } from "./import_whatsapp.js";


const worldCapitals = [
	"Kabul", "Tirana", "Algiers", "Andorra la Vella", "Luanda", "Buenos Aires", "Yerevan", "Canberra", "Vienna", "Baku",
	"Nassau", "Manama", "Dhaka", "Bridgetown", "Minsk", "Brussels", "Belmopan", "Porto-Novo", "Thimphu", "Sucre",
	"Sarajevo", "Gaborone", "Brasília", "Bandar Seri Begawan", "Sofia", "Ouagadougou", "Gitega", "Phnom Penh", "Yaoundé", "Ottawa",
	"Praia", "Bangui", "N'Djamena", "Santiago", "Beijing", "Bogotá", "Moroni", "Kinshasa", "Brazzaville", "San José",
	"Zagreb", "Havana", "Nicosia", "Prague", "Copenhagen", "Djibouti", "Roseau", "Santo Domingo", "Quito", "Cairo",
	"San Salvador", "Malabo", "Asmara", "Tallinn", "Addis Ababa", "Suva", "Helsinki", "Paris", "Libreville", "Banjul",
	"Tbilisi", "Berlin", "Accra", "Athens", "St. George's", "Guatemala City", "Conakry", "Bissau", "Georgetown", "Port-au-Prince",
	"Tegucigalpa", "Budapest", "Reykjavik", "New Delhi", "Jakarta", "Tehran", "Baghdad", "Dublin", "Jerusalem", "Rome",
	"Kingston", "Tokyo", "Amman", "Astana", "Nairobi", "Tarawa", "Pristina", "Kuwait City", "Bishkek", "Vientiane",
	"Riga", "Beirut", "Maseru", "Monrovia", "Tripoli", "Vaduz", "Vilnius", "Luxembourg", "Antananarivo", "Lilongwe"
  ];

// Function to get or create a persistent observer name from localStorage
const getPersistentObserver = () => {
  const STORAGE_KEY = 'wamaps_observer_name';
  
  // Check if observer name already exists in localStorage
  let observerName = localStorage.getItem(STORAGE_KEY);
  
  // If no observer name exists, create one and store it
  if (!observerName) {
    observerName = worldCapitals[Math.floor(Math.random() * worldCapitals.length)];
    localStorage.setItem(STORAGE_KEY, observerName);
    console.log('Created new persistent observer name:', observerName);
  } else {
    console.log('Using existing observer name from localStorage:', observerName);
  }
  
  return observerName;
};

// Function to initialize observer name on app startup (can be called from main.js)
export const initializeObserverName = () => {
  return getPersistentObserver();
};

// Function to extract exif data from an image - exported for reuse
export const extractExifData = async (imageFile) => {
  return new Promise((resolve, reject) => {
    console.log("Starting to extract EXIF data from", imageFile.name);
    
    // Check if it's an image file
    if (!imageFile.type.startsWith('image/')) {
      console.log("Not an image file:", imageFile.name, imageFile.type);
      return resolve({
        hasGeoData: false,
        file: imageFile
      });
    }
    
    // Use FileReader with readAsArrayBuffer for EXIF extraction
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        // Use exif-parser to extract metadata from the buffer
        const buffer = e.target.result;
        const exifParser = require('exif-parser').create(buffer);
        const result = exifParser.parse();
        
        // Check if we have GPS data
        if (result && result.tags && 
            typeof result.tags.GPSLatitude !== 'undefined' && 
            typeof result.tags.GPSLongitude !== 'undefined') {
          
          console.log(`GPS data found for ${imageFile.name}:`, 
            result.tags.GPSLatitude, result.tags.GPSLongitude);
          
          // Get the date from EXIF if available, or fallback to current date
          let timestamp;
          if (result.tags.DateTimeOriginal) {
            // Convert EXIF date format to ISO string
            const exifDate = new Date(result.tags.DateTimeOriginal * 1000);
            timestamp = exifDate.toISOString();
          } else {
            timestamp = new Date().toISOString();
          }
          
          resolve({
            latitude: result.tags.GPSLatitude,
            longitude: result.tags.GPSLongitude,
            timestamp: timestamp,
            file: imageFile,
            hasGeoData: true,
            // Include additional metadata for potential future use
            altitude: result.tags.GPSAltitude,
            make: result.tags.Make,
            model: result.tags.Model,
            gpsImgDirection: result.tags.GPSImgDirection
          });
        } else {
          console.log("No GPS data found in:", imageFile.name);
          resolve({
            hasGeoData: false,
            file: imageFile
          });
        }
      } catch (error) {
        console.error("Error extracting EXIF data:", error, "for file:", imageFile.name);
        resolve({
          hasGeoData: false,
          file: imageFile
        });
      }
    };
    
    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      resolve({
        hasGeoData: false,
        file: imageFile
      });
    };
    
    // Read the image as an ArrayBuffer for EXIF parsing
    reader.readAsArrayBuffer(imageFile);
  });
};

// Generate a unique ID for each image point
const generateImageId = async (latitude, longitude, timestamp) => {
  const hash = await sha256(`${latitude}_${longitude}_${timestamp}`);
  return hash.substring(0, 10);
};

// Alternative non-async ID generator using a simple hash function
const generateSimpleId = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to hex string and take first 10 chars
  return Math.abs(hash).toString(16).substring(0, 10);
};

// Create a URL for the image to use in the map popup
const createImageUrl = (file) => {
  return URL.createObjectURL(file);
};

// Convert image data to the same format used by WhatsApp chat maps
export const convertImageToMapData = (processedImages) => {
  const mapData = {
    locations: {},
    people: {},
    liveLocations: {},
    features: [], // Add features array to match WhatsApp data structure
    isImageData: true, // Add flag to identify this as image data
  };
  
  // Generate a timestamp for the entire batch
  const batchTimestamp = new Date().toISOString();
  // Use simple ID generation instead of async sha256
  const batchId = generateSimpleId(batchTimestamp);

  // Get the persistent observer name from localStorage
  const observerName = getPersistentObserver();

  // Create a sender ID for the batch of images
  const sender = {
    id: `image_sender_${batchId}`,
    name: observerName,
    colorIndex: 0
  };
  
  mapData.people[sender.id] = sender;
  
  // Process each image with location metadata
  // processedImages should already have the EXIF data extracted
  processedImages.forEach((imageData, index) => {
    const { latitude, longitude, timestamp, file, make, model, altitude, gpsImgDirection } = imageData;
    // Use simple ID generation instead of async generateImageId
    const id = generateSimpleId(`${latitude}_${longitude}_${timestamp}`);
    const imageUrl = createImageUrl(file);
    
    // Format the date for display
    const dateObject = new Date(timestamp);
    const formattedDate = dateObject.toLocaleDateString();
    const formattedTime = dateObject.toLocaleTimeString();
    
    // Create a description with image metadata
    const description = `
      <div class="image-popup">
        <div class="image-container">
          <img src="${imageUrl}" alt="${file.name}" style="max-width: 200px; max-height: 200px; display: block; margin: 0 auto;">
        </div>
        <div class="image-details">
          <p><strong>Name:</strong> ${file.name}</p>
          <p><strong>Date:</strong> ${formattedDate} ${formattedTime}</p>
          ${make ? `<p><strong>Camera:</strong> ${make} ${model || ''}</p>` : ''}
          <p><strong>Coordinates:</strong> ${latitude.toFixed(6)}, ${longitude.toFixed(6)}</p>
          ${altitude ? `<p><strong>Altitude:</strong> ${altitude.toFixed(1)}m</p>` : ''}
        </div>
      </div>
    `;
    
    // Add to the locations object with all necessary fields for the map
    mapData.locations[id] = {
      id,
      latitude,
      longitude,
      timestamp,
      created: timestamp,
      batch: batchId,
      imageUrl: imageUrl, // Use imageUrl property name to match map.js expectations
      image: imageUrl,    // Keep image property for compatibility
      name: file.name,
      make: make || '',
      model: model || '',
      altitude: altitude || null,
      gpsImgDirection: gpsImgDirection || null,
      senderId: sender.id,
      sender: sender.id,   // Include both for compatibility
      description: description,
      message: description, // Include message field for compatibility with map.js popup handling
      address: `Photo: ${file.name}` // Add an address field for display in popups
    };
    
    // Also add a GeoJSON feature to the features array to match WhatsApp data structure
    mapData.features.push({
      type: "Feature",
      properties: {
        contributionid: batchId,
        mainattribute: "Geotagged Images",
        name: file.name,
        datetime: timestamp,
        observer: sender.name,
        observations: "Add description/tag", // Standardized observation text
        markerColour: "0", // Default color
        imgFilenames: [file.name],
        // Removed make and model properties
        altitude: altitude ? String(altitude) : '',
        gpsImgDirection: gpsImgDirection ? String(gpsImgDirection) : ''
      },
      geometry: {
        type: "Point",
        coordinates: [longitude, latitude]
      }
    });
  });
  
  return mapData;
};

// Main component to handle image file parsing

export let importdataimages = false;
export function ImageParser({ files, onComplete, setLoadingMessage, onProcessingComplete, onMapRenderComplete, ...dataDisplayProps }) {
  const { setMapData, showMap, setFileToParse } = dataDisplayProps;
  
  if(!window.location.href.includes('?import=')){
      importdataimages = true; // Set to true when FileParser is called from WhatsApp, not from pre-signed URL (to avoid zip file uploads)
    }
  const setDataDisplayMap = useCallback(
    (data, name, imgZip = null) => {
      // Update any mapData if needed before setting
      setMapData({ 
        data, 
        isImageData: true, // Ensure isImageData flag is set in the dataset object
        imgZip: imgZip
      });
      showMap(true);
      
      // Call onComplete callback after parsing is done
      if (onComplete) {
        onComplete(data, name);
      }
      
      // Set up callback to hide loading message when map rendering is complete
      if (onMapRenderComplete && setLoadingMessage) {
        // Override the onMapRenderComplete to also hide the local loading message
        const originalCallback = onMapRenderComplete;
        window.hideLoadingOnMapRender = () => {
          console.log('Map render complete - hiding local loading message');
          setLoadingMessage(false);
          if (originalCallback) {
            originalCallback();
          }
        };
      }
    },
    [setMapData, showMap, onComplete, onMapRenderComplete, setLoadingMessage]
  );

  // Process image files and extract geotagged information
  const processImageFiles = async (files) => {
    try {
      
      console.log("Processing", files.length, "image files");
      // Convert FileList to array
      const fileArray = Array.from(files);
      
      // Extract EXIF data from all images
      const imageDataPromises = fileArray.map(extractExifData);
      const imageDataResults = await Promise.all(imageDataPromises);
      
      // Filter only images with geo data
      const geotaggedImages = imageDataResults.filter(img => img.hasGeoData);
      console.log("Found", geotaggedImages.length, "images with geo data out of", fileArray.length);
      
      // Show alert if no geotagged images were found
      if (geotaggedImages.length === 0 && fileArray.length > 0) {
        alert(`None of the ${fileArray.length} selected images contain location data. Please select images with GPS metadata.`);
        setLoadingMessage(false); // Hide the loading message

      }
      
      // Create statistics
      const stats = {
        totalProcessed: fileArray.length,
        withLocation: geotaggedImages.length
      };
      
      // Call the processing complete callback with stats
      if (onProcessingComplete) {
        onProcessingComplete(stats);
      }
      
      if (geotaggedImages.length === 0) {
        return;
      }
      
      // Convert to mapData format - pass the already processed images
      const mapData = convertImageToMapData(geotaggedImages);
      
      // Create a ZIP file containing both GeoJSON data and original images
      const zip = new JSZip();
      
      // Convert mapData to GeoJSON structure matching the schema from import_whatsapp.js
      const geojsonData = {
        type: "FeatureCollection",
        features: Object.values(mapData.locations).map(location => {
          return {
            type: "Feature",
            properties: {
              contributionid: location.batch || generateSimpleId(location.timestamp),
              mainattribute: "Geotagged Images",
              name: location.name,
              datetime: location.timestamp,
              observer: mapData.people[location.senderId]?.name || "Unknown",
              observations: "Add description/tag", // Set standardized observation text
              imgFilenames: [location.name],
              // markerColour: "0", // Default color
              altitude: location.altitude ? String(location.altitude) : "",
              gpsImgDirection: location.gpsImgDirection ? String(location.gpsImgDirection) : "not recorded"
            },
            geometry: {
              type: "Point",
              coordinates: [location.longitude, location.latitude]
            }
          };
        })
      };
      
      // Add GeoJSON to zip
      const geojsonBlob = new Blob([JSON.stringify(geojsonData, null, 2)], {
        type: "application/geo+json"
      });
      zip.file("map.geojson", geojsonBlob);
      
      // Add all geotagged images to the zip
      for (const imgData of geotaggedImages) {
        zip.file(imgData.file.name, imgData.file);
      }
      
      // Generate the ZIP file
      const zipBlob = await zip.generateAsync({ type: "blob" });
      
      // Create File object from blob
      const fileName = `geotagged_images_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.zip`;
      const zipFile = new File([zipBlob], fileName, { type: "application/zip" });
      
      // Use the function from import_whatsapp.js to set the global variable
      setGlobalProcessedChatFile(zipFile);
      
      // Calculate and store image size information immediately
      if (window.calculateAndStoreImageSize) {
        window.calculateAndStoreImageSize(zipFile);
      }
      
      // Also set it as a window property for compatibility with any code that might use it
      window.globalProcessedChatFile = zipFile;
      
      // Set the data to be displayed on the map
      setDataDisplayMap(mapData, fileName, zip);
      
    } catch (error) {
      console.error("Error processing image files:", error);
      if (onProcessingComplete) {
        onProcessingComplete({ totalProcessed: 0, withLocation: 0, error: error.message });
      }
    }
  };

  // Process files when component mounts
  React.useEffect(() => {
    if (files && files.length > 0) {
      console.log("ImageParser received", files.length, "files:", 
        Array.from(files).map(f => f.name).join(", "));
      processImageFiles(files);
    } else {
      console.log("ImageParser: No files received or files array is empty");
    }
  }, [files]);

  return null; // This component does not render anything
}

// Function to prepare image data for export
export const prepareImageDataForExport = async (mapData) => {
  // Create a blob from the map data (excluding actual images)
  const exportData = JSON.parse(JSON.stringify(mapData));
  
  // Remove image URLs which are blob URLs and not suitable for export
  Object.keys(exportData.locations).forEach(key => {
    const location = exportData.locations[key];
    if (location.imageUrl) {
      delete location.imageUrl;
    }
    if (location.originalFile) {
      delete location.originalFile;
    }
  });
  
  const jsonString = JSON.stringify(exportData);
  const blob = new Blob([jsonString], { type: "application/json" });
  
  return {
    blob,
    fileName: `geotagged_images_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.json`
  };
};

// Export images to the server
export const uploadImageData = async (mapData, sharingOption, taskId, tags, mapperId, setButtonText, setButtonDisabled) => {
  try {
    // Import the variable here to get its latest value
    const { globalProcessedChatFile } = await import('./import_whatsapp.js');
    
    // Use the global zip file that we created in processImageFiles
    if (globalProcessedChatFile) {
      const fileName = `geotagged_images_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.zip`;
      return await uploadProcessedChat(
        globalProcessedChatFile,
        fileName,
        setButtonText,
        setButtonDisabled,
        sharingOption,
        taskId,
        tags,
        mapperId
      );
    } else {
      // Fallback to the old method if globalProcessedChatFile is not available
      const { blob, fileName } = await prepareImageDataForExport(mapData);
      return await uploadProcessedChat(
        blob, 
        fileName, 
        setButtonText, 
        setButtonDisabled, 
        sharingOption, 
        taskId, 
        tags, 
        mapperId
      );
    }
  } catch (error) {
    console.error("Error uploading image data:", error);
    throw error;
  }
};
