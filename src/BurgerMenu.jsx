import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import StatusBar from "./StatusBar.jsx";
import "./styles/burger-menu.css";
import { chevronDown, exitButtonIcon, GHIcon } from "./icons.js";
import { useClickOutside } from "./utils.js";

export default function BurgerMenu({
	isVisible,
	setIsVisible,
	setIsLoginVisible,
	setIsWelcomeVisible,
}) {
	const [openSection, setOpenSection] = useState(null);
	const burgerRef = useRef(null);

	const toggleSection = (sectionId) => {
		setOpenSection((prevOpenSection) =>
			prevOpenSection === sectionId ? null : sectionId
		);
	};

	const { t } = useTranslation();
	useClickOutside(burgerRef, () => setIsVisible(false));

	return (
		<div
			id="burger-menu"
			className={`${isVisible ? "drawer--open" : "drawer--closed"}`}
			ref={burgerRef}
		>
			<button onClick={() => setIsVisible(false)} className="btn--close-bm">
				{exitButtonIcon}
			</button>
			<StatusBar
				setIsSideMenuVisible={setIsVisible}
				setIsLoginVisible={setIsLoginVisible}
				setIsWelcomeVisible={setIsWelcomeVisible}
			/>
			<div className="bm__content">
				<div>
					<div className="bm__item">
						<div
							className={`bm__item__summary ${openSection === "about" ? "bm__item__summary--active" : ""}`}
							onClick={() => toggleSection("about")}
						>
							{chevronDown} {t("about")}
						</div>
						<div
							className={`bm__item__content ${
								openSection === "about" ? "bm__item__content--open" : ""
							}`}
							dangerouslySetInnerHTML={{ __html: t("aboutContent") }}
						></div>
					</div>
					<div className="bm__item">
						<div
							className={`bm__item__summary ${openSection === "why" ? "bm__item__summary--active" : ""}`}
							onClick={() => toggleSection("why")}
						>
							{chevronDown} {t("why")}
						</div>
						<div
							className={`bm__item__content ${
								openSection === "why" ? "bm__item__content--open" : ""
							}`}
							dangerouslySetInnerHTML={{ __html: t("whyContent") }}
						></div>
					</div>
					<div className="bm__item">
						<div
							className={`bm__item__summary ${openSection === "caseStudies" ? "bm__item__summary--active" : ""}`}
							onClick={() => toggleSection("caseStudies")}
						>
							{chevronDown}
							{t("caseStudies")}
						</div>
						<div
							className={`bm__item__content ${
								openSection === "caseStudies" ? "bm__item__content--open" : ""
							}`}
							dangerouslySetInnerHTML={{ __html: t("caseStudiesContent") }}
						></div>
					</div>
					{/* New "How it works" tab */}
					<div className="bm__item">
						<div
							className={`bm__item__summary ${openSection === "howitworks" ? "bm__item__summary--active" : ""}`}
							onClick={() => toggleSection("howitworks")}
						>
							{chevronDown} How WAMaps works
						</div>
						<div
							className={`bm__item__content ${
								openSection === "howitworks" ? "bm__item__content--open" : ""
							}`}
							style={{ paddingLeft: "1.2em" }}
						>
							<ul style={{ margin: 0 }}>
								
									<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
										<br />

										<span style={{ fontSize: '0.95rem' }}>👉 

										 <a
										 href="https://youtu.be/eAoPmEU1FMs"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            // href="#"
                                            // onClick={(e) => { e.preventDefault(); alert('The 2 min video will be available shortly'); }}
                                        >Watch 4 min. demo video
                                            
                                        </a></span>
										{/* <p>Learn how to instantly turn into maps the photos stored in your phone or in WhatsApp.</p> */}
									</div>
									<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
										<br />

										<span style={{ fontSize: '0.95rem' }}>📱 

										 <a
										//  href="https://youtu.be/vaPHy8S-OpA?si=EXOxgQq1I6_eiR60"
                                        //     target="_blank"
                                        //     rel="noopener noreferrer"
                                            href="#"
                                            onClick={(e) => { e.preventDefault(); alert('The tutorial will be available shortly'); }}
                                        >Tutorial for mappers
                                            
                                        </a></span>
										<p>Learn how to instantly turn into maps the photos stored in your phone or in WhatsApp.</p>
									</div>
								
								<br />
								
									<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
										<span style={{ fontSize: '0.95rem' }}>💻  

                                        <a
										//  href="https://youtu.be/vaPHy8S-OpA?si=EXOxgQq1I6_eiR60"
                                        //     target="_blank"
                                        //     rel="noopener noreferrer"
                                            href="#"
                                            onClick={(e) => { e.preventDefault(); alert('The tutorial will be available shortly'); }}
                                        >Tutorial for organisations
                                          
                                        </a></span>
										<p>The <strong>Free version</strong> allows to visualise and edit one or multiple maps in WAMaps mobile or PC, or export to QGIS, ArcGIS etc.
										<br />
										<br />
                           				The <strong>Pro version</strong> allows to run crowdmapping campaigns with Task IDs, manage large map datasets and use dashboards & AI Agents for advanced visualisation & analysis.</p>
										 <div className="option-button-container">
										<button
											className="btn"
											style={{ backgroundColor: '#25D365', height: '25px',  fontSize: "15px" }}
											onClick={() => {
												window.open("https://form.typeform.com/to/dJ4XaduT", "_blank","noopener noreferrer");
											}}
										>
											Request a Pro Demo
										</button>
                       				 </div>
                                    </div>
								
								
								
							</ul>
						</div>
					</div>
					
					<div className="bm__item">
						<div
							className={`bm__item__summary ${openSection === "people" ? "bm__item__summary--active" : ""}`}
							onClick={() => toggleSection("people")}
						>
							{chevronDown} {t("people")}
						</div>
						<div
							className={`bm__item__content ${
								openSection === "people" ? "bm__item__content--open" : ""
							}`}
							dangerouslySetInnerHTML={{ __html: t("peopleContent") }}
						></div>
					</div>
					<div className="bm__item">
						<div
							className={`bm__item__summary ${openSection === "what" ? "bm__item__summary--active" : ""}`}
							onClick={() => toggleSection("what")}
						>
							{chevronDown}
							{t("what")}
						</div>
						<div
							className={`bm__item__content ${
								openSection === "what" ? "bm__item__content--open" : ""
							}`}
							dangerouslySetInnerHTML={{ __html: t("legalDisclaimer") }}
						></div>
					</div>
				</div>
				<div className="links-disclaimer__wrapper" style={{ textAlign: "center" }}>
					<div className="bm__item" >
						
						<div className="bm__item__text" style={{ marginTop: "0.5rem" }}>
							<p>Have feedback or <br />want to get in touch?</p>
							<button
                            className="btn"
                            onClick={() => {
                                window.open(
                                    "https://form.typeform.com/to/jnnU3B1I",
                                    "_blank",
									"noopener noreferrer"
                                );
                            }}
                            style={{ height: '45px', backgroundColor: '#25D365', fontSize: "15px" }}
                        >
                            Contact us
                        </button>

						</div>
						<br />
						<a
							href="https://github.com/UCL/wamaps/tree/wamaps-v1.0"
							target="_blank"
							rel="noopener noreferrer"
							id="gh"
							className="bm__item__"
						> 
							{GHIcon}
						</a>
						<p style={{fontSize: "12px", color:"black", fontStyle: "italic"}}>WAMaps is open source</p>


					</div>
				</div>
			</div>
		</div>
	);
}
