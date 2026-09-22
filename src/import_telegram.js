import * as JSZip from "jszip";
import { sha256, slugify } from "./utils.js";
import React, { useEffect, useCallback } from "react";
import { uploadProcessedChat } from "./data_submission.js";
import { setGlobalProcessedChatFile } from "./import_whatsapp.js";



export const colourPalette = [
	"#d0160f",
	"#80bf4d",
	"#b38300",
	"#3aedc5",
	"#c65a00",
	"#5fd789",
	"#9ca303",
	"#36fffd",
];

const getTimestamp = () => {
	// what's this meant to be for?
	var date = new Date();
	var year = date.getFullYear();
	var month = date.getMonth() + 1;
	var day = date.getDate();
	var hours = date.getHours();
	var minutes = date.getMinutes();
	var seconds = date.getSeconds();
	return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
};
var timestamp = getTimestamp();
export let importdata = false; // Track whether FileParser is called
export let enableDownload = false; // To enable download


export function FileParser({ file, onComplete, ...dataDisplayProps }) {
	enableDownload = true
	if(!window.location.href.includes('?import=')){
		importdata = true; // Set to true when FileParser is called from WhatsApp, not from pre-signed URL (to avoid zip file uploads)
	}

	const { setMapData, showMap, setFileToParse } = dataDisplayProps;

	const setDataDisplayMap = useCallback(
		(data, name, imgZip = null) => {
			data = updateMapdata(data, name);

			setMapData({ data: data, imgZip: imgZip });

			showMap(true);
			// Call onComplete callback after parsing is done
			if (onComplete) {
				onComplete();
			}
		},
		[setMapData, showMap, setFileToParse]
	);

	useEffect(() => {
		if (file) {
			processFile(file, setDataDisplayMap);
		}
	}, [file]); // run when file changes

	return null; //don't render anything
}

const updateMapdata = (data, groupName = null) => {
	return {
		...data,
		slug: slugify(groupName || "WAMaps"),
	};
};

export const allowedExtensions = [".zip", ".txt", ".geojson", ".json"];

