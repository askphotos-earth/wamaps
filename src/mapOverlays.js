import React, { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./styles/map-etc.css";
import html2canvas from "html2canvas";
import * as JSZip from "jszip";
import { saveAs } from "file-saver"; // Import file-saver for downloading files
import proj4 from "proj4";
import { fromLatLon, toLatLon } from 'utm';
import checkingPwGif from "./images/checkingPw.gif";

import {
    closeIcon,
    imageIcn,
    menuIcon,
    dataIcn,
    uploadIcn,
    chevronUp,
    share,
    search,
    exitButtonIcon,
    msgIcon,
    // fa-whatsapp,
} from "./icons";
import { getMobileOptimizedSettings } from "./main.js";
import { slugify, useClickOutside } from "./utils.js";
import { isMobileOrTablet } from "./main.js";
import { useUserStore } from "./UserContext.jsx";
import { ASK_URL, hasCognito } from "../globals.js";
import { uploadProcessedChat } from "./data_submission.js";
import { uploadImageData } from "./import_images.js";
import { globalProcessedChatFile, setGlobalProcessedChatFile } from "./import_whatsapp";
// import BurgerMenu from "./BurgerMenu.jsx";
// import { handleConnect } from "./ConnectButton.js";
import { handleSearch } from "./SearchBar.js";
import { importdata, enableDownload } from "./import_telegram.js";
import { importdataimages } from "./import_images.js";

import { FilePicker, MainMenu } from "./MainMenu.jsx"; // Adjust the path based on your project structure
// import { createHash } from "crypto";
import { encryptFile, encodePassphrase } from "./encryption.js";
import ReactGA from "react-ga4";

// Progress Bar Component
const ProgressBar = ({ progress, stage, stageProgress, text }) => {
    const getStageText = () => {
        switch (stage) {
            case "compressing":
                return `Compressing & Encrypting... ${stageProgress}%`;
            case "encrypting":
                return `Encrypting... ${stageProgress}%`;
            case "uploading":
                return `Uploading Map... ${stageProgress}%`;
            default:
                return text || "Processing...";
        }
    };

    return (
        <div style={{ 
            width: "100%", 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center",
            gap: "8px"
        }}>
            <div style={{
                fontSize: "0.9rem",
                fontWeight: "500",
                color: "rgba(255, 255, 255, 0.95)", // Much higher opacity
                textAlign: "center"
            }}>
                {getStageText()}
            </div>
            <div style={{
                width: "85%",
                height: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.4)", // Higher opacity background
                borderRadius: "4px",
                overflow: "hidden"
            }}>
                <div style={{
                    width: `${progress}%`,
                    height: "100%",
                    backgroundColor: "rgba(255, 255, 255, 0.9)", // Much higher opacity
                    borderRadius: "4px",
                    transition: "width 0.3s ease"
                }} />
            </div>
        </div>
    );
};




// function ShareBtn({ setOpen }) {
//     const openShareModal = () => setOpen(true);
//     return (
//         <button type="button" className="share" onClick={openShareModal}>
//             {shareIcn}
//         </button>
//     );
// }

// function SubmitBtn() {
//     return (
//         <button type="submit" className="submit">
//             {chevronUp}
//         </button>
//     );
// }

// function Search() {
//     console.log("search clicked......")
//     return (
//         <button type="submit" className="submit">
//             {chevronUp}
//         </button>
//     );
// }

// Loading spinner for uploadPending state
function LoadingSpinner({ text, progress }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <img src={checkingPwGif} alt="loading" style={{ height: '1.2em', verticalAlign: 'middle' }} />
            <span>{text}</span>
            {progress && <span style={{ fontSize: "0.8em", opacity: 0.8 }}>({progress})</span>}
        </div>
    );
}

let qualityPic = 0.25; // Set the compression parameter
let maxWidthPic = 300; // Set the maximum width for the image
let maxHeightPic = 300; // Set the maximum height for the image

// Function to calculate total size of all images in a zip file
// Removed calculateTotalImageSize function - we now simply use file.size

// Function to get dynamic quality based on total image size
const getDynamicQuality = (totalSizeBytes) => {
    const totalSizeMB = totalSizeBytes / (1024 * 1024);
    
    let quality;
    let qualityCategory;
    
    if (totalSizeMB < 50) {
        quality = 0.75;
        qualityCategory = "HIGH (< 50MB)";
    } else if (totalSizeMB < 100) {
        quality = 0.5;
        qualityCategory = "MEDIUM (50-100MB)";
    } else if (totalSizeMB < 200) {
        quality = 0.25;
        qualityCategory = "LOW (100-200MB)";
    } else {
        quality = 0.1;
        qualityCategory = "VERY_LOW (> 200MB)";
    }
    
    // console.log(`📊 Dynamic Quality Applied:`);
    // console.log(`   • File Size: ${totalSizeMB.toFixed(2)} MB`);
    // console.log(`   • Quality Factor: ${quality} (${qualityCategory})`);
    
    return quality;
};

// Global storage for image size information
window.globalImageSizeInfo = {
    totalSize: 0,
    isCalculated: false,
    isMapTooLarge: false,
    dynamicQuality: 0.25
};

// Global function to calculate and store image size information
window.calculateAndStoreImageSize = (zipFile) => {
    if (!zipFile) {
        // console.log("🔄 Image size calculation reset (no zip file)");
        window.globalImageSizeInfo = {
            totalSize: 0,
            isCalculated: false,
            isMapTooLarge: false,
            dynamicQuality: 0.25
        };
        return;
    }
    
    // Simple approach: just use the zip file size
    const totalSize = zipFile.size;
    const maxSizeBytes = 500 * 1024 * 1024; // 5MB
    const isMapTooLarge = totalSize > maxSizeBytes;
    const dynamicQuality = getDynamicQuality(totalSize);
    
    // Store globally
    window.globalImageSizeInfo = {
        totalSize,
        isCalculated: true,
        isMapTooLarge,
        dynamicQuality
    };
    
    // Update the quality parameter
    qualityPic = dynamicQuality;
    
    // console.log(`📦 Image Size Analysis Complete:`);
    // console.log(`   • Total File Size: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
    // console.log(`   • Map Too Large: ${isMapTooLarge ? 'YES (> 500MB)' : 'NO'}`);
    // console.log(`   • Applied Global Quality: ${qualityPic}`);
    
    return window.globalImageSizeInfo;
};

const compressImageBlob = async (blob, quality = 0.6, maxWidth = 200, maxHeight = 200) => {
    const originalSizeKB = (blob.size / 1024).toFixed(1);
    
    // Skip compression for very small images (mobile optimization)
    if (blob.size < 50000) { // 50KB threshold for mobile
        // console.log(`🖼️ Image compression skipped (${originalSizeKB} KB < 50 KB threshold)`);
        return blob;
    }
    
    // console.log(`🗜️ Compressing image: ${originalSizeKB} KB → Quality: ${quality}, Max: ${maxWidth}x${maxHeight}`);
    
    return new Promise((resolve) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { 
            alpha: false,           // Disable alpha for better performance
            willReadFrequently: false // Optimize for single-read operations
        });
        
        img.onload = () => {
            // Calculate dimensions
            let { width, height } = img;
            const originalDimensions = `${width}x${height}`;
            const aspectRatio = width / height;
            
            if (width > maxWidth) {
                width = maxWidth;
                height = width / aspectRatio;
            }
            if (height > maxHeight) {
                height = maxHeight;
                width = height * aspectRatio;
            }
            
            const finalDimensions = `${Math.floor(width)}x${Math.floor(height)}`;
            
            // Set canvas dimensions
            canvas.width = Math.floor(width);
            canvas.height = Math.floor(height);
            
            // Use better image smoothing for mobile
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'medium'; // Balance between quality and speed
            
            // Draw and compress
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            canvas.toBlob((compressedBlob) => {
                URL.revokeObjectURL(img.src);
                
                if (compressedBlob && compressedBlob.size < blob.size) {
                    const compressedSizeKB = (compressedBlob.size / 1024).toFixed(1);
                    const compressionRatio = ((1 - compressedBlob.size / blob.size) * 100).toFixed(1);
                    // console.log(`✅ Compression successful: ${originalSizeKB} KB → ${compressedSizeKB} KB (${compressionRatio}% reduction, ${originalDimensions} → ${finalDimensions})`);
                    resolve(compressedBlob);
                } else {
                    // console.log(`⚠️ Compression skipped: Result would be larger (${originalSizeKB} KB → ${originalDimensions})`);
                    resolve(blob);
                }
            }, 'image/jpeg', quality);
        };
        
        img.onerror = () => {
            // console.log(`❌ Image compression failed for ${originalSizeKB} KB image`);
            URL.revokeObjectURL(img.src);
            resolve(blob);
        };
        
        img.src = URL.createObjectURL(blob);
    });
};

