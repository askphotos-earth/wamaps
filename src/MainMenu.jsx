import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { i18next, savedLanguage, supportedLanguages } from "./languages.js";
import { FileParser, allowedExtensions } from "./import_whatsapp.js";
import { ImageParser } from "./import_images.js";
import "./styles/menu.css";
import { isIOS, isMobileOrTablet } from "./main.js";
import ReactGA from "react-ga4";
import { ASK_URL } from "../globals.js";
import { LoginDialog, WelcomeBackDialog } from "./Login.jsx";
import Loader from "./Loader.jsx"; // Import Loader component
import checkingPwGif from "./images/checkingPw.gif";
import { decryptFile, decodePassphrase, isFileEncrypted } from "./encryption.js";


function LanguageSelector({ supportedLanguages }) {
    // Get the saved language from localStorage or fallback to i18next language
    const [selectedLanguage, setSelectedLanguage] = useState(() => {
        return savedLanguage || i18next.language;
    });

    // Handle language change
    const handleChange = (event) => {
        // set lang in local storage and il8next
        const newLanguage = event.target.value;
        localStorage.setItem("preferredLanguage", newLanguage);
        i18next.changeLanguage(newLanguage).catch((error) => {
            console.error("Error changing language", error);
        });
        ReactGA.event({
            category: "Language",
            action: "Language Changed",
            label: newLanguage,
        });
        // Update the state to trigger a re-render
        setSelectedLanguage(newLanguage);
    };

    return (
        <select
            value={selectedLanguage}
            onChange={handleChange}
            id="languageSelector"
        >
            {Object.entries(supportedLanguages).map(([key, value]) => (
                <option key={key} value={key}>
                    {value}
                </option>
            ))}
        </select>
    );
}

function Instructions() {
    const { t } = useTranslation();
    return (
        <div
            id="instructions"
            dangerouslySetInnerHTML={{ __html: t("instructions") }}
        ></div>
    );
}

function VideoModal({ isOpen, setIsOpen }) {
    if (!isOpen) return null;

    const { t } = useTranslation();

    useEffect(() => {
        if (isOpen) {
            ReactGA.event({
                category: "Tutorial",
                action: "Tutorial Opened",
            });

            const handleMainClick = () => {
                setIsOpen(false);
                document
                    .querySelector("#main")
                    .removeEventListener("click", handleMainClick);
            };
            document
                .querySelector("#main")
                .addEventListener("click", handleMainClick);
            return () => {
                document
                    .querySelector("#main")
                    .removeEventListener("click", handleMainClick);
            };
        }
    }, [isOpen, setIsOpen]);

    return (
        <div id="video-modal">
            <div className="video-modal__inner">
                <button className="modal-close btn" onClick={() => setIsOpen(false)}>
                    &times;
                </button>
                <iframe
                    id="videoElement"
                    width="99%"
                    height="500px"
                    src={t("tutorialUrl")}
                    allow="autoplay; encrypted-media;"
                    allowFullScreen
                ></iframe>
            </div>
        </div>
    );
}

