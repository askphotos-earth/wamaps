import React, { useEffect, useState } from "react";
import { i18next } from "./languages.js";
import ReactDOM from "react-dom/client";
import { FileParser } from "./import_telegram.js";
import { ImageParser } from "./import_images.js";
import { Map } from "./map.js";
import InstallDialog from "./Install.jsx";
import MainMenu from "./MainMenu.jsx";
import Loader from "./Loader.jsx";
import ImageInfoModal from "./ImageInfoModal.jsx";
import "./styles/main.css";
import "./styles/image-popup.css";
import ReactGA from "react-ga4";
import { UserProvider } from "./UserContext.jsx";
import { LoginDialog, WelcomeBackDialog } from "./Login.jsx";
import { ShareModal } from "./mapOverlays.js";

export function isMobileOrTablet (){
    return (
        /iPad|iPhone|iPod|android|Mobile|mini|Fennec|Symbian|Windows Phone|BlackBerry|IEMobile/i.test(
            navigator.userAgent
        ) ||
        (window.innerWidth <= 1024 &&
            ("ontouchstart" in window || navigator.maxTouchPoints > 0))
    );
};

// Mobile-optimized compression settings
export const getMobileOptimizedSettings = (dynamicQuality = null) => {
    const isMobile = /iPad|iPhone|iPod|android|Mobile/i.test(navigator.userAgent);
    const isLowEndDevice = navigator.hardwareConcurrency <= 4 || navigator.deviceMemory <= 4;
    
    // Use dynamic quality if provided, otherwise use default quality
    const quality = dynamicQuality !== null ? dynamicQuality : (isMobile || isLowEndDevice ? 0.6 : 0.75);
    
    if (isMobile || isLowEndDevice) {
        return {
            maxWidth: 200,      // Smaller than desktop (300)
            maxHeight: 200,     // Smaller than desktop (300)
            quality: quality,   // Use dynamic or default quality
            batchSize: 2        // Process fewer images at once
        };
    }
    
    return {
        maxWidth: 300,
        maxHeight: 300,
        quality: quality,
        batchSize: 5
    };
};
export const isIOS = () => {
    return /iPad|iPhone|iPod/i.test(navigator.userAgent);
};
function showBrowserRecommendationIfNeeded() {
    const ua = navigator.userAgent;
    const isMobile = /iPad|iPhone|iPod|android|Mobile|mini|Fennec|Symbian|Windows Phone|BlackBerry|IEMobile/i.test(ua)
        || (window.innerWidth <= 1024 && ("ontouchstart" in window || navigator.maxTouchPoints > 0));
    const isChrome = /Chrome/.test(ua) && !/Edg|OPR|Brave|SamsungBrowser|UCBrowser|CriOS/.test(ua);
    const isEdge = /Edg/.test(ua);

    if (isMobile && !(isChrome || isEdge)) {
        alert("WAMaps works best on Chrome or Edge browsers.");
    }
}

window.addEventListener("DOMContentLoaded", showBrowserRecommendationIfNeeded);

function initServiceWorker(setFileToParse) {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
        // If there is a controller already, this isn't the very first install
        const hadControllerAtStart = !!navigator.serviceWorker.controller;

    const registration = await navigator.serviceWorker.register('/sw.js', {
      updateViaCache: 'none', // fetch a fresh sw.js each time
    });
    console.info('SW registered:', registration);

    // ---- Reload exactly when a NEW controller takes over ----
    let refreshed = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
            // Avoid reload on very first install (no previous controller)
            if (!hadControllerAtStart) return;
            if (refreshed) return;
      refreshed = true;
      // optional: show your toast here
      window.location.reload();
    });

    // If there is already a waiting SW (e.g., app was open during deploy)
    if (registration.waiting) {
      console.log('New version waiting → activating now…');
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    // When a new update is found, ask it to activate ASAP
    registration.onupdatefound = () => {
      const sw = registration.installing;
      if (!sw) return;
      sw.onstatechange = () => {
        if (sw.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('New content installed → requesting activation…');
          sw.postMessage({ type: 'SKIP_WAITING' });
          // DO NOT reload here. Wait for controllerchange.
        }
      };
    };

    // Proactive update checks
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') registration.update();
    });

    // Your existing share-target messaging (kept)
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.action === 'load-map') {
        return setFileToParse(event.data.file);
      } else if (event.data?.action === 'load-images') {
        return setImagesToParse(event.data.files);
      } else if (event.data?.type === 'RELOAD_PAGE') {
        // If you keep SW broadcast (see below), this makes it no-op safe
        if (!refreshed) {
          refreshed = true;
          window.location.reload();
        }
      }
    });

    // Force a check on page load
    (await navigator.serviceWorker.ready).update();

    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage('share-ready');
    }
  });
}