function InputArea({ setTitle, setPulse, search, currentDataset }) {
    const { t } = useTranslation();
    const [isSubmit, setIsSubmit] = useState(false);
    const [filterValue, setFilterValue] = useState("");
    const [placeholderValue, setPlaceholderValue] = useState(t("addDescription"));

    const handleSubmit = (e) => {
        e.preventDefault();
        let topic = filterValue;

        currentDataset.features?.forEach((feature) => {
            feature.properties.topic = topic;
        });

        // Create slug from topic and add to dataset
        const slug = slugify(`${currentDataset.slug}-${topic}`);
        currentDataset.slug = slug;

        setTitle(topic);
        setPulse(true);
        setFilterValue("");
        setPlaceholderValue(t("updateDescription"));
        setIsSubmit(false);
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setFilterValue(value);
        if (value.length >= 1) setIsSubmit(true);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault(); // Prevent the default behavior of adding a new line
            search(); // Fire the handleSearch function
        }
    };

    return (
        <form className="filter__form">
            <div
                className="filter__wrapper"
                style={{
                    width: isMobileOrTablet() ? "80%" : "25%",
                }}
            >
                <textarea
                    placeholder={placeholderValue}
                    name="filter"
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown} // Add the onKeyDown event listener
                    value={filterValue}
                ></textarea>

                <button id="search" type="button" onClick={search}>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
                            stroke="currentColor"
                            strokeWidth="2"
                        />
                        <path
                            d="M22 22L16 16"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    </svg>
                </button>
            </div>

            <div className="filter__suggested-tags">
                <button type="button" onClick={search}>Water</button>
                <button type="button" onClick={search}>Population</button>
                <button type="button" onClick={search}>Football</button>
            </div>
        </form>
    );
}