function RecentMapButton({ showMap }) {
    const { t } = useTranslation();
    return (
        <button
            id="recentBtn"
            className="btn menu-btn"
            onClick={() => showMap(false)}
        >
            {t("viewrecentmap")}
        </button>
    );
}
export function FilePicker({ setLoadingMessage, onMapRenderComplete, ...dataDisplayProps }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState(null);
    const fileInputRef = useRef(null);
    // Remove local loadingMessage state since we'll use the parent's

    const handleFileChange = (event) => {
        console.log("File input change detected:", event.target.files?.length, "files");
        
        // Check if any files were selected
        if (!event.target.files || event.target.files.length === 0) {
            console.log("No files selected");
            return;
        }
        
        // Check if multiple image files are selected
        if (event.target.files.length > 1 && 
            Array.from(event.target.files).every(file => file.type.startsWith('image/'))) {
            // Handle multiple image files
            console.log("Multiple image files selected:", event.target.files.length);
            const files = Array.from(event.target.files);
            setSelectedFiles(files);
            setLoadingMessage(true); // Show the loading message
        } else {
            // Handle single file (original behavior)
            const file = event.target.files[0];
            console.log("Single file selected:", file?.name, file?.type);
            if (file) {
                if (file.type.startsWith('image/')) {
                    console.log("Single image file selected, treating as image");
                    setSelectedFiles([file]); // Treat single image as an array for ImageParser
                } else {
                    console.log("Non-image file selected, using WhatsApp parser");
                    setSelectedFile(file);
                }
                setLoadingMessage(true); // Show the loading message
            }
        }
        event.target.value = null; // Clear the input value
    };

    const handleFilePick = () => {
        fileInputRef.current.click();
    };

    const { t } = useTranslation();
    return (
        <>
            <input
                type="file"
                accept={isMobileOrTablet() && !isIOS() ? "image/*" : allowedExtensions.join(",")}
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileChange}
                multiple
            />
            <button id="filePickerButton" onClick={handleFilePick}>
                {isMobileOrTablet() && !isIOS() ? t("selectImages") : t("selectFile")}
            </button>
            {selectedFile && (
                <FileParser
                    file={selectedFile}
                    {...dataDisplayProps}
                    onComplete={() => {
                        setSelectedFile(null); // Reset selected file
                        setLoadingMessage(false); // Hide the loading message
                        console.log('FileParser completed, hiding loading message');
                    }}
                />
            )}
            {selectedFiles && selectedFiles.length > 0 && (
                <ImageParser
                    files={selectedFiles}
                    {...dataDisplayProps}
                    setLoadingMessage={setLoadingMessage}
                    onMapRenderComplete={onMapRenderComplete}
                    onProcessingComplete={(stats) => {
                        // Don't hide loading message here - let the map rendering complete first
                        console.log('ImageParser processing completed, but keeping loading message until map renders', stats);
                    }}
                    onComplete={() => {
                        setSelectedFiles(null); // Reset selected files
                        // Don't hide loading message here - let the map rendering complete first
                        console.log('ImageParser completed, but keeping loading message until map renders');
                    }}
                />
            )}
        </>
    );
}

function ButtonArea({ hasCurrentDataset, showMap }) {
    const [isOpen, setIsVideoOpen] = useState(false);

    const { t } = useTranslation();

    return (
        <>
            <VideoModal isOpen={isOpen} setIsOpen={setIsVideoOpen} />
            <div className="button-area">
                <button
                    id="tutorialBtn"
                    onClick={() => setIsVideoOpen(true)}
                    className="btn menu-btn"
                >
                    {t("watchtutorial")}
                </button>

                <button
                    id="helpBtn"
                    className="btn menu-btn"
                    onClick={() => {
                        ReactGA.event({
                            category: "Help",
                            action: "Help Button Clicked",
                        });
                        window.location.href = ASK_URL;
                    }}
                >
                    {t("asktheteam")}
                </button>

                {/* show recent map */}
                {hasCurrentDataset && <RecentMapButton showMap={showMap} />}
            </div>
        </>
    );
}

function Copyright() {
    const { t } = useTranslation();
    return <div id="copyright">{t("copyright")}</div>;
}

