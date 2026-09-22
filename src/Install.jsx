import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import WAMapsLogo from "./images/icons/favicon.svg";
import { isIOS, isMobileOrTablet } from "./main";
import ReactGA from "react-ga4";

// Function to detect if the user is using Google Chrome
const isGoogleChrome = () => {
	const userAgent = navigator.userAgent.toLowerCase();
	return userAgent.includes('chrome') && !userAgent.includes('edg') && !userAgent.includes('opr');
};

export default function InstallDialog() {
	if (!isMobileOrTablet() || isIOS()) return null; // don't run install prompt on desktop

	const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
	if (isStandalone) return null; // don't run install prompt if already installed

	const { t } = useTranslation();
	const [installPrompt, setInstallPrompt] = useState(null);
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const handleBeforeInstallPrompt = (e) => {
			e.preventDefault(); // Prevent the mini-infobar from appearing on mobile
			setInstallPrompt(e);
		};

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

		let loadTimer;
		const handleLoad = () => {
			// Delay visibility by 2 seconds
			loadTimer = setTimeout(() => setIsVisible(true), 2000);
		};
		window.addEventListener("load", handleLoad);

		return () => {
			window.removeEventListener(
				"beforeinstallprompt",
				handleBeforeInstallPrompt
			);
			window.removeEventListener("load", handleLoad);
			if (loadTimer) clearTimeout(loadTimer);
		};
	}, []);

	const handleInstallClick = async () => {
		ReactGA.event({
			category: "Install",
			action: "Install Clicked",
		});
		if (!installPrompt) return;
		const result = await installPrompt.prompt();
		// if (result.outcome === "dismissed") {
		// 	setIsVisible(false);
		// } else {
		// 	setTimeout(() => {
		// 		setIsVisible(false);
		// 	}, 3000);
		// }
		if (result) {
			setIsVisible(false);
			setInstallPrompt(null);
		}
	};

	const handleCloseClick = () => {
		setIsVisible(false);
		setInstallPrompt(null);
	};

	if (!isVisible) return null;

	// Show different messages based on browser
	const isChrome = isGoogleChrome();
	const promptMessage = isChrome ? t("installPromptChrome") : t("installPrompt");

	return (
		<dialog id="install-dialog">
			<img src={WAMapsLogo}></img>
			<div>{promptMessage}</div>
			<button onClick={handleCloseClick}>{t("dismiss")}</button>
			<button onClick={handleInstallClick}>{t("install")}</button>
		</dialog>
	);
}