export function MapActionArea({
    setTitle,
    setPulse,
    showMenu,
    currentDataset,
    search,
    share,
    connect,
    create,
    showWaMappers,
    setShowWaMappers,
    maxZoomConnect,
    ...dataDisplayProps // Add this to capture the props
}) {
    const [isBMVisible, setIsBMVisible] = useState(false); // Define the state for BurgerMenu visibility
    const [isModalOpen, setIsModalOpen] = useState(false); // State for the share modal
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false); // State for the search modal
    const [isPremium, setIsPremium] = useState(false); // State to differentiate between Search and Premium
    const [isRegisterMapper, setIsRegisterMapper] = useState(false); // State for "register as a mapper"
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // State for the "Create" modal
    const [isUploading, setIsUploading] = useState(false); // State to track upload status

    // const [showWaMappers, setShowWaMappers] = useState(false);

    // const toggleBM = () => {
    //     setIsBMVisible((prevState) => !prevState);
    // };

    const handleConnect = () => {
        if (showWaMappers) {
            // If layer is already shown, just hide it without showing modal
            setShowWaMappers(false);
        } else {
            // If layer is off, show modal and then show the layer
            setIsRegisterMapper(true); // Set the modal content to "register as a mapper"
            setIsSearchModalOpen(true); // Open the search modal
            setShowWaMappers(true); // Enable mappers location
            maxZoomConnect(); // Call the function to handle max zoom limiting

        }
    };

    const handleShare = () => {
        setIsModalOpen(true); // Opens the share modal
        setIsPremium(false); // Set to "Premium" mode

    };

    const handleSearch = () => {
        setIsSearchModalOpen(true); // Opens the search modal
        setIsPremium(false); // Reset isPremium to false

    };

    const handlePremium = () => {
        setIsPremium(true); // Set to "Premium" mode
        setIsSearchModalOpen(true); // Opens the search modal
        
    };

    const handleCreate = () => {
        // Ensure persistent observer name is initialized when Create button is clicked
        const { initializeObserverName } = require('./import_images.js');
        initializeObserverName();
        setShowWaMappers(false);

        
        setIsCreateModalOpen(true); // Open the "Create" modal
        // console.log("create modal clicked")
    };

    const handleDownloadMap = () => {
        if (!currentDataset) return;
        const blob = new Blob([JSON.stringify(currentDataset)], { type: "application/geo+json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `WAMaps_Map_${Date.now()}.geojson`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const isMapConverted = Boolean(currentDataset);

    return (
        <div id="map-actions-container">
            <div className="map-actions__wrapper">
                <div className="map-actions__body">
                    <InputArea
                        setTitle={setTitle}
                        setPulse={setPulse}
                        currentDataset={currentDataset}
                        search={handleSearch}
                    />
                    <div className="map-actions__buttons">
                        {/* Create / Download Button */}
                        <button
                            id="create"
                            type="button"
                            onClick={isMapConverted ? handleDownloadMap : handleCreate}
                            className="map-action-btn"
                        >
                            <span className="map-action-label" style={{ color: "#3a3a3a", }}>
                                {isMapConverted ? "Download" : "Convert WhatsApp chat to map"}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Share Modal */}
            <ShareModal
                isOpen={isModalOpen}
                setIsOpen={setIsModalOpen}
                currentDataset={currentDataset}
                isUploading={isUploading}
                setIsUploading={setIsUploading}
                {...dataDisplayProps} // Pass the props here

            />

            {/* Search Modal */}
            <SearchModal
                isOpen={isSearchModalOpen}
                setIsOpen={setIsSearchModalOpen}
                isPremium={isPremium} // Pass the isPremium state here
                setIsPremium={setIsPremium} // Pass the setIsPremium function
                isRegisterMapper={isRegisterMapper} // Pass the new state
                setIsRegisterMapper={setIsRegisterMapper} // Pass the setter
            />

            {/* Create Modal */}
            <CreateModal
                isOpen={isCreateModalOpen}
                setIsOpen={setIsCreateModalOpen}
                isUploading={isUploading}
                setIsUploading={setIsUploading}

            />

        </div>
    );
}
export function CreateModal({ isOpen, setIsOpen, isUploading, setIsUploading }) {
    if (!isOpen) return null;

    const createModalRef = useRef(null);
    const [showExportHelp, setShowExportHelp] = useState(false);
    const [showShareHelp, setShowShareHelp] = useState(false);


    useClickOutside(createModalRef, () => {
        if (!isUploading) setIsOpen(false);
    }); // Close modal when clicking outside

    const handleUploadClick = () => {
        const filePickerButton = document.getElementById("filePickerButton");
        filePickerButton?.click();
        setIsOpen(false); // Close the "Create" modal

        // Clear the /?import=... in the URL
        const url = new URL(window.location.href);
        url.searchParams.delete("import"); // Remove the "import" query parameter
        window.history.replaceState({}, document.title, url.toString()); // Update the URL without reloading
    };

    return (
        <div id="sharing-modal" ref={createModalRef}> {/* Use the same id as ShareModal */}
            <button
                className="modal-close btn"
                onClick={() => setIsOpen(false)}
                disabled={isUploading}
            >
                {closeIcon}
            </button>
            <div className="modal-content">
                <div className="option-button-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <p style={{ textAlign: "center" }}>
                        If you already have a WhatsApp chat with locations and pictures, export it from WhatsApp and convert it.
                    </p>

                    

                    <button
                        className="btn"
                        onClick={handleUploadClick}
                        style={{ height: '45px', width: '220px', flex: 'none' }}
                        disabled={isUploading}
                    >
                        Select exported chat
                    </button>
                    <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); setShowExportHelp(prev => !prev); }}
                        style={{ textAlign: "center" }}
                    >
                        How do I export a WhatsApp Chat?
                    </a>
                    {showExportHelp && (
                        <p style={{ textAlign: "center" }}>
                            Open the WhatsApp group and click on the three dots at the top-right. Then 'More'. Then 'Export chat'. Then 'With media'. Finally, upload the exported zip file here.
                        </p>
                    )}
                    <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); setShowShareHelp(prev => !prev); }}
                        style={{ textAlign: "center" }}
                    >
                        How do people collect data points in WhatsApp?
                    </a>
                    {showShareHelp && (
                        <p style={{ textAlign: "center" }}>
                            Three simple steps: Click on the Clip 📎. Then click Share Location (NOT Live Location). Then take a picture.
               
                        </p>
                    )}

                    <p style={{ textAlign: "center" }}>
                        🔒 The WhatsApp chat stays in your computer. We never see your data.
                    </p>
                </div>
            </div>
        </div>
    );
}
export function SearchModal({ isOpen, setIsOpen, isPremium, isRegisterMapper, setIsRegisterMapper }) {
    if (!isOpen) return null;

    const searchModalRef = useRef(null);

        useClickOutside(searchModalRef, () => {
            setIsOpen(false);
            setIsRegisterMapper(false);
        });

    return (
        <div id="search-modal" ref={searchModalRef}>
            <button
                className="modal-close btn"
                onClick={() => {
                    setIsOpen(false);
                    setIsRegisterMapper(false); // Reset the state
                }}
            >
                {closeIcon}
            </button>
            <div className="modal-title">
                {isRegisterMapper
                    ? "Connect"
                    : isPremium
                        ? "Pro"
                        : "Search"}
            </div>
            <div className="modal-content">
                {isRegisterMapper ? (
                    <>
                        <p>
                            {/* Zoom out if you can't find WhatsApp Mappers in this area.
                <br />
                Or register yourself or others as WhatsApp Mappers. Once registered, anyone can contact you to pay you for creating a WhatsApp Map.<br /> 
                We recommend you to create a WhatsApp Business account to show your profile.
                <br />
                <br />
                To register, all you need to do is send us a WhatsApp message 👇 */}
                        </p>
                        <div className="option-button-container">

                            {/* <button
                    className="btn"
                    onClick={() => setIsOpen(false)}>

                    Connect with<br />mappers in the map
                </button> */}
                            <p style={{ textAlign: "center" }}>We're building the network of business mappers to connect people on the ground with those who need ground data.<br /><br />Register if you want to be contacted to collect data in your area and get paid for it. 
                            </p>
                             <button
                            className="btn"
                            style={{ height: "45px", borderRadius: "15px", marginTop: "-30px" }}
                            onClick={() => {
                                window.open(
                                    "https://form.typeform.com/to/EAUd0TVm",
                                    "_blank",
									"noopener noreferrer"
                                );
                            }}
                        >
                            Register as Business Mapper
                        

                            </button>
                            <p style={{ textAlign: "center" }}>If you need ground data, get in touch.<br />
                            </p>
                            <button
                                className="btn"
                                style={{ height: "45px", borderRadius: "15px", marginTop: "-30px" }}
                                onClick={() => {
                                    window.open(
                                        "https://form.typeform.com/to/QomOwX9N",
                                        "_blank",
									    "noopener noreferrer"
                                    );
                                }}
                            >
                            I need Ground Data
                            </button>
                            
                        </div>
                    </>
                ) : isPremium ? (
                    <>
                        <p style={{ textAlign: "center" }}>
                            <br />
                            The <strong>Free version</strong> allows organisations to visualise and edit one or multiple maps and download the data for spatial analysis in QGIS, ArcGIS etc.
                            <br />
                            <br />
                            The<strong> Pro version</strong> allows organisations to run crowdmapping campaigns with Task IDs, manage large map datasets and use dashboards & AI Agents for advanced visualisation & analysis.

                        </p>
                        <div className="option-button-container">
                            <button
                                className="btn"
                                style={{ borderRadius: "20px", height: "45px" }}
                                onClick={() => {
                                    window.open("https://form.typeform.com/to/dJ4XaduT", "_blank","noopener noreferrer");
                                }}
                            >
                                Request a Pro Demo
                            </button>
                        </div>

                    </>
                ) : (
                    <p style={{ textAlign: "center" }}>No open maps have been shared yet. Contribute yours!</p>
                )}
            </div>

        </div>
    );
}

