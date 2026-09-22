import React, { useEffect } from "react";
import "./styles/loader.css";
// import { importParam } from "./MainMenu.jsx";

export default function Loader({ isVisible, setIsVisible, importParam }) {
	if (!isVisible) return null;

	useEffect(() => {
		console.log("Loader is visible:importParam", importParam);
		// if (importParam !== null) {

		let timer = setTimeout(() => {
			try {
				setIsVisible(false);
			} catch (error) {
				console.error("Error hiding the loader:", error);
			}
		}, 1800);

	// }

		// Clean up the timer if the component is unmounted or if `isVisible` changes
		return () => clearTimeout(timer);
	}, [isVisible, setIsVisible]);

	return <div id="loader" className="loader"></div>;
}

export function UploadLoader({ isVisible }) {
	console.log("in loader", isVisible);
	if (!isVisible) return null;
	return <div id="upload-loader" className="loader"></div>;
}
