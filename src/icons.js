import { library, icon } from "@fortawesome/fontawesome-svg-core";
import React from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
	faChevronDown,
	faChevronUp,
	faImage,
	faShareNodes,
	faFileCode,
	faFileCirclePlus,
	faForwardStep,
	faCloudArrowUp,
	faLocationCrosshairs,
	faSun,
	faMoon,
	faArrowLeft,
	faX,
	faThumbsUp,
	faMessage,
	faBars,
	faInfoCircle,
	faLayerGroup,
	faPlus,
	faArrowUpRightFromSquare,
	faLocationDot,
	faEdit,
	faTrash,
	// faWhatsapp,
} from "@fortawesome/free-solid-svg-icons";
import {
	faCircleDot,
} from "@fortawesome/free-regular-svg-icons";

import { faGithub } from "@fortawesome/free-brands-svg-icons/faGithub";
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons/faWhatsapp';
import WAMapsMarker from "./images/WAMapsMarker.png"; // Import the image
import WAMapsMapper from "./images/logo_corner.svg"; // Import the image
import KBusinessIcon from "./images/connect.png"; // Import the image
import shareicon from "./images/shareicon.png"; // Import the image
import createicon from "./images/createicon.png"; // Import the image
import premiumicon from "./images/premiumicon.png"; // Import the image
import gpsPositionIcn from "./images/gpsPositionIcn.png"; // Import the image


// Add fontawesome icons to library
library.add(
	faChevronDown,
	faChevronUp,
	faImage,
	faShareNodes,
	faFileCode,
	faFileCirclePlus,
	faForwardStep,
	faCloudArrowUp,
	faLocationCrosshairs,
	faSun,
	faMoon,
	faArrowLeft,
	faCircleDot,
	faX,
	faThumbsUp,
	faMessage,
	faBars,
	faGithub,
	faInfoCircle,
	faLayerGroup,
	faWhatsapp,
	faPlus,
	faArrowUpRightFromSquare,
	faLocationDot,
	faEdit,
	faTrash
);
// we use .btn-icon but there is no global styling for it, only ever nested,
// which allows for easy selecting and flexible styling
export const chevronDown = <FontAwesomeIcon icon={faChevronDown} />;
export const chevronUp = <FontAwesomeIcon icon={faChevronUp} />;
export const nextIcn = <FontAwesomeIcon icon={faForwardStep} />;
export const imageIcn = <FontAwesomeIcon icon={faImage} className="btn-icon" />;
// export const shareIcn = <FontAwesomeIcon icon={faShareNodes} style={{ color: "#3a3a3a" }} />;
// export const createIcn = <FontAwesomeIcon icon={faPlus} style={{ color: "#3a3a3a" }} />;
// export const premiumIcn = <FontAwesomeIcon icon={faArrowUpRightFromSquare} style={{ color: "#3a3a3a" }} />;


export const dataIcn = (
	<FontAwesomeIcon icon={faFileCode} className="btn-icon" />
);
export const addMetaIcn = (
	<FontAwesomeIcon
		icon={faFileCirclePlus}
		style={{ fontSize: "0.75rem" }}
		className="btn-icon"
	/>
);
export const uploadIcn = (
	<FontAwesomeIcon icon={faCloudArrowUp} className="btn-icon" />
);
export const WhatAppMapper = <FontAwesomeIcon icon={faWhatsapp} style={{ color: "#25D365" }}/>;

export const GPSIcn = <FontAwesomeIcon icon={faLocationCrosshairs} style={{ color: "#3a3a3a" }}/>;
export const basemapSatIcon = <FontAwesomeIcon icon={faLayerGroup} style={{ color: "#3a3a3a" }}/>;
export const basemapGMapsIcon = <FontAwesomeIcon icon={faLayerGroup} style={{ color: "#3a3a3a" }}/>;
export const exitButtonIcon = (
	<FontAwesomeIcon icon={faArrowLeft} className="btn-icon" />
);
export const GPSPositionIcn = `
  <img
    src="${gpsPositionIcn}"
    alt="GPS Position"
    style="width: 30px; height: 30px;"
  />
`;
export const WhatAppMapMarkerPosition = `
  <img
    src="${WAMapsMarker}"
    alt="WAMaps Marker"
    style="width: 35px; height: 35px;"
  />
`;

export const WhatAppMapperPosition = `
  <img
    src="${WAMapsMapper}"
    alt="WAMaps Mapper"
    style="width: 30px; height: 30px;"
  />
`;
export const closeIcon = <FontAwesomeIcon icon={faX} className="btn-icon" />;
// export const connectIcon = <FontAwesomeIcon icon={faWhatsapp} className="btn-icon" />;
export const connectIcon =   (
	<img
		src={KBusinessIcon}
		alt="WhatsApp Business Icon"
		style={{ width: "28px", height: "28px" }}
	/>
);
export const shareIcn =   (
	<img
		src={shareicon}
		alt="Share Icon"
		style={{ width: "22px", height: "22px" }}
	/>
);
export const createIcn =   (
	<img
		src={createicon}
		alt="Create Icon"
		style={{ width: "22px", height: "22px" }}
	/>
);
export const premiumIcn =   (
	<img
		src={premiumicon}
		alt="Premium Icon"
		style={{ width: "22px", height: "22px" }}
	/>
);

export const thumbsUpIcon = (
	<FontAwesomeIcon icon={faThumbsUp} className="btn-icon" />
);
export const msgIcon = (
	<FontAwesomeIcon icon={faMessage} className="btn-icon" />
);

// Edit and Delete icons
export const editIcon = (
	<FontAwesomeIcon icon={faEdit} style={{ color: "#000000", fontSize: "14px" }} />
);
export const deleteIcon = (
	<FontAwesomeIcon icon={faTrash} style={{ color: "#dc3545", fontSize: "14px" }} />
);

// menu
export const menuIcon = <FontAwesomeIcon icon={faBars} style={{ backgroundColor: "#25D365", border:"1px solid #2d2c2c",padding: "8px", borderRadius: "8px",  boxSizing: "content-box"}}/>;
export const GHIcon = <FontAwesomeIcon icon={faGithub} style={{ color: "black" }} />;