export function ShareModal({
    isOpen,
    setIsOpen,
    currentDataset,
    setIsUploadDialogOpen,
    dataset,
    isUploading,
    setIsUploading,
    ...dataDisplayProps
}) {

    // console.log("ShareModalclick", dataDisplayProps);
    if (!isOpen) return null;
    
    // Helper function to check if we're dealing with image data
    const checkIsImageData = () => dataDisplayProps.dataset && dataDisplayProps.dataset.isImageData;
    
    const shareModalRef = useRef(null);
    const { t } = useTranslation();
    const [sharingOption, setSharingOption] = useState("private"); // Default to Private
    const [hasTaskId, setHasTaskId] = useState(null);
    const [taskId, setTaskId] = useState("");
    const [mapperId, setMapperId] = useState(""); // New state for Mapper ID
    const [buttonText, _setButtonText] = useState(t("sharedata"));
    const setButtonText = translationKey => _setButtonText(t(translationKey));
    const [isButtonDisabled, setButtonDisabled] = useState(false);
    const [wamapsMapUrl, setwamapsMapUrl] = useState(""); // Store the generated URL
    const [WhatsAppMapTags, setWhatsAppMapTags] = useState(""); // New state for map description
    const [showMapperIdField, setShowMapperIdField] = useState(false); // New state for showing Mapper ID field
    const [password, setPassword] = useState(""); // State for encryption password
    const [passwordError, setPasswordError] = useState(""); // State for password validation errors
    const [decryptError, setDecryptError] = useState(""); // State for decryption errors
    const [uploadError, setUploadError] = useState(""); // State for general upload errors
    const [showPasswordInput, setShowPasswordInput] = useState(false); // Whether to show the password input
    const [showInfoContent, setShowInfoContent] = useState(false); // Whether to show info content
    const [showTaskIdUpload, setShowTaskIdUpload] = useState(false); // Whether to show task ID upload interface
    const [taskIdInput, setTaskIdInput] = useState(""); // Task ID input value
    const [taskIdError, setTaskIdError] = useState(""); // Inline error for Task ID validation
    const [totalImageSize, setTotalImageSize] = useState(0); // Total size of all images in bytes
    const [isImageSizeCalculated, setIsImageSizeCalculated] = useState(false); // Whether image size has been calculated
    const [isMapTooLarge, setIsMapTooLarge] = useState(false); // Whether map exceeds 5MB limit

    // Progress bar state
    const [uploadProgress, setUploadProgress] = useState(0); // Progress percentage (0-100)
    const [uploadStage, setUploadStage] = useState(""); // Current stage: "compressing", "encrypting", "uploading"
    const [uploadStageProgress, setUploadStageProgress] = useState(0); // Progress within current stage (0-100)
    
    // High Resolution button state
    const [highResButtonText, setHighResButtonText] = useState("Need High Resolution?"); // Text for high res button

    // No size check when modal opens - we'll check only when user clicks share
    useEffect(() => {
        if (isOpen && !isImageSizeCalculated) {
            setIsImageSizeCalculated(true);
            // Just reset the states, no calculations here
            setTotalImageSize(0);
            setIsMapTooLarge(false);
        } else if (!isOpen) {
            // Reset states when modal closes
            setIsImageSizeCalculated(false);
            setTotalImageSize(0);
            setIsMapTooLarge(false);
            
            // Reset share-related states when modal closes
            setwamapsMapUrl(""); // Reset the generated URL - this forces full process to run again
            setButtonText("sharedata"); // Reset button text
            setButtonDisabled(false); // Reset button disabled state
            setPassword(""); // Reset password - forces user to enter new password
            setPasswordError(""); // Reset password errors
            setDecryptError(""); // Reset decrypt errors
            setUploadError(""); // Reset upload errors
            setShowPasswordInput(false); // Reset password input visibility
            setShowTaskIdUpload(false); // Reset task ID upload interface
            setTaskIdInput(""); // Reset task ID input
            setTaskIdError(""); // Reset task ID error
            setWhatsAppMapTags(""); // Reset map tags/phone number
            setUploadProgress(0); // Reset upload progress
            setUploadStage(""); // Reset upload stage
            setUploadStageProgress(0); // Reset stage progress
            setHighResButtonText("Need High Resolution?"); // Reset high res button text
            
            // Reset global variables to force re-compression, re-encryption, and re-upload
            setGlobalProcessedChatFile(null); // Clear processed chat file
            if (window.globalImageSizeInfo) {
                window.globalImageSizeInfo = {
                    totalSize: 0,
                    isCalculated: false,
                    isMapTooLarge: false,
                    dynamicQuality: 0.25
                };
            }
        }
    }, [isOpen, globalProcessedChatFile, isImageSizeCalculated, checkIsImageData, dataDisplayProps.dataset]);

    const handleShareDataClick = async () => {
        // Set uploading state
        setIsUploading(true);
        
        // Reset any previous errors
        setDecryptError("");
        setUploadError("");
        setPasswordError("");
        
        // If the URL is already generated, handle re-click behavior
        if (wamapsMapUrl) {
            if (navigator.canShare && navigator.share) {
                navigator
                    .share({
                        title: "#MadeWithWAMaps",
                        text: `This is a private map created with WAMaps. 🔐 The password to open it is: ${password}`,
                        url: wamapsMapUrl,
                    })
                    .catch((error) => console.error("Sharing failed", error))
                    .finally(() => {
                        // Re-enable buttons after sharing attempt
                        setIsUploading(false);
                    });
            } else {
                navigator.clipboard
                    .writeText(wamapsMapUrl)
                    .then(() => {
                        alert("Link copied to clipboard!");
                    })
                    .catch((err) => {
                        console.error("Failed to copy link: ", err);
                    })
                    .finally(() => {
                        // Re-enable buttons after clipboard operation
                        setIsUploading(false);
                    });
            }
            return;
        }

        // Check password is valid
        if (!password) {
            setPasswordError("Please enter a password");
            setIsUploading(false);
            return;
        }
        
        if (password.length < 6) {
            setPasswordError("Password must be at least 6 characters");
            setIsUploading(false);
            return;
        }

        // Check zip file size now - simple check
        if (globalProcessedChatFile) {
            const zipFileSize = globalProcessedChatFile.size;
            const maxSizeBytes = 500 * 1024 * 1024; 
            if (zipFileSize > maxSizeBytes) {
                setPasswordError("");
                setButtonText("sharedata");
                setButtonDisabled(false);
                setIsUploading(false);
                alert(`Map is too large (${(zipFileSize / (1024 * 1024)).toFixed(1)} MB). Options to share large maps are under development. However, you can use the Download Map option instead and share it via e.g. messaging apps`);
                return;
            }
            // console.log(`Zip file size: ${(zipFileSize / (1024 * 1024)).toFixed(2)} MB - OK to share`);
        }

        // Generate the URL if it hasn't been generated yet
        setButtonText("uploadPending");
        setButtonDisabled(true);
        setUploadStage("compressing");
        setUploadProgress(0);
        setUploadStageProgress(0);

        function generateBase62Id(length = 32) {
            const charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
            const charsetLength = charset.length;
            const values = new Uint8Array(length);
            crypto.getRandomValues(values);

            return Array.from(values)
                .map(byte => charset[byte % charsetLength])
                .join("");
        }
        const randomNum = generateBase62Id(); // Generate a random string of 20 characters
        // console.log("🔐 Base62 ID:", randomNum)
        const fileNameWAMap = `WAMapsMap-${randomNum}`; //Reduce parameters to increase security of URL

        try {
            // Prepare file for upload - simplified approach
            let globalProcessedChatFileReduced = null;

            if (globalProcessedChatFile) {
                // Load zip and compress images efficiently
                const zip = await JSZip.loadAsync(globalProcessedChatFile);
                const filenames = Object.keys(zip.files);
                const imageFiles = filenames.filter(filename => /\.(jpg|jpeg|png|gif)$/i.test(filename));
                
                // Get mobile-optimized settings with dynamic quality
                const dynamicQuality = window.globalImageSizeInfo?.dynamicQuality || qualityPic || 0.25;
                const mobileSettings = getMobileOptimizedSettings(dynamicQuality);
                const { maxWidth, maxHeight, quality, batchSize } = mobileSettings;
                const isMobile = /iPad|iPhone|iPod|android|Mobile/i.test(navigator.userAgent);
                
                // console.log(`Compressing ${imageFiles.length} images with mobile-optimized settings:`, mobileSettings);

                // Process images in smaller batches to avoid memory issues
                let progressCount = 0;
                
                if (imageFiles.length === 0) {
                    // No images to compress, move directly to completion
                    setUploadStageProgress(100);
                    setUploadProgress(30);
                } else {
                    for (let i = 0; i < imageFiles.length; i += batchSize) {
                        const batch = imageFiles.slice(i, i + batchSize);
                        console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(imageFiles.length/batchSize)}`);
                        
                        const batchPromises = batch.map(async (filename) => {
                            const file = zip.file(filename);
                        if (file) {
                            try {
                                const fileData = await file.async("blob");
                                const compressedBlob = await compressImageBlob(fileData, quality, maxWidth, maxHeight);
                                if (compressedBlob && compressedBlob.size < fileData.size) {
                                    zip.file(filename, compressedBlob);
                                }
                                
                                progressCount++;
                                // Update compression progress
                                const progressPercent = Math.round((progressCount / imageFiles.length) * 100);
                                setUploadStageProgress(progressPercent);
                                setUploadProgress(Math.round(progressPercent * 0.3)); // Compression is 30% of total process
                            } catch (error) {
                                console.warn(`Failed to compress ${filename}:`, error);
                            }
                        }
                    });
                        
                        await Promise.all(batchPromises);
                        
                        // Add a small delay between batches to prevent UI blocking on mobile
                        if (i + batchSize < imageFiles.length && isMobile) {
                            await new Promise(resolve => setTimeout(resolve, 50));
                        }
                    }
                }

                // Generate the updated zip file with mobile-optimized compression
                const updatedZipBlob = await zip.generateAsync({ 
                    type: "blob",
                    compression: "DEFLATE",
                    compressionOptions: { level: isMobile ? 6 : 9 } // Moderate compression for mobile
                });
                
                // Compression complete
                setUploadStageProgress(100);
                setUploadProgress(30);
                
                globalProcessedChatFileReduced = new File(
                    [updatedZipBlob],
                    globalProcessedChatFile.name,
                    { type: "application/zip" }
                );
                
                // Always apply encryption
                if (password) {
                    try {
                        console.log("Encrypting file with password...");
                        
                        // Update progress to encryption stage
                        setUploadStage("encrypting");
                        setUploadStageProgress(0);
                        setUploadProgress(30); // Start encryption at 30%
                        
                        // Track encryption event
                        ReactGA.event({
                            category: "Encryption",
                            action: "Map Encrypted",
                        });
                        
                        // Simulate encryption progress (since encryptFile doesn't provide progress callbacks)
                        const encryptionProgressInterval = setInterval(() => {
                            setUploadStageProgress(prev => {
                                const newProgress = Math.min(prev + 10, 90);
                                setUploadProgress(30 + Math.round(newProgress * 0.2)); // Encryption is 20% of total (30-50%)
                                return newProgress;
                            });
                        }, 100);
                        
                        const encryptedBlob = await encryptFile(globalProcessedChatFileReduced, password);
                        
                        clearInterval(encryptionProgressInterval);
                        setUploadStageProgress(100);
                        setUploadProgress(50); // Encryption complete
                        
                        globalProcessedChatFileReduced = new File(
                            [encryptedBlob],
                            globalProcessedChatFile.name,
                            { type: "application/encrypted" }
                        );
                    } catch (error) {
                        console.error("Encryption error:", error);
                        setDecryptError("Failed to encrypt the map. Please try again.");
                        return;
                    }
                }
            } else {
                // For image data case (no zip file to compress)
                setUploadStageProgress(100);
                setUploadProgress(30); // Skip compression, go directly to encryption stage
            }

            // Check if we're handling image data or WhatsApp chat data
            let presignedUrl;
            
            // Update progress to uploading stage
            setUploadStage("uploading");
            setUploadStageProgress(0);
            setUploadProgress(50); // Start upload at 50%
            
            // Simulate upload progress
            const uploadProgressInterval = setInterval(() => {
                setUploadStageProgress(prev => {
                    const newProgress = Math.min(prev + 5, 95);
                    setUploadProgress(50 + Math.round(newProgress * 0.5)); // Upload is 50% of total (50-100%)
                    return newProgress;
                });
            }, 200);
            
            if (checkIsImageData()) {
                // Use uploadImageData for image data
                presignedUrl = await uploadImageData(
                    dataDisplayProps.dataset.data,
                    sharingOption,
                    taskId,
                    WhatsAppMapTags,
                    mapperId,
                    setButtonText,
                    setButtonDisabled
                );
            } else {
                // Use uploadProcessedChat for WhatsApp chat data
                presignedUrl = await uploadProcessedChat(
                    globalProcessedChatFileReduced,
                    fileNameWAMap,
                    setButtonText,
                    setButtonDisabled,
                    sharingOption,
                    taskId,
                    WhatsAppMapTags,
                    mapperId
                );
            }
            
            clearInterval(uploadProgressInterval);
            setUploadStageProgress(100);
            setUploadProgress(100); // Upload complete

            // Generate URL without passphrase in it
            let generatedUrl = `https://akaki.whatfire.com/?import=${presignedUrl}`;
            
            setwamapsMapUrl(generatedUrl); // Store the generated URL
            setButtonText("shareDirectly");
            setButtonDisabled(false);

            // Prepare share message text
            let shareTitle = "#MadeWithWAMaps";
            let shareText;
            
            // Choose appropriate message text based on data type
            // Always include password in the share message with a lock and key emoji
            shareText = checkIsImageData()
                ? `This is a private map created with WAMaps. 🔐 The password to open it is: ${password}`
                : `This is a private map created with WAMaps. 🔐 The password to open it is: ${password}`;

            // Handle sharing
            if (navigator.canShare && navigator.share) {
                navigator
                    .share({
                        title: shareTitle,
                        text: shareText,
                        url: generatedUrl,
                    })
                    .catch((error) => console.error("Sharing failed", error))
                    .finally(() => {
                        // Re-enable buttons after sharing attempt
                        setIsUploading(false);
                    });
            } else {
                // Prepare clipboard content and message
                let clipboardContent, alertMessage;
                
                // Always include password in the clipboard content
                clipboardContent = `${generatedUrl}`;
                
                alertMessage = `Map link copied to clipboard! 
                            
� IMPORTANT: Your map is password protected.
🔑 Password: ${password}

(The map can only be accessed with this password)`;
                
                // Copy to clipboard
                navigator.clipboard
                    .writeText(clipboardContent)
                    .then(() => {
                        alert(alertMessage);
                    })
                    .catch((err) => {
                        console.error("Failed to copy link: ", err);
                    })
                    .finally(() => {
                        // Re-enable buttons after clipboard operation
                        setIsUploading(false);
                    });
            }
        } catch (error) {
            console.error("Error during sharing:", error);
            if (error.message?.includes("decrypt")) {
                setDecryptError("Incorrect password. Please try again.");
            } else if (error.message?.includes("Network") || error.message?.includes("fetch") || error.name === "NetworkError") {
                setUploadError("Network error. Please check your connection and try again.");
            } else if (error.message?.includes("too large") || error.message?.includes("size")) {
                setUploadError("Map file is too large to upload. Try reducing image count or quality.");
            } else {
                setUploadError("Upload failed. Please try again.");
            }
            setButtonText("sharedata");
            setButtonDisabled(false);
            setIsUploading(false);
        }
    };

    const handleTaskIdUpload = async () => {
        // Set uploading state
        setIsUploading(true);
        
        // Reset any previous errors
        setTaskIdError("");
        setUploadError("");
        
        // Check if task ID is provided
        if (!taskIdInput || taskIdInput.trim() === "") {
            setTaskIdError("Please enter a Task ID before uploading.");
            setIsUploading(false);
            return;
        }

        // Validate Task ID against allowed value
        const trimmedTaskId = taskIdInput.trim();
        if (!trimmedTaskId.endsWith("30")) { //temporary solution...
            setTaskIdError("This task ID does not exist");
            setButtonText("sharedata");
            setButtonDisabled(false);
            setIsUploading(false);
            return; // Do not upload
        }

        // Clear any previous error before uploading
        setTaskIdError("");

        setButtonText("uploadPending");
        setButtonDisabled(true);
        
        // Initialize progress bar for task ID upload
        setUploadStage("compressing");
        setUploadProgress(0);
        setUploadStageProgress(0);

        try {
            // Prepare file for upload - similar compression process as shareData
            let processedFile = null;

            if (globalProcessedChatFile) {
                // Load zip and compress images efficiently
                const zip = await JSZip.loadAsync(globalProcessedChatFile);
                const filenames = Object.keys(zip.files);
                const imageFiles = filenames.filter(filename => /\.(jpg|jpeg|png|gif)$/i.test(filename));
                
                // Get mobile-optimized settings with dynamic quality
                const dynamicQuality = window.globalImageSizeInfo?.dynamicQuality || qualityPic || 0.25;
                const mobileSettings = getMobileOptimizedSettings(dynamicQuality);
                const { maxWidth, maxHeight, quality, batchSize } = mobileSettings;
                const isMobile = /iPad|iPhone|iPod|android|Mobile/i.test(navigator.userAgent);
                
                // console.log(`Compressing ${imageFiles.length} images for task ID upload:`, mobileSettings);

                // Process images in smaller batches
                let progressCount = 0;
                
                if (imageFiles.length === 0) {
                    // No images to compress
                    setUploadStageProgress(100);
                    setUploadProgress(30);
                } else {
                    for (let i = 0; i < imageFiles.length; i += batchSize) {
                        const batch = imageFiles.slice(i, i + batchSize);
                        console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(imageFiles.length/batchSize)}`);
                        
                        const batchPromises = batch.map(async (filename) => {
                            const file = zip.file(filename);
                            if (file) {
                                try {
                                    const imageBlob = await file.async("blob");
                                    const compressedBlob = await compressImageBlob(imageBlob, quality, maxWidth, maxHeight);
                                    zip.file(filename, compressedBlob);
                                    
                                    progressCount++;
                                    const progress = Math.round((progressCount / imageFiles.length) * 100);
                                    setUploadStageProgress(progress);
                                    setUploadProgress(Math.round(progress * 0.3)); // Compression is 30% of total
                                } catch (error) {
                                    console.warn(`Failed to compress image ${filename}:`, error);
                                }
                            }
                        });
                        
                        await Promise.all(batchPromises);
                        
                        // Small delay between batches on mobile
                        if (i + batchSize < imageFiles.length && isMobile) {
                            await new Promise(resolve => setTimeout(resolve, 50));
                        }
                    }
                }

                // Generate the updated zip file
                const updatedZipBlob = await zip.generateAsync({ 
                    type: "blob",
                    compression: "DEFLATE",
                    compressionOptions: { level: isMobile ? 6 : 9 }
                });
                
                // Compression complete
                setUploadStageProgress(100);
                setUploadProgress(30);
                
                processedFile = new File(
                    [updatedZipBlob],
                    globalProcessedChatFile.name,
                    { type: "application/zip" }
                );
            } else {
                // For image data case (no zip file to compress)
                setUploadStageProgress(100);
                setUploadProgress(30);
            }

            // Update progress to uploading stage (skip encryption for task ID uploads)
            setUploadStage("uploading");
            setUploadStageProgress(0);
            setUploadProgress(30); // Start upload at 30%
            
            // Simulate upload progress
            const uploadProgressInterval = setInterval(() => {
                setUploadStageProgress(prev => {
                    const newProgress = Math.min(prev + 5, 95);
                    setUploadProgress(30 + Math.round(newProgress * 0.7)); // Upload is 70% of total (30-100%)
                    return newProgress;
                });
            }, 200);

            // Check if we're handling image data or WhatsApp chat data
            if (checkIsImageData()) {
                // Use uploadImageData for image data with the task ID
                await uploadImageData(
                    dataDisplayProps.dataset.data,
                    "private", // Default sharing option for task ID uploads
                    trimmedTaskId,
                    WhatsAppMapTags,
                    mapperId,
                    setButtonText,
                    setButtonDisabled
                );
            } else {
                // Use uploadProcessedChat for WhatsApp chat data with the task ID
                await uploadProcessedChat(
                    processedFile || globalProcessedChatFile,
                    (() => {
                        const now = new Date();
                        const date = now.toISOString().split('T')[0].replace(/-/g, '');
                        const time = now
                            .toTimeString()
                            .split(' ')[0] // HH:MM:SS
                            .replace(/:/g, '');
                        const millis = now.getMilliseconds().toString().padStart(3, '0');
                        return `TaskID_${trimmedTaskId}_${date}_${time}_${millis}`;
                    })(),
                    setButtonText,
                    setButtonDisabled,
                    "private", // Default sharing option for task ID uploads
                    trimmedTaskId,
                    WhatsAppMapTags,
                    mapperId
                );
            }

            clearInterval(uploadProgressInterval);
            setUploadStageProgress(100);
            setUploadProgress(100); // Upload complete

            setButtonText("Upload Complete");
            setButtonDisabled(false);
            setIsUploading(false);
            alert(`Map successfully uploaded with Task ID: ${trimmedTaskId}`);
            
        } catch (error) {
            console.error("Error during task ID upload:", error);
            setButtonText("Upload with Task ID");
            setButtonDisabled(false);
            setIsUploading(false);
            
            // Set error state instead of alert
            if (error.message && error.message.includes('network')) {
                setUploadError("Network error. Please check your connection and try again.");
            } else if (error.message && error.message.includes('too large')) {
                setUploadError("File is too large for upload. Please try with fewer images.");
            } else {
                setUploadError("Upload failed. Please try again.");
            }
        }
    };

    const handleDownload = () => {
        console.log(globalProcessedChatFile)
        if (globalProcessedChatFile) {
            const blob = new Blob([globalProcessedChatFile], {
                type: "application/zip",
            });
            function getDateTime() {
                const now = new Date();
                const datePart = now.toISOString().split("T")[0]; // YYYY-MM-DD
                const timePart = now
                    .toTimeString()
                    .split(" ")[0]     // HH:MM:SS
                    .replace(/:/g, "-"); // Replace colons with hyphens
                return `${datePart}_${timePart}`; // YYYY-MM-DD_HH-MM-SS
            }
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            const dateTime = getDateTime();
            // Use different filename for image data vs WhatsApp map
            link.download = checkIsImageData() 
                ? `WAMaps_Private_Map_${dateTime}.zip` 
                : `WAMaps_Private_Map_${dateTime}.zip`;
            link.click();
            URL.revokeObjectURL(url);
        }
    };
    
    const handleHighResClick = () => {
        setHighResButtonText("Available soon");
        setTimeout(() => {
            setHighResButtonText("Need High Resolution?");
        }, 3000);
    };
    
    const handleShareCurrentUrl = () => {

        const shareText = checkIsImageData() 
            ? "This is a Private Map created with WAMaps" 
            : "This is a Private Map created with WAMaps";
        const alertText = checkIsImageData() 
            ? "The Private Map link has been copied to clipboard!" 
            : "The Private Map link has been copied to clipboard!";
            
        if (navigator.canShare && navigator.share) {
            navigator
                .share({
                    title: "#MadeWithWAMaps",
                    text: shareText,
                    url: window.location.href,
                })
                .catch((error) => console.error("Sharing failed", error));
        } else {
            navigator.clipboard
                .writeText(window.location.href)
                .then(() => {
                    alert(alertText);
                })
                .catch((err) => {
                    console.error("Failed to copy link: ", err);
                });
        }
    }
// Converts decimal degrees to Degrees Minutes Seconds (DMS)
function toDMS(decimal, isLatitude) {
    const absolute = Math.abs(decimal);
    let degrees = Math.floor(absolute);
    let minutes = Math.floor((absolute - degrees) * 60);
    let seconds = Math.round((((absolute - degrees) * 60) - minutes) * 60);

    // Adjust if rounding resulted in 60 seconds
    if (seconds === 60) {
        minutes++;
        seconds = 0;
    }
    // Adjust if minutes reach 60 after rounding
    if (minutes === 60) {
        degrees++;
        minutes = 0;
    }

    const direction = isLatitude 
        ? (decimal >= 0 ? "N" : "S") 
        : (decimal >= 0 ? "E" : "W");
        
    return `${degrees}°${minutes}'${seconds}" ${direction}`;
}

// Function to generate CSV and trigger download
const generateCSV = (dataset) => {
    const headers = [
        "latitude",
        "longitude",
        "latitude (DMS)",
        "longitude (DMS)",
        "UTM Zone",
        "UTM Coordinates",
        "image ID",
        "date",
        "observer",
        "observation",
    ];

    // Helper to safely escape CSV values
    const escapeCSV = (value) => {
        if (value === null || value === undefined) return '""';
        return `"${value.toString().replace(/"/g, '""')}"`;
    };

    const rows = dataset.features.map((feature) => {
        const { coordinates } = feature.geometry || {};
        const { imgFilenames, datetime, observer, observations } = feature.properties || {};

        const latDMS = coordinates ? toDMS(coordinates[1], true) : "";
        const lngDMS = coordinates ? toDMS(coordinates[0], false) : "";

        // Convert latitude/longitude to UTM using named import from 'utm'
        const utmData = coordinates ? fromLatLon(coordinates[1], coordinates[0]) : {};
        const utmZone = utmData.zoneNum ? `${utmData.zoneNum}${utmData.zoneLetter}` : "";
        const utmCoordinates = utmData.easting
            ? `${utmData.easting.toFixed(2)}, ${utmData.northing.toFixed(2)}`
            : "";

        return [
            coordinates ? coordinates[1] : "",             // latitude
            coordinates ? coordinates[0] : "",             // longitude
            latDMS,                                        // latitude in DMS
            lngDMS,                                        // longitude in DMS
            utmZone,                                       // UTM Zone
            utmCoordinates,                                // UTM Coordinates
            imgFilenames ? imgFilenames.join(";") : "",     // image ID(s)
            datetime || "",                                // date
            observer || "",                                // observer
            observations || "",                            // observation
        ];
    });

    const csvContent = [headers, ...rows]
        .map((row) => row.map((value) => escapeCSV(value)).join(","))
        .join("\n");

  
    function getDateTime() {
        const now = new Date();
        const datePart = now.toISOString().split("T")[0]; // YYYY-MM-DD
        const timePart = now
            .toTimeString()
            .split(" ")[0]     // HH:MM:SS
            .replace(/:/g, "-"); // Replace colons with hyphens
        return `${datePart}_${timePart}`; // YYYY-MM-DD_HH-MM-SS
    }

    // Example usage in the CSV download file name:
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const dateTime = getDateTime();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `WAMaps_Private_Map_${dateTime}.csv`; // File name now includes date and time
    link.click();
    URL.revokeObjectURL(url);
};

    useClickOutside(shareModalRef, () => {
        if (!isUploading) setIsOpen(false);
    });

    return (

        <div id="sharing-modal" ref={shareModalRef}>
            <button className="modal-close btn" onClick={() => setIsOpen(false)} disabled={isUploading}>
                {closeIcon}
            </button>
            <div className="modal-title">
                {"Share"}
            </div>

            {/* Error Message Display */}
            {(uploadError || decryptError || passwordError || taskIdError) && (
                <div style={{
                    background: '#ffebee',
                    border: '1px solid #f44336',
                    borderRadius: '4px',
                    padding: '12px',
                    margin: '10px 0',
                    color: '#c62828',
                    fontSize: '14px',
                    fontWeight: '500'
                }}>
                    {uploadError || decryptError || passwordError || taskIdError}
                </div>
            )}

            {(importdata || importdataimages || window.location.href.includes("import=")) ? (
                <>
                    {/* Open WhatsApp Map Section */}
                    <section className="modal-section" style={{ textAlign: "center" }}>
                        <div
                            className="checkbox-container"
                            style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "8px" }}
                        >
                             
                            {showPasswordInput && (
                                <div style={{ marginBottom: "-15px" }}>
                                    <div style={{ 
                                        border: "0px solid #25D366", 
                                        borderRadius: "8px", 
                                        padding: "10px", 
                                        marginTop: "5px",
                                        backgroundColor: "transparent",
                                        // boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
                                    }}>
                                        <label style={{ 
                                            fontSize: "1rem", 
                                            fontWeight: "bold",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            color: "#333"
                                        }}>
                                            
                                        </label>
                                        
                                        <p style={{ 
                                            fontSize: "0.95rem", 
                                            margin: "5px 0",
                                            color: "black",
                                            lineHeight: "1.3"
                                        }}>
                                            Create a password for your map 🔐 
                                        </p>
                                        
                                        <div style={{ marginTop: "8px" }}>
                                            <div style={{ marginBottom: "5px" }}>
                                                <input
                                                    type="password"
                                                    placeholder="Create password"
                                                    value={password}
                                                    onChange={(e) => {
                                                        setPassword(e.target.value);
                                                        setPasswordError("");
                                                        setDecryptError(""); // Clear decrypt error when typing
                                                    }}
                                                    style={{ 
                                                        width: "80%", 
                                                        padding: "10px", 
                                                        margin: "0 auto 8px auto",
                                                        border: (passwordError || decryptError) ? "1px solid red" : "1px solid #25D366",
                                                        borderRadius: "4px",
                                                        outline: "none",
                                                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                                                    }}
                                                    autoFocus
                                                    disabled={isUploading}
                                                />
                                            </div>
                                            {(passwordError || decryptError) && (
                                                <p style={{ 
                                                    color: "#e74c3c", 
                                                    fontSize: "0.8rem", 
                                                    marginTop: "4px",
                                                    marginBottom: "4px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "5px"
                                                }}>
                                                    <span>⚠️</span> {passwordError || decryptError}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                          
                        </div>

                    </section>

                 
                    {!showTaskIdUpload && !showPasswordInput ? (
                        <>
                            <div className="option-button-container" style={{ marginBottom: "8px" }}>
                                <button
                                    className="btn"
                                    onClick={() => setShowTaskIdUpload(true)}
                                    style={{ 
                                        height: "40px", 
                                        display: "flex", 
                                        alignItems: "center", 
                                        justifyContent: "center",
                                        fontWeight: "bold",
                                        backgroundColor: "#ffc107",
                                        transition: "none"
                                    }}
                                    disabled={isUploading || !navigator.onLine}
                                >
                                    Upload with taskID
                                </button>
                            </div>

                            <div className="option-button-container" style={{ marginBottom: "8px" }}>
                                <button 
                                    className="btn" 
                                    onClick={handleDownload}
                                    style={{ 
                                        height: "36px", 
                                        display: "flex", 
                                        alignItems: "center", 
                                        justifyContent: "center",
                                        backgroundColor: "white",
                                        transition: "none"
                                    }}
                                    disabled={isUploading}
                                >
                                    {/* Download {dataDisplayProps.dataset && dataDisplayProps.dataset.isImageData ? "Geotagged Images" : "WhatsApp Map"} */}
                                    Download Map
                                </button>
                            </div>
                        
                            <div className="option-button-container" style={{ marginBottom: "8px" }}>
                                <button
                                    className="btn"
                                    onClick={() => generateCSV(currentDataset)}
                                    style={{ 
                                        height: "36px", 
                                        display: "flex", 
                                        alignItems: "center", 
                                        justifyContent: "center" 
                                    }}
                                    disabled={isUploading}
                                >
                                    Download CSV file
                                </button>
                            </div>
                        </>
                    ) : showPasswordInput && !showTaskIdUpload ? (
                        <>
                            {/* High Resolution Button - appears/disappears with password input */}
                            <div className="option-button-container" style={{ marginBottom: "8px", textAlign: "center" }}>
                                <button
                                    className="btn"
                                    onClick={handleHighResClick}
                                    style={{ 
                                        height: "25px", 
                                        width:"170px",
                                        display: "flex", 
                                        alignItems: "center", 
                                        justifyContent: "center",
                                        backgroundColor: "#c8f7dc", // Light green background
                                        fontSize: "0.85rem", // Slightly smaller font
                                        fontWeight: "400",
                                        color: "#333",
                                        margin: "0 auto",
                                        borderRadius: "5px"
                                    }}
                                    disabled={isUploading}
                                >
                                    {highResButtonText}
                                </button>
                            </div>
                            
                            {/* Share Map Link Interface with Password Input */}
                            <div className="option-button-container" style={{ marginBottom: "8px" }}>
                                <button
                                    className="btn"
                                    onClick={() => {
                                        // Proceed with sharing
                                        handleShareDataClick();
                                    }}
                                    style={{ 
                                        height: "40px", 
                                        display: "flex", 
                                        alignItems: "center", 
                                        justifyContent: "center",
                                        backgroundColor: buttonText === "uploadPending" ? "transparent" : "#25D366",
                                        border: buttonText === "uploadPending" ? "none" : undefined,
                                        boxShadow: buttonText === "uploadPending" ? "none" : undefined,
                                        outline: buttonText === "uploadPending" ? "none" : undefined,
                                        opacity: buttonText === "uploadPending" ? "1" : undefined, // Override CSS opacity for upload state
                                        fontWeight: "500"
                                    }}
                                    disabled={isUploading}
                                >
                                    {buttonText === "uploadPending"
                                        ? <ProgressBar 
                                            progress={uploadProgress}
                                            stage={uploadStage}
                                            stageProgress={uploadStageProgress}
                                        />
                                        : buttonText
                                    }
                                </button>
                            </div>

                            <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>
                                <button
                                
                                    className="btn"
                                    onClick={() => {
                                        setTimeout(() => {
                                            setShowPasswordInput(false);
                                            // setPassword("");
                                            setPasswordError("");
                                            setDecryptError("");
                                            // Don't reset buttonText and buttonDisabled here - only reset when modal closes
                                        }, 10);
                                    }}
                                    style={{ marginTop: '10px', height: '35px', width: '85px', backgroundColor: 'transparent', fontSize: "1rem", fontWeight: "bold"} }
                                    disabled={isUploading}
                                >
                                    Go back
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Task ID Upload Interface */}
                            <div style={{ marginBottom: "20px" }}>
                                <div style={{ marginBottom: "10px" }}>
                                    <label style={{ 
                                        fontSize: "1rem", 
                                        // fontWeight: "bold",
                                        display: "block",
                                        marginBottom: "5px",
                                        color: "#333"
                                    }}>
                                        Enter Task ID:
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter your task ID"
                                        value={taskIdInput}
                                        onChange={(e) => { setTaskIdInput(e.target.value); if (taskIdError) setTaskIdError(""); }}
                                        style={{ 
                                            width: "90%", 
                                            padding: "10px", 
                                            border: "1px solid #25D365",
                                            borderRadius: "4px",
                                            outline: "none",
                                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                                        }}
                                        autoFocus
                                        disabled={isUploading}
                                    />
                                    {/* {taskIdError && (
                                        // <p role="alert" aria-live="polite" style={{ color: "#e74c3c", fontSize: "0.95rem", margin: "6px 0 10px" }}>
                                        //     {taskIdError}
                                        // </p>
                                    )} */}
                                    <label style={{ 
                                        fontSize: "1rem", 
                                        // fontWeight: "bold",
                                        display: "block",
                                        marginBottom: "5px",
                                        color: "#333"
                                    }}>
                                        Enter your phone number:
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="Needed for payments!"
                                        value={WhatsAppMapTags}
                                        onChange={(e) => setWhatsAppMapTags(e.target.value)}
                                        style={{ 
                                            width: "90%", 
                                            padding: "10px", 
                                            border: "1px solid #25D365",
                                            borderRadius: "4px",
                                            outline: "none",
                                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                                        }}
                                        disabled={isUploading}
                                    />
                                </div>
                                {/* <p style={{ fontSize: "7px" }}>Only the organisation that sent you this task ID, and the WAMaps system administrator, will be able to see your map data. Public-private key encryption is under development</p> */}
                            </div>

                            <div className="option-button-container" style={{ marginBottom: "8px" }}>
                                <button
                                    className="btn"
                                    onClick={handleTaskIdUpload}
                                    disabled={!taskIdInput || taskIdInput.trim() === "" || isUploading}
                                    style={{ 
                                        height: "40px", 
                                        display: "flex", 
                                        alignItems: "center", 
                                        justifyContent: "center",
                                        backgroundColor: (!taskIdInput || taskIdInput.trim() === "" || isUploading) ? "#ccc" : 
                                                        (buttonText === "uploadPending") ? "transparent" : "#ffc107",
                                        color: (!taskIdInput || taskIdInput.trim() === "" || isUploading) ? "#666" : "#000",
                                        fontWeight: "500",
                                        cursor: (!taskIdInput || taskIdInput.trim() === "" || isUploading) ? "not-allowed" : "pointer",
                                        border: buttonText === "uploadPending" ? "none" : undefined,
                                        boxShadow: buttonText === "uploadPending" ? "none" : undefined,
                                        outline: buttonText === "uploadPending" ? "none" : undefined,
                                        opacity: buttonText === "uploadPending" ? "1" : undefined
                                    }}
                                >
                                    {buttonText === "uploadPending" 
                                        ? <ProgressBar 
                                            progress={uploadProgress}
                                            stage={uploadStage}
                                            stageProgress={uploadStageProgress}
                                        />
                                        : "Click to upload"
                                    }
                                </button>
                            </div>

                            <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>
                                <button
                                    className="btn"
                                    onClick={() => {
                                        setTimeout(() => {
                                            setTaskIdInput("");
                                            setTaskIdError("");
                                            // Don't reset buttonText and buttonDisabled here - only reset when modal closes
                                            setShowTaskIdUpload(false);
                                        }, 10);
                                    }}
                                    style={{ marginTop: '10px', height: '35px', width: '85px', backgroundColor: 'transparent', fontSize: "1rem", fontWeight: "bold" } }
                                    disabled={isUploading}
                                >
                                    Go back
                                </button>
                            </div>
                        </>
                    )}
                    
                    {showInfoContent && (
                        <div style={{ marginTop: "15px", padding: "12px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                            <div style={{ fontSize: "0.8rem", lineHeight: "1.4", color: "#555" }}>
                                <p style={{ marginBottom: "6px" }}>WAMaps is a privacy-focused tool. The maps that you share direcly to your network are password-protected by default with the following security features:</p>
                                <ul style={{ paddingLeft: "18px", marginTop: "6px", marginBottom: "8px" }}>
                                    <li>Client-side encryption using AES-256. Not even the WAMaps team can view your maps.</li>
                                    <li>Only the people that you share the map link AND the password can view your map.</li>
                                    {/* <li>Files automatically expire after 30 days</li> */}
                                    <li>No user registration or personal data collection.</li>
                                    <li>Choose a strong password (minimum 6 characters. 12 recommended) and share it separately from the map link for maximum security.</li>

                                    
                                </ul>
                                <p style={{ marginBottom: "4px" }}>💡 WAMaps compresses the images for faster upload/download. Options to upload higher resolution images is under development. If you need the full resolution you can Download the data and share the zip file using e.g. messaging apps. Alternatively, you can improve the resolution of an image using AI tools like ChatGPT.</p>
                                <p style={{ marginBottom: "4px" }}>Download buttons</p>
                                <ul style={{ paddingLeft: "18px", marginTop: "5px", marginBottom: "8px" }}>
                                    <li>The CSV file contains the coordinates and other map information.</li>
                                    <li>The Map file contains the map data in geoJSON format and the images. To view the map in WAMaps in a PC, drag & drop the zip file. In a mobile, either upload it or select the zip files, then click 'Share' and select WAMaps.</li>
                                    <li>The Map data can directly be imported into QGIS or ArcGIS or other GIS software.</li>
                                    <li>If you need help to process the map data, feel free to reach out to us.</li>
                                </ul>
                            </div>
                            <div style={{ textAlign: "right", marginTop: "15px" }}>
                                {/* <button 
                                    onClick={() => setShowInfoContent(false)}
                                    style={{
                                        backgroundColor: "#25D366",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "4px",
                                        padding: "8px 16px",
                                        fontSize: "0.9rem",
                                        cursor: "pointer"
                                    }}
                                >
                                    Back to sharing options
                                </button> */}
                            </div>
                        </div>
                    )}
                    
                    <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
                        <button 
                            onClick={() => setShowInfoContent(!showInfoContent)}
                            style={{
                                width: "100px",
                                height: "26px",
                                borderRadius: "13px",
                                backgroundColor: "#525553ff",
                                color: "white",
                                border: "none",
                                fontSize: "14px",
                                fontWeight: "bold",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}
                        >
                            {showInfoContent ? "Hide info" : "More info"}
                        </button>
                    </div>
                </>
            ) : (
                <>
                    
                        <div className="modal-content">
                            <p style={{ textAlign: "center" }}>
                                You need to create or load a map before you can share it!
                            </p>
                        </div>

                </>
            )}
        </div>
    );
}

