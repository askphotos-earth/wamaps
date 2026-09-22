import { useTranslation } from "react-i18next";
import { isOnline, queueAction, showOfflineMessage } from './offline-utils.js';

const API_URL = "https://5jx97xhyvc.execute-api.eu-west-2.amazonaws.com/prod/captallite";
// const BUCKET_BASE_URL = "https://s3.eu-west-2.amazonaws.com/captallite";
const BUCKET_BASE_URL = "https://d2r9z549in6xyk.cloudfront.net";

// Helper function to convert file to base64 for offline storage
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

export async function uploadProcessedChat(file, fileNameWAMap, setButtonText, setButtonDisabled, sharingOption, taskId, WhatsAppMapTags, wabMapperId) {

    // Check if online
    if (!isOnline()) {
        console.log("📴 Device is offline. ");
        
        // // Queue the upload for when we're back online
        // const queueId = queueAction({
        //     type: 'upload',
        //     data: {
        //         file: await fileToBase64(file), // Store as base64 for queuing
        //         fileName: fileNameWAMap,
        //         fileType: file.type,
        //         sharingOption,
        //         taskId,
        //         WhatsAppMapTags,
        //         wabMapperId
        //     }
        // });
        
        // setButtonText("uploadQueued");
        // setButtonDisabled(false);
        
        showOfflineMessage("📴 Device is offline. Share when online");
        
        // Return a temporary offline URL
        // return `offline-queued://${queueId}`;
    }

    setButtonText("uploadPending");
    setButtonDisabled(true);

    try {
        // const taskIdpath = 
    const visibility = "private"; // "private-sensitive", "private-non-sensitive", or "open"
    const taskIdFolder = taskId ? "tasks/"+taskId : "noTaskId"; // To classify data by taskId, and give a value if no value
        const tagsFolder = WhatsAppMapTags || "noMapTags"; // To classify data by tags
        const WABMapperFolder = wabMapperId || "noWabMapperId"; // WhatsApp Mapper ID

        console.log("📦 Sending to /download-url:", {
            fileName: fileNameWAMap,
            visibility,
            taskIdFolder,
            tagsFolder,
            WABMapperFolder
        });

        // Step 1: Request a pre-signed URL from the backend
        const response = await fetchWithRetry(`${API_URL}/upload-url`, {
            method: "POST",
            body: JSON.stringify({
                fileName: fileNameWAMap,
                fileType: file.type,
                visibility,
                taskIdFolder,
                tagsFolder,
                WABMapperFolder
            }),
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) throw new Error("Failed to get pre-signed URL");

        const { presignedUrl } = await response.json();

        // Step 2: Upload the file to S3 using the pre-signed URL
        setButtonText("uploadPending");
        const uploadResponse = await fetchWithRetry(presignedUrl, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type }
        });

        if (!uploadResponse.ok) {
            throw new Error(`S3 upload failed with status ${uploadResponse.status} - ${await uploadResponse.text()}`);
        }

        console.log("✅ File uploaded successfully");

        // Optional handling logic per sharingOption
        // if (sharingOption === "private-sensitive") {
        //     console.log("Handling private-sensitive scenario...");
        // } else if (sharingOption === "private-non-sensitive") {
        //     console.log("Handling private-non-sensitive scenario...");
        // } else if (sharingOption === "open") {
        //     console.log("Handling open scenario...");
        // } else {
        //     console.log("Unknown sharing option. Default behavior.");
        // }
        let downloadUrl;

        if (visibility === "private-sensitive") { //not using it now >> it always goes to "else"
            // Step 3a: Fetch the pre-signed download URL
            const downloadResponse = await fetchWithRetry(`${API_URL}/download-url?fileName=${fileNameWAMap}&visibility=${visibility}&taskIdFolder=${taskIdFolder}&tagsFolder=${tagsFolder}`);

            if (!downloadResponse.ok) throw new Error(`Failed to get download URL: ${await downloadResponse.text()}`);

            const result = await downloadResponse.json();
            downloadUrl = result.presignedUrl;
            console.log("✅ Pre-signed Download URL:", downloadUrl);
        } else {
            // Step 3b: Generate permanent URL manually
            // downloadUrl = `${BUCKET_BASE_URL}/uploads/${visibility}/${taskIdFolder}/${tagsFolder}/${fileNameWAMap}`;
               downloadUrl = `${BUCKET_BASE_URL}/${taskIdFolder}/${tagsFolder}/${fileNameWAMap}`;

            // console.log("🌍 Download URL with prefix rules and referer checks:", downloadUrl);
        }

        setButtonText("uploadReady");
        setButtonDisabled(false);

        return downloadUrl;

    } catch (error) {
        console.error("❌ Upload error:", error);
        
        // If it's a network error and we're offline, queue the upload
        if (!isOnline() && (error.name === 'TypeError' || error.message.includes('fetch'))) {
            console.log("📴 Network error detected. ");
            
            // const queueId = queueAction({
            //     type: 'upload',
            //     data: {
            //         file: await fileToBase64(file),
            //         fileName: fileNameWAMap,
            //         fileType: file.type,
            //         sharingOption,
            //         taskId,
            //         WhatsAppMapTags,
            //         wabMapperId
            //     }
            // });
            
            // setButtonText("uploadQueued");
            // setButtonDisabled(false);
            
            showOfflineMessage("Network error.");
            // return `offline-queued://${queueId}`;
        }
        
        setButtonText("uploadFailed");
        setButtonDisabled(false);
        throw error;
    }
}

// Fetch with retry mechanism for better offline handling
async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            return response;
        } catch (error) {
            console.warn(`Fetch attempt ${i + 1} failed:`, error.message);
            
            if (i === retries - 1) {
                throw error; // Last attempt failed
            }
            
            // Wait before retry with exponential backoff
            await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
    }
}