export default function MainMenu({
    isVisible,
    setIsLoginVisible,
    setIsWelcomeVisible,
    dataset,
    globalLoadingMessage,
    setGlobalLoadingMessage,
    isLoaderVisible: mainIsLoaderVisible,
    onMapRenderComplete,
    ...dataDisplayProps
}) {
    const [isLoaderVisible, setIsLoaderVisible] = useState(false); // State for loader visibility
    // const [importParam, setImportParam] = useState(null); // State for importParam
    const [loadingMessage, setLoadingMessage] = useState(false); // State for loading message visibility
    const [errorMessage, setErrorMessage] = useState(null); // State for error message



    const [decryptionPassword, setDecryptionPassword] = useState("");
    const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
    const [encryptedBlob, setEncryptedBlob] = useState(null);
    const [decryptionError, setDecryptionError] = useState("");
    const [isDecrypting, setIsDecrypting] = useState(false);
    const [shakeAnimation, setShakeAnimation] = useState(false);

    const handleButtonClick = async () => {
        try {
            setIsLoaderVisible(true); // Show loader
            const urlParams = new URLSearchParams(window.location.search);
            const importParam = urlParams.get('import');
            
            console.log('Import URL:', importParam);

            if (!importParam) {
                throw new Error('No import URL found in query.');
            } else {
                setLoadingMessage(true); // Show the loading message
            }

            const decodedUrl = decodeURIComponent(importParam);
            console.log('Decoded import URL:', importParam);

            const response = await fetch(importParam);
            if (!response.ok) {
                console.error('Fetch Response Status:', response.status);
                console.error('Fetch Response Headers:', response.headers);
                
                const timer = setTimeout(() => {
                    setErrorMessage("This map URL has expired");
                }, 2000);
                throw new Error(`Fetch error! Status: ${response.status}`);
            }

            const blob = await response.blob();
            
            // Use our utility function to check if the file is encrypted
            const isEncrypted = await isFileEncrypted(blob);
            
            if (isEncrypted) {
                // For encrypted files, show the password prompt
                console.log("Encrypted file detected, showing password prompt");
                setEncryptedBlob(blob);
                setShowPasswordPrompt(true);
                ReactGA.event({
                    category: "Encryption",
                    action: "Decrypt Prompt Shown",
                });
                return;
            } else {
                // Not encrypted, process normally
                const file = new File([blob], 'import.zip', { type: 'application/zip' });
                dataDisplayProps.setFileToParse(file);
            }
        } catch (error) {
            console.error('Error fetching or uploading file:', error);
        } finally {
            if (!showPasswordPrompt) {
                setIsLoaderVisible(false); // Hide loader
                setLoadingMessage(false); // Hide the loading message
                console.log('Loader hidden');
            }
        }
    };
    
    const handleDecryptionSubmit = async () => {
        if (!decryptionPassword || !encryptedBlob) {
            setDecryptionError("Please enter a password.");
            setShakeAnimation(true);
            setTimeout(() => setShakeAnimation(false), 600);
            return;
        }
        
        setDecryptionError("");
        setIsDecrypting(true);
        setIsLoaderVisible(true);
        
        // Track decryption attempt
        ReactGA.event({
            category: "Encryption",
            action: "Decryption Attempted",
        });
        
        try {
            // Small delay to show the loading state
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Wrap the decryption in a try-catch to specifically catch decryption errors
            let decryptedBlob;
            try {
                decryptedBlob = await decryptFile(encryptedBlob, decryptionPassword);
            } catch (decryptError) {
                console.error("Decryption error:", decryptError);
                throw new Error("Decryption failed: Wrong password");
            }
            
            // Only proceed if decryption was successful
            try {
                const file = new File([decryptedBlob], 'import.zip', { type: 'application/zip' });
                
                // Add an event handler to catch any errors during file parsing
                const originalSetFileToParse = dataDisplayProps.setFileToParse;
                const wrappedSetFileToParse = async (fileToProcess) => {
                    try {
                        // Attempt to validate the zip file first
                        const jsZip = await import('jszip');
                        await jsZip.default.loadAsync(fileToProcess);
                        
                        // If we get here, the zip file is valid
                        originalSetFileToParse(fileToProcess);
                        
                        // Only close the password prompt on successful decryption
                        setShowPasswordPrompt(false);
                        
                        // Track successful decryption
                        ReactGA.event({
                            category: "Encryption",
                            action: "Decryption Successful",
                        });
                    } catch (zipError) {
                        console.error("ZIP validation error:", zipError);
                        throw new Error("Wrong password. The decrypted file is not a valid map.");
                    }
                };
                
                // Try to process the file
                await wrappedSetFileToParse(file);
            } catch (fileError) {
                console.error("File processing error:", fileError);
                throw new Error("Invalid map data. The password may be incorrect.");
            }
        } catch (error) {
            console.error("Operation failed:", error);
            // Show error message but keep the modal open
            setDecryptionError("Wrong password. Please try again.");
            setIsDecrypting(false);
            setIsLoaderVisible(false);
            
            // Trigger shake animation
            setShakeAnimation(true);
            setTimeout(() => setShakeAnimation(false), 600); // Animation duration
            
            // Track failed decryption
            ReactGA.event({
                category: "Encryption",
                action: "Decryption Failed",
                label: error.message,
            });
        } finally {
            setIsDecrypting(false);
            setIsLoaderVisible(false);
            setLoadingMessage(false);
        }
    };

    useEffect(() => {
        if (window.location.search.includes('?import=')) {
            console.log('Import URL detected in query.');
            handleButtonClick();
        } else {
            dataDisplayProps.showMap(true); // Show map if no import URL
        }
    }, []);

    if (!isVisible) return null;

    return (
        <>
            {(loadingMessage || globalLoadingMessage) && !mainIsLoaderVisible && (
                <div
                id="loadingMessage"
                className="loading-message"
                style={{
                  backgroundColor: "#25D365",
                  color: "white",
                  padding: "1rem",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.5rem",
                  position: "fixed",
                  top: "20%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex: 10001,
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                }}
              >

                <span style={{color: "#3a3a3a"}}>Your Map is loading. This might take a few seconds.</span>
                <img
                  src={checkingPwGif}
                  alt="Loading animation"
                  style={{ width: "40px", height: "40px" }}
                />
              </div>
            )}
            
            {/* Password Prompt Dialog */}
            {showPasswordPrompt && (
                <div className="password-prompt" style={{ 
                    position: 'fixed', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'white',
                    padding: '25px',
                    borderRadius: '12px',
                    boxShadow: '0 6px 30px rgba(0,0,0,0.25)',
                    zIndex: 9999,
                    width: '70%',
                    maxWidth: '400px',
                    textAlign: 'center',
                    fontFamily: 'sans-serif'
                }}>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        marginBottom: '15px'
                    }}>
                        <span style={{ 
                            marginRight: '10px', 
                            fontSize: '20px', 
                            color: '#555'
                        }}>🔒</span>
                        <h3 style={{ 
                            margin: 0, 
                            color: '#333', 
                            fontWeight: '600' 
                        }}>This WAMaps map is password protected</h3>
                    </div>
                    
                    <p style={{ 
                        marginBottom: '20px', 
                        color: '#666', 
                        fontSize: '15px'
                    }}>
                        Enter the password that was shared with you to view the map:
                    </p>
                    
                    <div style={{ marginBottom: '20px' }}>
                        <input 
                            type="password"
                            placeholder="Enter password"
                            value={decryptionPassword}
                            onChange={(e) => {
                                setDecryptionPassword(e.target.value);
                                if (decryptionError) setDecryptionError("");
                            }}
                            className={shakeAnimation ? 'shake-animation' : ''}
                            style={{ 
                                width: '100%', 
                                padding: '12px',
                                borderRadius: '6px',
                                border: decryptionError ? '2px solid #e74c3c' : '1px solid #ddd',
                                marginBottom: '5px',
                                fontSize: '15px',
                                boxSizing: 'border-box',
                                outline: 'none',
                                transition: 'border 0.2s ease'
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !isDecrypting) {
                                    handleDecryptionSubmit();
                                }
                            }}
                            disabled={isDecrypting}
                            autoFocus
                        />
                        {decryptionError && (
                            <p style={{ 
                                color: '#e74c3c', 
                                fontSize: '14px', 
                                textAlign: 'left', 
                                margin: '8px 0 0 0',
                                display: 'flex',
                                alignItems: 'center',
                                backgroundColor: '#ffeeee',
                                padding: '8px 12px',
                                borderRadius: '4px',
                                border: '1px solid #e74c3c',
                                fontWeight: '600',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                            }}>
                                <span style={{ marginRight: '8px', fontSize: '16px' }}>⚠️</span> {decryptionError}
                            </p>
                        )}
                        
                        <p style={{ 
                            fontSize: '13px', 
                            color: '#888', 
                            marginTop: '15px', 
                            textAlign: 'left',
                            fontStyle: 'italic'
                        }}>
                            This password was set by the person who shared this map with you.<br></br> The images have been compressed to reduce loading time. We're working to improve the images resolution while keeping the loading time low. 
                        </p>
                    </div>
                    
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        marginTop: '10px' 
                    }}>
                        <button 
                            onClick={() => {
                                setShowPasswordPrompt(false);
                                setEncryptedBlob(null);
                                setDecryptionPassword("");
                                setDecryptionError("");
                                setIsLoaderVisible(false);
                                setLoadingMessage(false);
                                window.history.pushState({}, document.title, window.location.pathname);
                            }}
                            style={{ 
                                padding: '10px 15px',
                                backgroundColor: '#f1f1f1',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: isDecrypting ? 'not-allowed' : 'pointer',
                                fontWeight: '500',
                                fontSize: '14px',
                                opacity: isDecrypting ? 0.7 : 1
                            }}
                            disabled={isDecrypting}
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleDecryptionSubmit}
                            style={{ 
                                padding: '10px 20px',
                                backgroundColor: '#25D366',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: isDecrypting ? 'not-allowed' : 'pointer',
                                fontWeight: '500',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: '100px',
                                transition: 'background-color 0.2s ease',
                                opacity: isDecrypting || !decryptionPassword ? 0.7 : 1
                            }}
                            disabled={isDecrypting || !decryptionPassword}
                        >
                            {isDecrypting ? (
                                <>
                                    <img
                                        src={checkingPwGif}
                                        alt="Decrypting"
                                        style={{ 
                                            width: '20px', 
                                            height: '20px',
                                            marginRight: '8px'
                                        }}
                                    />
                                    Decrypting...
                                </>
                            ) : "Unlock Map"}
                        </button>
                    </div>
                    
                    {/* Clear visual indication for incorrect password attempts */}
                    {decryptionError && (
                        <div style={{ 
                            width: '100%', 
                            height: '4px', 
                            backgroundColor: '#e74c3c',
                            position: 'absolute',
                            bottom: '0',
                            left: '0',
                            borderBottomLeftRadius: '12px',
                            borderBottomRightRadius: '12px'
                        }}></div>
                    )}
                </div>
            )}
            
            {errorMessage && (
                <div className="error-message" style={{top:"300px",backgroundColor: "#3a3a3a",color: "white",textAlign: "center", }}>
                    This map URL has expired or an error occured.
                <button
                  
                    className="error-click"
                    style={{top:"140px",width:"180px",color: "#3a3a3a",textAlign: "center", }}
                    onClick={() => {
                        const message = `Hi, please send me the new link for this map ${window.location.href}`;
                        const encodedMessage = encodeURIComponent(message); // Encode the message
                        const whatsappUrl = `https://form.typeform.com/to/jnnU3B1I`;
                        window.open(whatsappUrl, "_blank"); // Open the WhatsApp URL
                        }}

                >
                    Contact us
                </button>
                <button
                   
                    className="error-exit"
                    style={{top:"240px",width:"180px",color: "#3a3a3a",textAlign: "center", }}
                    onClick={() => {
                        setErrorMessage(null); // Hide the error message
                        }}

                >
                    Continue without the map
                </button>
                </div>
            )}
            <Loader
                isVisible={isLoaderVisible}
                setIsVisible={setIsLoaderVisible}
                // importParam={importParam}
            />
            <div id="menuContainer">
                {/* Enable FilePicker for all devices */}
                <FilePicker setLoadingMessage={setLoadingMessage} onMapRenderComplete={onMapRenderComplete} {...dataDisplayProps} />
            </div>
        </>
    );
}