function App() {
    const [fileToParse, setFileToParse] = useState(null);
    const [imagesToParse, setImagesToParse] = useState(null);
    const [imageStats, setImageStats] = useState({ totalProcessed: 0, withLocation: 0 });
    const [isImageInfoVisible, setIsImageInfoVisible] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showOfflineMessage, setShowOfflineMessage] = useState(false);
    const [globalLoadingMessage, setGlobalLoadingMessage] = useState(false);

    useEffect(() => {
        // Initialize GA and SW
        initServiceWorker(setFileToParse);

        ReactGA.initialize("G-JEHLJFG92D");  //disable GA for dev
        
        // Initialize persistent observer name on app startup
        const { initializeObserverName } = require('./import_images.js');
        initializeObserverName();

        // Add online/offline event listeners
        const handleOnline = async () => {
            setIsOnline(true);
            setShowOfflineMessage(false);
            console.log('App: Back online');
            
            // Process any queued actions
            try {
                const { processQueue, getQueueStatus } = await import('./offline-utils.js');
                const queueStatus = getQueueStatus();
                
                if (queueStatus.length > 0) {
                    console.log(`Processing ${queueStatus.length} queued offline actions...`);
                    const results = await processQueue();
                    
                    if (results && results.length > 0) {
                        const successCount = results.filter(r => r.success).length;
                        const failCount = results.length - successCount;
                        
                        let message = `✅ Processed ${successCount} queued actions.`;
                        if (failCount > 0) {
                            message += ` ⚠️ ${failCount} failed and will be retried.`;
                        }
                        
                        // Show temporary success message
                        showTempMessage(message, 'success');
                    }
                }
            } catch (error) {
                console.error('Error processing offline queue:', error);
            }
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowOfflineMessage(true);
            console.log('App: Gone offline');
            // Hide offline message after 5 seconds
            setTimeout(() => setShowOfflineMessage(false), 5000);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []); // Empty dependency array ensures this effect runs once on mount

    // Show loading message when files are set for processing (drag & drop, service worker, URL import)
    useEffect(() => {
        if (fileToParse) {
            console.log('Main app: File set for parsing, showing loading message');
            setGlobalLoadingMessage(true);
        }
    }, [fileToParse]);

    // Show loading message when images are set for processing (drag & drop, service worker)
    useEffect(() => {
        if (imagesToParse && imagesToParse.length > 0) {
            console.log('Main app: Images set for parsing, showing loading message');
            setGlobalLoadingMessage(true);
        }
    }, [imagesToParse]);

    // Hide loading message when map data is ready (removed automatic timeout - now controlled by map render complete)

    // Helper function to show temporary messages
    const showTempMessage = (message, type = 'info', duration = 4000) => {
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? '#4CAF50' : type === 'warning' ? '#FF9800' : '#2196F3';
        
        notification.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10002;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-size: 14px;
            max-width: 300px;
            animation: slideInRight 0.3s ease-out;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Add CSS animations if not already added
        if (!document.getElementById('temp-message-styles')) {
            const style = document.createElement('style');
            style.id = 'temp-message-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, duration);
    };
	
    
    const [isMapVisible, setIsMapVisible] = useState(true); // Always show map
    const [isMenuVisible, setIsMenuVisible] = useState(true); // Show menu for burger and bottom buttons
    const [mapData, setMapData] = useState(null);
    const [isLoaderVisible, setIsLoaderVisible] = useState(true);
    const [isLoginVisible, setIsLoginVisible] = useState(false);
    const [isWelcomeVisible, setIsWelcomeVisible] = useState(false);
    const [showBrand, setShowBrand] = useState(false); // Delay brand visibility

    useEffect(() => {
        setShowBrand(true)
        // const timer = setTimeout(() => setShowBrand(true), 0);
        // return () => clearTimeout(timer);
    }, []);

    const showMap = (showLoader = false) => {
        if (showLoader) setIsLoaderVisible(true);
        setIsMapVisible(true);
    };
    const dataDisplayProps = {
        setMapData,
        showMap,
        setFileToParse,
        setImagesToParse,
    }; // setting these in an object so they're easier to pass and update

    return (
        <UserProvider>
            {/* WAMaps Logo and Brand */}
            {showBrand && !isLoaderVisible && (
                <div style={{
                    position: 'fixed',
                    top: '5px',
                    left: '0px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    zIndex: 9998,
                    backgroundColor: 'transparent',
                    padding: '4px 6px',
                    borderRadius: '8px'
                }}>
                    <span style={{
                        fontSize: '20px',
                        fontWeight: '500',
                        color: '#000000',
                        fontFamily: 'system-ui, -apple-system, sans-serif'
                        }}>
                        <a
                            href="https://askphotos.earth"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'inherit', textDecoration: 'none' }}
                        >
                            askphotos.earth
                        </a>
                        </span>
                </div>
            )}

            {/* Offline indicator */}
            {showOfflineMessage && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#FF6B35',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    zIndex: 10000,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    fontSize: '14px',
                    fontWeight: 'bold'
                }}>
                    📶 You're offline. Some features may be limited.
                </div>
            )}
            
            {/* Connection status indicator (subtle) - only show red dot when offline */}
           <div style={{
                position: 'fixed',
                top: '10px',
                left: '50%',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: isOnline ? 'transparent' : '#FF6B35',
                zIndex: 9999,
                opacity: 0.7
            }} title={isOnline ? 'Online' : 'Offline'} />

            <InstallDialog />
            <Loader isVisible={isLoaderVisible} setIsVisible={setIsLoaderVisible} />
            <LoginDialog
                isVisible={isLoginVisible}
                setIsVisible={setIsLoginVisible}
                setIsWelcomeVisible={setIsWelcomeVisible}
            />
            <WelcomeBackDialog
                isVisible={isWelcomeVisible}
                setIsVisible={setIsWelcomeVisible}
            />
            <MainMenu
                isVisible={isMenuVisible} 
                setIsLoginVisible={setIsLoginVisible}
                setIsWelcomeVisible={setIsWelcomeVisible}
                dataset={mapData}
                globalLoadingMessage={globalLoadingMessage}
                setGlobalLoadingMessage={setGlobalLoadingMessage}
                isLoaderVisible={isLoaderVisible}
                onMapRenderComplete={() => {
                    // For MainMenu initiated uploads, this will be handled by the window callback
                    console.log('MainMenu map render complete callback');
                }}
                {...dataDisplayProps}
            />
            <Map
                isVisible={isMapVisible}
                data={mapData}
                isLoginVisible={isLoginVisible}
                setIsLoginVisible={setIsLoginVisible}
                setMapData={setMapData}
                setFileToParse={setFileToParse}
                setImagesToParse={setImagesToParse}
                showMap={showMap}
                onMapRenderComplete={() => {
                    // Hide loading message when map rendering is complete
                    console.log('Main app: Map rendering complete, hiding global loading message');
                    setGlobalLoadingMessage(false);
                    
                    // Also call any local loading message callback
                    if (window.hideLoadingOnMapRender) {
                        window.hideLoadingOnMapRender();
                        window.hideLoadingOnMapRender = null; // Clean up
                    }
                }}
                {...dataDisplayProps}

            />
            <ShareModal
            {...dataDisplayProps}
            />
            
            {fileToParse && <FileParser 
                file={fileToParse} 
                onComplete={() => {
                    setFileToParse(null);
                    setGlobalLoadingMessage(false);
                }}
                {...dataDisplayProps} 
            />}
            {imagesToParse && imagesToParse.length > 0 && (
                <ImageParser 
                    files={imagesToParse} 
                    onProcessingComplete={(stats) => {
                        setImageStats(stats);
                        setIsImageInfoVisible(true);
                        setGlobalLoadingMessage(false);
                    }}
                    onComplete={() => setImagesToParse(null)}
                    {...dataDisplayProps} 
                />
            )}
            <ImageInfoModal 
                isVisible={isImageInfoVisible}
                setIsVisible={setIsImageInfoVisible}
                imageStats={imageStats}
            />

        </UserProvider>
    );
}

const rootElement = document.getElementById("main");
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);
