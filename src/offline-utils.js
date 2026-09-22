/**
 * Offline utilities for WAMaps
 * Provides functions for handling offline functionality and queue management
 */

// Check if the app is currently online
export const isOnline = () => navigator.onLine;

// Queue for storing actions to be performed when back online
const offlineQueue = [];

/**
 * Add an action to the offline queue
 * @param {Object} action - Action to queue (type, data, etc.)
 */
export const queueAction = (action) => {
    const queueItem = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        ...action
    };
    
    offlineQueue.push(queueItem);
    
    // Store in localStorage for persistence
    try {
        localStorage.setItem('wamaps-offline-queue', JSON.stringify(offlineQueue));
        // console.log('Offline: Queued action', action.type);
    } catch (error) {
        console.error('Offline: Failed to store queue', error);
    }
    
    return queueItem.id;
};

/**
 * Process all queued actions when back online
 */
export const processQueue = async () => {
    if (!isOnline() || offlineQueue.length === 0) {
        return;
    }
    
    // console.log(`Offline: Processing ${offlineQueue.length} queued actions`);
    
    const results = [];
    
    while (offlineQueue.length > 0) {
        const action = offlineQueue.shift();
        
        try {
            const result = await processQueuedAction(action);
            results.push({ success: true, action, result });
            console.log('Offline: Processed action', action.type);
        } catch (error) {
            console.error('Offline: Failed to process action', action.type, error);
            results.push({ success: false, action, error });
            
            // Re-queue failed action for retry later
            if (action.retryCount < 3) {
                action.retryCount = (action.retryCount || 0) + 1;
                offlineQueue.push(action);
            }
        }
    }
    
    // Update localStorage
    try {
        localStorage.setItem('wamaps-offline-queue', JSON.stringify(offlineQueue));
    } catch (error) {
        console.error('Offline: Failed to update queue storage', error);
    }
    
    return results;
};

/**
 * Process a single queued action
 * @param {Object} action - The action to process
 */
const processQueuedAction = async (action) => {
    switch (action.type) {
        case 'upload':
            return await processUpload(action.data);
        case 'api-call':
            return await processApiCall(action.data);
        case 'sync-data':
            return await processSyncData(action.data);
        default:
            throw new Error(`Unknown action type: ${action.type}`);
    }
};

/**
 * Process queued upload
 */
const processUpload = async (data) => {
    console.log('Processing queued upload', data.fileName);
    
    // Convert base64 back to file
    const file = await base64ToFile(data.file, data.fileName, data.fileType);
    
    // Import and use the upload function
    const { uploadProcessedChat } = await import('./data_submission.js');
    
    // Create mock setters since we're processing in background
    const mockSetButtonText = (text) => console.log('Upload status:', text);
    const mockSetButtonDisabled = (disabled) => console.log('Button disabled:', disabled);
    
    // Process the upload
    return await uploadProcessedChat(
        file,
        data.fileName,
        mockSetButtonText,
        mockSetButtonDisabled,
        data.sharingOption,
        data.taskId,
        data.WhatsAppMapTags,
        data.wabMapperId
    );
};

// Helper function to convert base64 back to file
function base64ToFile(base64String, fileName, fileType) {
    return new Promise((resolve) => {
        // Remove data URL prefix if present
        const base64 = base64String.split(',')[1] || base64String;
        
        // Convert base64 to bytes
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        const file = new File([byteArray], fileName, { type: fileType });
        
        resolve(file);
    });
}

/**
 * Process queued API call
 */
const processApiCall = async (data) => {
    console.log('Processing queued API call', data);
    
    const response = await fetch(data.url, {
        method: data.method || 'GET',
        body: data.body,
        headers: data.headers
    });
    
    if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
    }
    
    return await response.json();
};

/**
 * Process queued data sync
 */
const processSyncData = async (data) => {
    console.log('Processing queued data sync', data);
    // Implementation for syncing local data changes
    return { synced: true, data };
};

/**
 * Load queued actions from localStorage on app start
 */
export const loadQueue = () => {
    try {
        const stored = localStorage.getItem('wamaps-offline-queue');
        if (stored) {
            const queue = JSON.parse(stored);
            offlineQueue.push(...queue);
            console.log(`Offline: Loaded ${queue.length} queued actions from storage`);
        }
    } catch (error) {
        console.error('Offline: Failed to load queue from storage', error);
    }
};

/**
 * Clear the offline queue
 */
export const clearQueue = () => {
    offlineQueue.length = 0;
    try {
        localStorage.removeItem('wamaps-offline-queue');
        console.log('Offline: Queue cleared');
    } catch (error) {
        console.error('Offline: Failed to clear queue storage', error);
    }
};

/**
 * Get the current queue status
 */
export const getQueueStatus = () => {
    return {
        length: offlineQueue.length,
        items: [...offlineQueue],
        isOnline: isOnline()
    };
};

/**
 * Show user-friendly offline message
 * @param {string} message - Custom message to show
 * @param {number} duration - How long to show the message (ms)
 */
export const showOfflineMessage = (message = "You're offline. This action will be performed when you're back online.", duration = 3000) => {
    // Create a temporary notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #FF6B35;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 10001;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-size: 14px;
        font-weight: bold;
        max-width: 90vw;
        text-align: center;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, duration);
};

// Initialize queue loading when module is imported
loadQueue();