const processFile = (file, setDataDisplayMap) => {
    if (
        file instanceof File &&
        allowedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
    ) {
        try {
            if (file.name.endsWith(".zip")) {
                const zip = new JSZip();
                zip.loadAsync(file).then(function (contents) {
                    const filenames = Object.keys(contents.files);

                    // Detect GeoJSON file
                    const geojsonFilename = filenames.find((filename) =>
                        filename.match(/.*\.geojson$/i)
                    );

                    // Detect chat file (WhatsApp .txt or Telegram .json)
                    const chatFilename = filenames.find((filename) =>
                        filename.match(/.*\.txt$/i)
                    );
                    
                    // Detect Telegram JSON file (result.json anywhere in path)
                    const telegramJsonFilename = filenames.find((filename) =>
                        filename.toLowerCase().includes('result.json')
                    );
                    
                    console.log("Files in zip:", filenames);
                    console.log("Found Telegram JSON:", telegramJsonFilename);
                    console.log("Found WhatsApp chat:", chatFilename);
                    console.log("Found GeoJSON:", geojsonFilename);
                    
                    // Process Telegram JSON file if it exists (check FIRST before GeoJSON)
                    if (telegramJsonFilename) {
                        console.log(`Found Telegram JSON file: ${telegramJsonFilename}`);
                        zip
                            .file(telegramJsonFilename)
                            .async("string")
                            .then(async function (jsonContent) {
                                console.log("Read Telegram JSON content, length:", jsonContent.length);
                                const [data, name, processedChatFile] = await processTelegramJson(
                                    jsonContent,
                                    zip
                                );
                                
                                console.log("processTelegramJson returned:", { 
                                    hasData: !!data, 
                                    features: data?.features?.length,
                                    name 
                                });
                                
                                if (data && data.features && data.features.length > 0) {
                                    console.log("Calling setDataDisplayMap with", data.features.length, "features");
                                    setDataDisplayMap(data, name, zip);
									setGlobalProcessedChatFile(processedChatFile);
									
									// Calculate and store image size information immediately
									if (window.calculateAndStoreImageSize) {
										window.calculateAndStoreImageSize(processedChatFile);
									}
                                } else {
                                    console.error("No location features created from Telegram export");
                                    alert("No location data found in Telegram chat. Messages need to include location information.");
                                }
                            })
                            .catch(error => {
                                console.error("Error processing Telegram JSON:", error);
                                alert("Error processing Telegram chat: " + error.message);
                            });
                    }
                    // Process GeoJSON file if it exists (and no Telegram JSON)
                    else if (geojsonFilename) {
                        zip
                            .file(geojsonFilename)
                            .async("string")
                            .then(async function (geojsonContent) {
                                try {
                                    const [data, name] = processGeoJson(geojsonContent);
                                    
                                    // Create a new zip file that includes both GeoJSON and all images
                                    const newZip = new JSZip();
                                    
                                    // Add the GeoJSON file
                                    const geojsonBlob = new Blob([geojsonContent], {
                                        type: "application/geo+json",
                                    });
                                    newZip.file("map.geojson", geojsonBlob);
                                    
                                    // Add all image files from the original zip
                                    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.svg'];
                                    for (const filename of filenames) {
                                        const isImage = imageExtensions.some(ext => 
                                            filename.toLowerCase().endsWith(ext)
                                        );
                                        if (isImage && contents.files[filename]) {
                                            const imageData = await zip.file(filename).async("blob");
                                            newZip.file(filename, imageData);
                                        }
                                    }
                                    
                                    // Generate the new zip file as a Blob
                                    const newZipBlob = await newZip.generateAsync({ type: "blob" });
                                    
                                    // Convert the Blob to a File object
                                    const processedFile = new File(
                                        [newZipBlob],
                                        `${name || "processed_map"}.zip`,
                                        { type: "application/zip" }
                                    );
                                    
                                    setDataDisplayMap(data, name, zip);
									setGlobalProcessedChatFile(processedFile);
									
									// Calculate and store image size information immediately
									if (window.calculateAndStoreImageSize) {
										window.calculateAndStoreImageSize(processedFile);
									}

                                } catch (error) {
                                    console.error("Error processing GeoJSON file:", error);
                                }
                            });
                    }
                    // Process WhatsApp chat file if it exists (and no Telegram JSON or GeoJSON)
                    else if (chatFilename) {
                        zip
                            .file(chatFilename)
                            .async("string")
                            .then(async function (fileContent) {
                                const [data, name, processedChatFile] = await processText(
                                    fileContent,
                                    zip
                                );
                                setDataDisplayMap(data, name, zip);
								setGlobalProcessedChatFile(processedChatFile);
								
								// Calculate and store image size information immediately
								if (window.calculateAndStoreImageSize) {
									window.calculateAndStoreImageSize(processedChatFile);
								}

                                // Pass the processedChatFile to the upload function
                                // uploadProcessedChat(processedChatFile, (text) => {
                                //     console.log(text);
                                // }, (disabled) => {
                                //     console.log(disabled);
                                // });
								
                            });
					
                    }
                });
            } else {
                // Handle text, JSON, or GeoJSON files directly
                const reader = new FileReader();
                reader.readAsText(file);
                reader.onloadend = async function (e) {
                    const content = e.target.result;
                    const geoJSONRegex = /^\s*{\s*"type"/;

                    // Process as GeoJSON if the file extension is .geojson or content starts with { "type"
                    if (file.name.endsWith(".geojson") || geoJSONRegex.test(content)) {
                        try {
                            const [data, name] = processGeoJson(content);
                            setDataDisplayMap(data, name);
                        } catch (error) {
                            console.error("Error parsing GeoJSON:", error);
                        }
                    } else if (file.name.endsWith(".json")) {
                        // Process as Telegram JSON
                        try {
                            console.log("Processing standalone Telegram JSON file");
                            const [data, name, processedFile] = await processTelegramJson(e.target.result);
                            if (data && data.features && data.features.length > 0) {
                                console.log(`Successfully processed ${data.features.length} features from ${name}`);
                                setDataDisplayMap(data, name);
                                if (processedFile) {
                                    setGlobalProcessedChatFile(processedFile);
                                    if (window.calculateAndStoreImageSize) {
                                        window.calculateAndStoreImageSize(processedFile);
                                    }
                                }
                            } else {
                                console.error("No location features created from Telegram JSON");
                                alert("No location data found in Telegram chat. Messages need to include location_information.");
                            }
                        } catch (error) {
                            console.error("Error processing standalone Telegram JSON:", error);
                            alert("Error processing Telegram chat: " + error.message);
                        }
                    } else {
                        // Process as WhatsApp text
                        const [data, name] = await processText(e.target.result);
                        setDataDisplayMap(data, name);
                    }
                };
            }
        } catch (error) {
            console.error("Unsupported file or format", error);
        }
    }
};

const getSenderColour = (senders) => {
	// Select a colour depending on number of keys in the object provided
	return colourPalette[Object.keys(senders).length % colourPalette.length];
};

const formatDateString = (date, time) => {
	// Given strings representing a date in various formats (mm/dd/yyyy, dd/mm/yy, etc) and a time in 12 or 24 hour format, including or excluding seconds, return a string in the format YYYY-MM-DDTHH:MM:SS

	// Check if time includes AM/PM to determine the format
	const is12HourFormat =
		time.toLowerCase().includes("am") || time.toLowerCase().includes("pm");
	let hour, min, sec;
	if (is12HourFormat) {
		// Handle 12-hour format
		let [timePart, meridiem] = time.toLowerCase().split(" ");
		[hour, min, sec = "00"] = timePart.split(":");

		// Convert 12-hour to 24-hour format
		if (meridiem === "pm" && hour !== "12") {
			hour = parseInt(hour, 10) + 12;
		} else if (meridiem === "am" && hour === "12") {
			hour = "00";
		}
	} else [hour, min, sec = "00"] = time.split(":"); // 24hr format used already

	// split date string into parts and then determine which is what
	let [part1, part2, part3] = date.split("/");

	let day, month, year;

	if (part1.length === 4) {
		year = part1;
		month = part2;
		day = part3;
	} else if (part3.length === 4) {
		day = part1;
		month = part2;
		year = part3;
	} else {
		// default to dd/mm/yy
		day = part1;
		month = part2;
		year = part3;
	}
	if (year.length === 2) {
		year = "20" + year;
	}

	return `${year}-${month}-${day}T${hour}:${min}:${sec}`;
};

const processGeoJson = (json) => {
	var mapdata = {
		type: "FeatureCollection",
		features: [],
	};
	let groupName;
	var geoJSONData = JSON.parse(json);

	if (geoJSONData.type === "FeatureCollection") {
		mapdata.features = mapdata.features.concat(geoJSONData.features);

		if (geoJSONData.name) groupName = geoJSONData.name;
	}
	return [mapdata, groupName];
};

const cleanMsgContent = (content, location, imgFileRegex) => {
	// replace the edited message marker since it's attached to other content
	content = content.replace(/<This message was edited>/gi, "").trim();
	// Clean remaining content by removing images and location references
	content = content
		.split("\n")
		.map((line) => {
			// go line by line, remove whitespace and remove images and location references, replacing with a placeholder to maintain message structure and organisation
			// placeholder is used to more easily ignore these messages later on (during the map phase) and serves as a template for future artifacts to remove
			// if these are removed the message order is messed up and it's hard to match them up with the correct location and content
			line = line.trim();
			if (location && line.includes(location[0])) {
				// if line contains location, replace with placeholder
				return (location[0] = "\nremove_this_msg\n"); // setting this up for removal later
			}
			if (line.match(imgFileRegex)) {
				// if line contains image reference, replace with placeholder
				return "\nremove_this_msg\n";
			}
			return line;
		})
		.filter(
			(line) =>
				line && // take only non empty lines
				// ignore lines with the following, they aren't included with other content
				!line.includes("image omitted") &&
				!line.includes("<Media omitted>") &&
				!line.includes("This message was deleted") &&
				!line.includes("You deleted this message") &&
				!line.includes(
					"Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them."
				)
		)
		.join("\n");
	content = content.replace(/remove_this_msg\n/g, "");
	content = content.replace(/\n\n\n/g, "\n");
	return content;
};

const processMsgMatches = (messageMatches, imgFileRegex) => {
	// Process each message match, extracting the sender, location and img filenames before cleaning
	// this returns an array of messages
	let messages = [];
	let senders = {};
	messageMatches.forEach((match) => {
		let message = {
			datetime: formatDateString(match[1], match[2]),
			sender: match[3],
			content: match[4],
		};
		// If sender hasn't been seen before, select a colour for them
		if (!Object.keys(senders).includes(message.sender)) {
			senders[message.sender] = getSenderColour(senders);
		}
		var location = locationRegex.exec(message.content);
		if (location) {
			message.location = {
				lat: parseFloat(location[1]),
				long: parseFloat(location[2]),
			};
		}
		let imgFileMatches = [...message.content.matchAll(imgFileRegex)];
		if (imgFileMatches.length > 0) {
			let imgMatches = [];
			for (const match of imgFileMatches) {
				imgMatches.push(match[1]);
			}
			message.imgFilenames = imgMatches;
		}
		message.content = cleanMsgContent(message.content, location, imgFileRegex);
		messages.push(message);
	});
	return [messages, senders];
};

// Regex to match google maps location and capture lat (group 1) and long (group 2)
const locationRegex =
	/https?:\/\/(?:www\.)?maps\.google\.com\/(?:maps\/?\?q=|search\/?\?q=|.*?)?(-?\d+\.\d+),(-?\d+\.\d+)/;

const setImgMsg = (text) => {
	let messageRegex;
	let imgFileRegex;

	// Condition 1: iOS format 
	// Detects formats like: [DD/MM/YYYY, HH:MM:SS]
	if (text.match(/^\[\d{1,2}\/\d{1,2}\/\d{2,4}/)) {
		console.log("Detected iOS chat format.");
		messageRegex =
			/\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s(\d{1,2}:\d{2}:\d{2})\]\s(.*?):\s(.+?)(?=\n\[\d{1,2}\/\d{1,2}\/\d{2,4},\s\d{1,2}:\d{2}:\d{2}\]|Z$)/gs;
		imgFileRegex = /<attached: (\d+-[\w\-_]+\.(?:jpg|jpeg|png|gif))>/gim;
	}
	// Condition 2: Android 24hr format 
	// Detects formats like: DD/MM/YYYY, HH:MM -
	else if (text.match(/^\d{1,2}\/\d{1,2}\/\d{2,4},\s\d{1,2}:\d{2}\s-/)) {
		console.log("Detected Android (24hr) chat format.");
		messageRegex =
			/(\d{1,2}\/\d{1,2}\/\d{2,4}),\s(\d{1,2}:\d{2})\s-\s([^:]+): (.+?)(?=\n\d{1,2}\/\d{1,2}\/\d{2,4},\s\d{1,2}:\d{2}\s-\s|$)/gs;
		imgFileRegex = /([\w\-_]+\.(?:jpg|jpeg|png|gif))>?/gim;
	}
	// ----> NEW CONDITION FOR AM/PM <----
	// Detects formats like: M/D/YY, H:MM AM - by looking for " AM -" or " PM -" in the first 100 characters.
	else if (text.substring(0, 100).match(/\s[AP]M\s-/i)) {
		console.log("Detected Android (AM/PM) chat format.");
		messageRegex =
			/(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s(\d{1,2}:\d{2}(?::\d{2})?\s?[AP]M)\s-\s([^:]+):\s((?:.|\n)*?)(?=\n\d{1,2}\/\d{1,2}\/\d{2,4},?\s\d{1,2}:\d{2}|Z$)/gi;
		imgFileRegex = /\b([\w\-_]*\.(?:jpg|jpeg|png|gif))\s\(file attached\)/gim;
	}
	// Original Else Block - Now a true fallback for unknown formats
	else {
		console.error("Unsupported file format. Could not determine the chat export style. Defaulting to a pattern that will likely fail.");
		// The original default regex is kept here as a last resort.
		messageRegex =
			/(\d{1,4}\/\d{1,2}\/\d{1,4}),?\s(\d{1,2}:\d{2}(?::\d{2})?(?:\s?(?:AM|PM|am|pm))?)?\s-\s(.*?):[\t\f\cK ]((.|\n)*?)(?=(\n\d{1,4}\/\d{1,2}\/\d{1,4})|$)/g;
		imgFileRegex = /\b([\w\-_]*\.(jpg|jpeg|png|gif))\s\(file attached\)/gim;
	}
	return [messageRegex, imgFileRegex];
	
};

const sortMessages = (messages) => {
	// Sort messages by sender, then by datetime
	messages.sort((a, b) => {
		// Compare by sender
		if (a.sender > b.sender) {
			return 1;
		} else if (a.sender < b.sender) {
			return -1;
		} else {
			// If sender is the same, compare by datetime
			if (a.datetime > b.datetime) {
				return 1;
			} else if (a.datetime < b.datetime) {
				return -1;
			} else {
				return 0; // Otherwise maintain relative order
			}
		}
	});
	return messages;
};
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

// Helper function to strip path from filename (like ChatMap does)
const stripPath = (filename) => {
    if (!filename) return "";
    return filename.substring(filename.lastIndexOf("/") + 1);
};

// Helper function to get closest message from same user (ChatMap approach)
const getClosestMessage = (messages, locationIndex, username, chat) => {
    const locationTime = messages[locationIndex].time;
    const TOLERANCE_MS = 30 * 60 * 1000; // 30 minutes in milliseconds
    
    let closestMessage = null;
    let minDelta = TOLERANCE_MS + 1;
    
    // Search backwards and forwards from location message
    for (let i = Math.max(0, locationIndex - 50); i < Math.min(messages.length, locationIndex + 50); i++) {
        if (i === locationIndex) continue; // Skip the location message itself
        
        const msg = messages[i];
        if (msg.username !== username || msg.chat !== chat) continue;
        
        const delta = Math.abs(locationTime - msg.time);
        
        // Only consider messages within tolerance and with content or file
        if (delta < minDelta && delta < TOLERANCE_MS && (msg.file || msg.message)) {
            minDelta = delta;
            closestMessage = msg;
        }
    }
    
    return closestMessage;
};

// Process Telegram JSON export format (following ChatMap's approach)
const processTelegramJson = async (jsonContent, zipInput = null) => {
    console.log("=== Starting processTelegramJson ===");
    try {
        const telegramData = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;
        
        // Extract group name
        const groupName = telegramData.name || "Telegram Chat";
        const messagesArray = telegramData.messages || [];
        
        console.log(`Processing Telegram export with ${messagesArray.length} messages from "${groupName}"`);
        
        // Parse messages into a format similar to ChatMap
        const messages = [];
        messagesArray.forEach((line, index) => {
            if (line.type !== "message") return;
            
            const msgObject = {
                id: index,
                time: new Date(line.date),
                username: line.from || "Unknown",
                chat: groupName,
                message: "",
                file: null,
                location: null
            };
            
            // Extract text content
            if (Array.isArray(line.text_entities)) {
                msgObject.message = line.text_entities
                    .map(entity => typeof entity === 'string' ? entity : entity.text || '')
                    .join('');
            } else if (line.text && line.text !== "") {
                msgObject.message = line.text;
            }
            
            // Extract location
            if (line.location_information) {
                msgObject.location = [
                    line.location_information.latitude,
                    line.location_information.longitude
                ];
                console.log(`Found location in message ${index}:`, msgObject.location);
            }
            
            // Extract media files (strip path like ChatMap does)
            if (line.photo) {
                msgObject.file = stripPath(line.photo);
                msgObject.fileFullPath = line.photo;
            } else if (line.file) {
                const mimeType = line.mime_type || "";
                if (mimeType === "video/mp4" || 
                    mimeType.startsWith("audio/") || 
                    mimeType.startsWith("image/")) {
                    msgObject.file = stripPath(line.file);
                    msgObject.fileFullPath = line.file;
                }
            }
            
            messages.push(msgObject);
        });
        
        console.log(`Parsed ${messages.length} valid messages`);
        
        // Generate anonymous observer names
        const senders = {};
        const shuffledCapitals = [...worldCapitals].sort(() => Math.random() - 0.5);
        const senderToCapital = {};
        
        messages.forEach((msg) => {
            if (!senders[msg.username]) {
                senders[msg.username] = getSenderColour(senders);
            }
        });
        
        const mappingLog = Object.keys(senders).map((sender, i) => {
            const capital = shuffledCapitals[i % shuffledCapitals.length];
            const trimmedSender =
                sender.length >= 4 ? sender.slice(-4) :
                sender.length === 3 ? sender.slice(-3) :
                sender.length === 2 ? sender.slice(-2) :
                sender;
            const observerName = `${capital}-${trimmedSender}`;
            senderToCapital[sender] = observerName;
            return `• ${sender} → ${observerName}`;
        }).join("\n");
        
        console.log("📍 Assigned Capitals to Observers:\n" + mappingLog);
        
        // Create GeoJSON following ChatMap's pairing approach
        const mapdata = {
            type: "FeatureCollection",
            features: []
        };
        
        const pairedMessagesIds = [];
        const imageFilenames = new Set();
        
        // Process each message with a location
        for (let index = 0; index < messages.length; index++) {
            const msgObject = messages[index];
            
            if (!msgObject.location) continue;
            
            // Create feature with location
            const featureObject = {
                type: "Feature",
                properties: {},
                geometry: {
                    type: "Point",
                    coordinates: [msgObject.location[1], msgObject.location[0]] // lon, lat
                }
            };
            
            // Find the closest message from the same user
            const closestMessage = getClosestMessage(
                messages,
                index,
                msgObject.username,
                msgObject.chat
            );
            
            const contribID = await sha256(msgObject.time.toISOString() + msgObject.username);
            
            if (closestMessage && !pairedMessagesIds.includes(closestMessage.id)) {
                // Pair with closest message
                featureObject.properties = {
                    contributionid: contribID,
                    mainattribute: groupName,
                    observations: closestMessage.message || "",
                    observer: senderToCapital[closestMessage.username],
                    datetime: closestMessage.time.toISOString(),
                    imgFilenames: closestMessage.file ? [closestMessage.file] : [],
                    altitude: "not recorded",
                    gpsImgDirection: "not recorded"
                };
                
                if (closestMessage.file && closestMessage.fileFullPath) {
                    imageFilenames.add(closestMessage.fileFullPath);
                }
                
                pairedMessagesIds.push(closestMessage.id);
            } else {
                // No paired message, just location
                featureObject.properties = {
                    contributionid: contribID,
                    mainattribute: groupName,
                    observations: msgObject.message || "",
                    observer: senderToCapital[msgObject.username],
                    datetime: msgObject.time.toISOString(),
                    imgFilenames: msgObject.file ? [msgObject.file] : [],
                    altitude: "not recorded",
                    gpsImgDirection: "not recorded"
                };
                
                if (msgObject.file && msgObject.fileFullPath) {
                    imageFilenames.add(msgObject.fileFullPath);
                }
            }
            
            mapdata.features.push(featureObject);
        }
        
        console.log(`Created ${mapdata.features.length} location features from ${messages.length} messages`);
        
        if (mapdata.features.length === 0) {
            console.warn("No location data found in Telegram messages. Make sure messages have location_information.");
        }
        
        // Create the zip file
        const zip = new JSZip();
        
        // Create the GeoJSON file
        const geojsonBlob = new Blob([JSON.stringify(mapdata, null, 2)], {
            type: "application/geo+json",
        });
        zip.file("map.geojson", geojsonBlob);
        
        // Add images from zip input
        if (zipInput) {
            const filenames = Object.keys(zipInput.files);
            console.log(`Looking for ${imageFilenames.size} images in zip with ${filenames.length} files`);
            
            for (const imageFullPath of imageFilenames) {
                // Find the file in the zip
                const matchingFile = filenames.find(f => 
                    f === imageFullPath || f.endsWith(imageFullPath)
                );
                
                if (matchingFile && !zipInput.files[matchingFile].dir) {
                    console.log(`Found image: ${imageFullPath} at ${matchingFile}`);
                    const fileData = await zipInput.file(matchingFile).async("blob");
                    // Store with just the filename (stripped path) as that's what's in imgFilenames
                    const justFilename = stripPath(imageFullPath);
                    zip.file(justFilename, fileData);
                } else {
                    console.warn(`Image not found in zip: ${imageFullPath}`);
                }
            }
        }
        
        // Generate the zip file as a Blob
        console.log("Generating output zip file...");
        const processedChatBlob = await zip.generateAsync({ type: "blob" });
        
        // Convert the Blob to a File object
        const processedChatFile = new File(
            [processedChatBlob],
            `${groupName || "telegram_chat"}.zip`,
            { type: "application/zip" }
        );
        
        console.log("=== processTelegramJson completed successfully ===");
        return [mapdata, groupName, processedChatFile];
        
    } catch (error) {
        console.error("=== Error in processTelegramJson ===", error);
        console.error(error.stack);
        return [null, null, null];
    }
};

const processText = async (text, zipInput = null) => {
    // Clean the text by removing Unicode control characters
    // [U+200E] is LEFT-TO-RIGHT MARK
    // [U+202C] is POP DIRECTIONAL FORMATTING
    text = text.replace(/[\u200E\u202C]/g, '');

    const groupNameRegex = /"([^"]*)"/;
    const groupNameMatches = text.match(groupNameRegex);
    const groupName = groupNameMatches ? groupNameMatches[1] : null;

	// // Check the first 3 characters to determine the format; iOS and Android
	// const fileType = text.substring(0, 3);
	const [messageRegex, imgFileRegex] = setImgMsg(text);
	// check if the regex was successfully found

		let messageMatches = [...text.matchAll(messageRegex)];
		console.log(`Found ${messageMatches.length} messages using the detected format.`);

		if (messageMatches.length === 0) {
			console.error("The detected format regex did not match any lines in the file. Please check the file content.");
			return [null, null, null];
		}
	// Convert messageMatches to array of JSON objects and then sort
	let [messages, senders] = processMsgMatches(messageMatches, imgFileRegex);
	const shuffledCapitals = [...worldCapitals].sort(() => Math.random() - 0.5);

	const senderToCapital = {};
	const mappingLog = Object.keys(senders).map((sender, i) => {
		const capital = shuffledCapitals[i % shuffledCapitals.length];
		const trimmedSender =
			sender.length >= 4 ? sender.slice(-4) :
			sender.length === 3 ? sender.slice(-3) :
			sender.length === 2 ? sender.slice(-2) :
			sender;
		const observerName = `${capital}-${trimmedSender}`;
		senderToCapital[sender] = observerName;
		return `• ${sender} → ${observerName}`;
	}).join("\n");
	
	console.log("📍 Assigned Capitals to Observers:\n" + mappingLog);
    messages = sortMessages(messages);

    // Now loop through messages to create geojson for each location
    var mapdata = {
        type: "FeatureCollection",
        features: [],
    };
    let currentFeature = null;
    let currentSender = null;

    const createFeature = (message, groupName, contribID) => {
        return {
            type: "Feature",
            properties: {
                contributionid: contribID,
                mainattribute: groupName,
                observations: "",
                observer: senderToCapital[message.sender],
                datetime: message.datetime,
                // markerColour: senders[message.sender],
                imgFilenames: [],
				altitude:"not recorded", // Default value for altitude
                gpsImgDirection: location.gpsImgDirection ? String(location.gpsImgDirection) : "not recorded"
            },
            geometry: message.location
                ? {
                        type: "Point",
                        coordinates: [message.location.long, message.location.lat],
                  }
                : null,
        };
    };

    for (const message of messages) {
		// if the content is valid and there is location or different sender, get the current feature or create a new one and push it to mapdata
		// we assign it to a variable to be sure the validated content is used
		// const contribID = await sha256(message.datetime + message.sender); // hash a unique contrib id, this is difficult under more nesting
        const contribID = await sha256(message.datetime + message.sender);
        if (message.location || message.sender !== currentSender) {
            if (currentFeature && currentFeature.geometry) {
                mapdata.features.push(currentFeature);
            }
            currentFeature = createFeature(message, groupName, contribID);
            currentSender = message.sender;
        }

        if (currentFeature) {
            if (message.imgFilenames) {
                currentFeature.properties.imgFilenames.push(...message.imgFilenames);
            }
            currentFeature.properties.observations += message.content + "\n";
        }
    }
	// Push the last message to mapdataz
    if (currentFeature && currentFeature.geometry) {
        mapdata.features.push(currentFeature);
    }

    // Create the zip file
    const zip = new JSZip();

    // Collect all original image filenames
    const imageFilenames = new Set();

    mapdata.features.forEach((feature) => {
        if (feature.properties.imgFilenames) {
            feature.properties.imgFilenames.forEach((name) => imageFilenames.add(name));
        }
    });

    // Create the GeoJSON file
    const geojsonBlob = new Blob([JSON.stringify(mapdata, null, 2)], {
        type: "application/geo+json",
    });
    zip.file("map.geojson", geojsonBlob);

    // Add images from zip input
    if (zipInput) {
        const filenames = Object.keys(zipInput.files);
        const imgFilenames = filenames.filter((f) => imageFilenames.has(f));

        for (const filename of imgFilenames) {
            const fileData = await zipInput.file(filename).async("blob");
            zip.file(filename, fileData);
        }
    }

    // Generate the zip file as a Blob
    const processedChatBlob = await zip.generateAsync({ type: "blob" });

    // Convert the Blob to a File object
    const processedChatFile = new File(
        [processedChatBlob],
        `${groupName || "processed_chat"}.zip`,
        { type: "application/zip" }
    );

    // Return the map data and the processed chat file
    return [mapdata, groupName, processedChatFile];
};
