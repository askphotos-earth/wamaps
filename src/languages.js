import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { ASK_URL } from "../globals";

const supportedLanguages = {
	en: "🇬🇧 English",
	es: "🇪🇸 Español",
	fr: "🇫🇷 Français",
	pt: "🇵🇹 Português",
	am: "🇪🇹 አማርኛ",
	yo: "🇳🇬 Yorùbá",
};
export const savedLanguage = localStorage.getItem("preferredLanguage") || "en";
const youtubeOpts = "?rel=0&autoplay=1";
const whatsappMapsUrl =
	"https://uclexcites.blog/2024/06/26/whatsapp-maps-connecting-users-and-producers-of-ground-information/";
const ethio2023 =
	"https://uclexcites.blog/2023/09/03/wisdom-of-the-crowd-in-the-age-of-ai-water/";
const GibraltarUrl =
	"https://pinea.app.carto.com/map/9d9efa9e-5ca4-4cbb-9a5a-99ee9de11238";
const firstwhatsappMapsUrl =
	"https://www.ucl.ac.uk/geography/news/2024/dec/first-ever-whatsapp-map";
const whatsappMapsUrlSpanish =
	"https://uclexcites-blog.translate.goog/2024/06/26/whatsapp-maps-connecting-users-and-producers-of-ground-information/?_x_tr_sl=auto&_x_tr_tl=es&_x_tr_hl=en-US&_x_tr_pto=wapp";

const extremeCitizenUrl = "https://uclexcites.blog/2021/07/21/land-use-messaging-mapping-for-collaborative-climate-smart-agriculture-in-south-west-nigeria-the-ecsagri-pilot-project/";
const excitesUrl = "https://www.ucl.ac.uk/geography/research/research-centres/extreme-citizen-science-excites"
const ecsanvismap = "https://uclexcites.blog/wp-content/uploads/2023/04/excites-projects-world-map-1.jpg"
const marcosUrl =
	"https://www.linkedin.com/in/marcosmoreubadia";
const fabienUrl = "https://www.linkedin.com/in/fabien-moustard-996998227";
const tomUrl =
	"https://profiles.ucl.ac.uk/39574";
const mukiUrl = "https://profiles.ucl.ac.uk/8073-muki-haklay";
const jeromeUrl = "https://www.ucl.ac.uk/anthropocene/people/dr-jerome-lewis";
const jonathanUrl =
	"https://www.ucl.ac.uk/advanced-research-computing/people/jonathan-cooper";
const claireUrl =
	"https://profiles.ucl.ac.uk/684-claire-ellul";
const amandaUrl =
	"https://www.ucl.ac.uk/advanced-research-computing/people/amanda-ho-lyn";
const jedUrl = "https://www.durham.ac.uk/staff/jed-stevenson/";
const desUrl = "https://et.linkedin.com/in/dessalegn-tekle-02b848ba";

const mailtoElem = `<a href="mailto:info@xxx?subject=xxxx Mobile Feedback">info@xxxx</a>`;
const whyReadMore = `https://uclexcites-blog.translate.goog/2024/06/26/whatsapp-maps-connecting-users-and-producers-of-ground-information/?_x_tr_sl=auto&_x_tr_tl=es&_x_tr_hl=en-US&_x_tr_pto=wapp`
i18next.use(initReactI18next).init({
	lng: savedLanguage,
	fallbackLng: ["en", "es", "fr", "pt", "am", "yo"],
	supportedLngs: Object.keys(supportedLanguages),
	debug: true,
	resources: {
		en: {
			translation: {
				key: "hello world",
				asktheteam: "Ask us anything",
				instructions: `<span class="title">Create WhatsApp Maps with WAMaps </span><hr> 1 - Share locations in a WhatsApp group<br> 2 - Export chat to WAMaps<br> 3 - Share your WhatsApp Map`,
				watchtutorial: "Watch tutorial",
				tutorialUrl: "https://youtube.com/embed/vaPHy8S-OpA" + youtubeOpts,
				viewrecentmap: "View recent map",
				showmap: "Show map",
				selectFile: "Convert WhatsApp chat to map",
				selectImages: "Upload geotagged photos",
				observer: "Observer",
				date: "Date",
				inputtopiclabel: "What have you mapped in this WhatsApp group?",
				inputgoallabel: "What do you want to achieve with this map?",
				datasovmessage:
					"Do you allow the WAMaps team to use your map to support your community?",
				about: "What is WAMaps",
								// <br /><strong>WAMaps</strong> is a crowdsourcing platform to instantly turn photos and WhatsApp chats into private maps. <br />
								// <br /><strong>WAMaps</strong> is a platform for simple, private crowdsourcing that turns photos stored in the phone or WhatsApp into maps.<br />

				aboutContent: `
								<br /><strong>WAMaps</strong> is a crowdsourcing platform to connect with people on the ground and instantly turn everyday photos into maps. <br />

								<br /><strong>WAMaps Business Mappers</strong> are people on the ground who earn money creating maps with WAMaps. <br />
								`,
				why: "Why WAMaps",
				whyContent: `
				<br />Decades of satellite imagery archives help us understand change from space.<br /><br />To better understand change from the ground, we need to unlock the photos from the past that are on our phones, and incentivise the collection of new ones by many people, including the billions whose stories and data are left out in traditional crowdsourcing.<br /><br />
				To achieve that, crowdsourcing needs to be embedded in the technology and the data that people already have (i.e. photos and chats). <br /><br />But simplifying crowdsourcing is not enough to popularise it. Cash and trust are also needed. Crowdsourcing needs to transition towards paid-first (not volunteered-first) and private-first (not open-first). <u>A peer-reviewed publication breaking down and justifying this statement will be available here soon.</u><br />`,
				caseStudies: " 10+ years trying",
				caseStudiesContent: `<br />WAMaps builds on years of research in Volunteered Geographic Information (VGI) and Extreme Citizen Science across
				 Europe and with communities living in some of the most challenging environments on Earth (see 🌍 <a href='${ecsanvismap}' target="_blank" rel="noopener noreferrer">World Map of our past projects 2010-2023</a>). 
				<br /><br />Some of our work has evolved from highly participatory processes, to simplifying data collection via WhatsApp (👉 <a href='${firstwhatsappMapsUrl}' target="_blank" rel="noopener noreferrer">Is this the first-ever WhatsApp Map?</a>), and now with WAMaps we aim to simplify crowdsourcing even further and connect those who need ground data with people on the ground.
				<br /><br />Below are some articles and maps of our past pilot projects: <br />🇳🇬 (2021) <a href='${extremeCitizenUrl}' target="_blank" rel="noopener noreferrer">Linking Messaging & Mapping for Farming in Nigeria.</a><br />🇪🇹 (2023) <a href='${ethio2023}' target="_blank" rel="noopener noreferrer">Wisdom of the Crowd in the Age of AI: Water.</a>
				<br />🇪🇹 (2024) <a href='${whatsappMapsUrl}' target="_blank" rel="noopener noreferrer">WhatsApp Maps of Population & Water Infrastructure in rural Ethiopia.</a> <br />🇬🇧 (2025) <a href='${GibraltarUrl}' target="_blank" rel="noopener noreferrer">Ten WhatsApp Maps of Places in Gibraltar, UK.</a>`,
				// caseStudiesContent: `<ul style="padding-left: 1.2em; margin: 0;">
						
				// 	<li>
				// 		<a href='${GibraltarUrl}'>Ten WhatsApp Maps of Places in Gibraltar, UK (2025)</a>
				// 	</li>
				// 	<li>
				// 		<a href='${firstwhatsappMapsUrl}'>Is this the first-ever WhatsApp Map? (2024)</a></strong><br />
				// 	</li>
				// 	<li>
				// 		<a href='${whatsappMapsUrl}'>WhatsApp Maps of Population & Water Infrastructure in rural Ethiopia (2024)</a>
				// 	</li>
				// 	<li>
				// 		<a href='${ethio2023}'>Wisdom of the Crowd in the Age of AI: Water (2023)</a>
				// 	</li>
				// 	<li>
				// 		<a href='${extremeCitizenUrl}'>Linking Messaging & Mapping for Farming in Nigeria (2021)</a>
				// 	</li>
				// 	<li>
				// 		<a href='${ecsanvismap}'>World Map of our case studies before WAMaps (2010-2023)</a>
				// 	</li>
				// 	</ul>`,
				what: " Disclaimer",
				whatContent:
					"WAMaps Web: A platform that brings people together to create and share WhatsApp Maps",

				people: "People",
				peopleContent: `<br />WAMaps is spining out from University College London (UCL), where it is being developed by the Extreme Citizen Science Lab (Geography Dept.) and the Advanced Research Computing Centre (ARC). <br>
					<br />Currently the core WAMaps team is:<br>
					<br />
					<a href='${marcosUrl}' target="_blank" rel="noopener noreferrer">Marcos Moreu </a><br>
					<a href='${mukiUrl}' target="_blank" rel="noopener noreferrer">Muki Haklay </a><br>
					<a href='${claireUrl}' target="_blank" rel="noopener noreferrer">Claire Ellul </a><br>
					<a href='${tomUrl}' target="_blank" rel="noopener noreferrer">Tom Couch </a><br>
					<a href='${jedUrl}' target="_blank" rel="noopener noreferrer">Jed Stevenson </a><br>
					<br />

					WAMaps builds on the Kapta and Sapelli software and research with Fabien Moustard, Jerome Lewis and the ExCiteS and ARC teams. This research is/was funded by UCL and the European Research Council.
				`,

				
				legalDisclaimer: `<br />The WAMaps team has made every effort to develop an app that converts photos and WhatsApp chats into maps with the highest possible accuracy. However, we cannot accept responsibility for any errors, omissions, or inconsistencies that may occur. Please always make your own judgement about the accuracy of the maps and validate the information using other sources. While we take data privacy and security seriously, WAMaps cannot be held responsible for any misuse of data shared via the app. If you encounter any issues or have feedback, please reach out.</a>`,

				confirm: "Confirm",
				yes: "Yes",
				no: "No",
				sharedata: "Share",
				shareimg: "Share the map IMAGE",
				uploaddata: "Share map with Task ID",
			   uploadPending: `uploadPending`,
				uploadReady: "Ready to Share!!!",
				uploadFailed: "Upload failed! See console.",
				shareDirectly: "👉 Click to share",
				addMetadataTitle: "Describe this map",
				sharingTitle: "",
				addDescription: "Search open WhatsApp Maps",
				updateDescription: "Update map title",
				copyright: "WAMaps by UCL",
				supportOption: "Get support to improve your map",
				installPrompt: "❗ Install WAMaps using Google Chrome",
				installPromptChrome: "Install WAMaps to your home screen",
				installClickMessage:
					"WAMaps is now being added to your home screen. This might take a few seconds",
				desktoporiosPrompt:
					"WAMaps works best on Android mobile devices. Please visit this page on an Android mobile device to use the app.",
				install: "Install",
				dismiss: "Dismiss",
			},
		},
		es: {
			translation: {
				key: "hola mundo",
				asktheteam: "Pregúntanos lo que quieras",
				instructions: `<span class="title">Crea WhatsApp Maps con WAMaps</span><hr>1 - Comparte ubicaciones en un grupo de WhatsApp<br>2 - Exporta el chat a WAMaps<br>3 - Comparte tu WhatsApp Map`,
				watchtutorial: "Ver tutorial",
				tutorialUrl: "https://youtube.com/embed/hq2h8Ou2BOE" + youtubeOpts,
				viewrecentmap: "Ver mapa reciente",
				showmap: "Mostrar mapa",
				selectFile: "Convertir chat de WhatsApp a mapa",
				selectImages: "Subir fotos geoetiquetadas",
				observer: "Observador",
				date: "Fecha",
				datasovmessage:
					"¿Permites que el equipo de WAMaps use tu mapa para apoyar a tu comunidad?",
				inputtopiclabel: "¿Qué has mapeado en este grupo de WhatsApp?",
				inputgoallabel: "¿Qué deseas lograr con este mapa?",
				about: "¿Qué es WAMaps?",
				aboutContent: `WAMaps Mobile es una app para crear WhatsApp Maps.`,
				why: "¿Por qué WAMaps?",
				whyContent: `Para popularizar el mapeo y conectar usuarios y productores de información de campo. Consulta nuestro último blog y dónde empezó esto en 2010:<br><li><a href='${whatsappMapsUrlSpanish}'>¿WhatsApp Maps? Conectando usuarios y productores de información de campo</a></li><br><li><a href='${extremeCitizenUrl}'>Ciencia Ciudadana Extrema en la selva tropical del Congo</a></li>`,
				what: "¿Qué Sigue?",
				whatContent:
					"WAMaps Web: Una plataforma que reúne a personas para crear y compartir mapas de WhatsApp",

				people: "Quiénes Somos",
				peopleContent: `WAMaps está siendo desarrollado por el grupo de investigación de Ciencia Ciudadana Extrema (UCL ExCiteS) y el Centro de Computación Avanzada (UCL ARC) de la University College London (UCL), con ayuda de socios externos y colaboradores.<br>Actualmente, el equipo central de WAMaps está formado por: <br><ul><li><a href='${marcosUrl}'>Marcos Moreu, UCL Geography</a></li><li><a href='${fabienUrl}'>Fabien Moustard, UCL Geography</a></li><li><a href='${tomUrl}'>Tom Couch, UCL ARC</a></li><li><a href='${mukiUrl}'>Muki Haklay, UCL Geography</a></li><li><a href='${jonathanUrl}'>Jonathan Cooper, UCL ARC</a></li><li><a href='${claireUrl}'>Claire Ellul, UCL CEGE</a></li><li><a href='${amandaUrl}'>Amanda Ho-Lyn, UCL ARC</a></li><li><a href='${jedUrl}'>Jed Stevenson, Durham University</a></li><li><a href='${desUrl}'>Dessalegn Teckle, Addis Ababa University, NGO IPC</a></li></ul>`,
				legalDisclaimer: `<b>Exención de responsabilidad</b>: El equipo de WAMaps ha hecho todo lo posible para desarrollar una aplicación que procesa chats de WhatsApp para crear WhatsApp Maps con la mayor precisión posible. Sin embargo, no podemos aceptar responsabilidad por errores, omisiones o inconsistencias que puedan ocurrir. Le recomendamos que siempre haga su propio juicio sobre la precisión de los mapas y valide la información utilizando otras fuentes. Si encuentra algún problema o tiene comentarios, comuníquese con nosotros en ${mailtoElem} o a través de WhatsApp en el <a href=${ASK_URL}>+44 7473522912.</a>.`,

				confirm: "Confirmar",
				yes: "Sí",
				no: "No",
				sharedata: "Compartir los DATOS del mapa",
				shareimg: "Comparte el mapa",
				uploaddata: "Subir a WAMaps Web",
				addMetadataTitle: "Describe este mapa",
				sharingTitle: "Comparte este mapa",
				cancel: "cancel",
				addDescription: "Título del mapa",
				updateDescription: "Cambia el título",
				copyright: "WAMaps by UCL",
				supportOption: "Ayuda para mejorar el mapa?",
				installPrompt: "Instalar WAMaps para crear WhatsApp Maps",
				installClickMessage:
					"WAMaps se está añadiendo a tu pantalla de inicio. Esto puede tardar unos segundos.",
				desktoporiosPrompt:
					"WAMaps funciona mejor en dispositivos móviles Android. Por favor, visite esta página en un dispositivo móvil para usar la aplicación.",
				install: "Instalar",
				dismiss: "No Instalar",
			},
		},
		fr: {
			translation: {
				key: "bonjour le monde",
				asktheteam: "Demandez-nous ce que vous voulez",
				instructions: `<span class="title">Créer des WhatsApp Maps avec WAMaps</span><hr>1 - Partagez des localisations dans un groupe WhatsApp<br>2 - Exportez la discussion dans WAMaps<br>3 - Partagez votre WhatsApp Map`,
				watchtutorial: "Regarder le tutoriel",
				tutorialUrl: "https://youtube.com/embed/3KrsKgFHYMs" + youtubeOpts,
				viewrecentmap: "Voir la carte récente",
				showmap: "Afficher la carte",
				selectFile: "Convertir la discussion WhatsApp en carte",
				selectImages: "Télécharger des photos géolocalisées",
				observer: "Observateur",
				date: "Date",
				inputtopiclabel: "Qu’avez-vous cartographié dans ce groupe WhatsApp?",
				inputgoallabel: "Que souhaitez-vous faire avec cette carte?",
				datasovmessage:
					"Autorisez-vous l’équipe WAMaps à utiliser votre carte pour soutenir votre communauté?",
				about: "À propos",
				aboutContent: `WAMaps Mobile est une application web progressive pour créer des Cartes WhatsApp en 3 étapes.`,
				why: "Pourquoi?",
				whyContent: `Pour connecter les utilisateurs et les producteurs d'informations de terrain. Consultez notre dernier blog et découvrez où tout a commencé en 2010:<br><li><a href='${whatsappMapsUrl}'>Cartes WhatsApp ? Connecter utilisateurs et producteurs d'informations de terrain</a></li><br><li><a href='${extremeCitizenUrl}'>Science Citoyenne Extrême dans la forêt tropicale du Congo</a></li>`,
				what: "What's Next?",
				whatContent:
					"WAMaps Web est une plateforme qui rassemble les gens pour créer et partager des cartes WhatsApp",
				people: "Personnes",
				peopleContent: `WAMaps est développé par le groupe de recherche Science Citoyenne Extrême (ExCiteS) de l'University College London (UCL) et le Centre de Calcul Avancé (UCL ARC), avec l'aide de partenaires externes et de contributeurs.<br>Actuellement, l'équipe centrale de WAMaps se compose de:<br><ul><li><a href='${marcosUrl}'>Marcos Moreu, UCL Géographie</a></li><li><a href='${fabienUrl}'>Fabien Moustard, UCL Géographie</a></li><li><a href='${tomUrl}'>Tom Couch, UCL ARC</a></li><li><a href='${mukiUrl}'>Muki Haklay, UCL Géographie</a></li><li><a href='${jonathanUrl}'>Jonathan Cooper, UCL ARC</a></li><li><a href='${claireUrl}'>Claire Ellul, UCL CEGE</a></li><li><a href='${amandaUrl}'>Amanda Ho-Lyn, UCL ARC</a></li><li><a href='${jedUrl}'>Jed Stevenson, Université de Durham</a></li><li><a href='${desUrl}'>Dessalegn Teckle, Université d'Addis-Abeba, ONG IPC</a></li></ul>`,
				legalDisclaimer: `Avertissement juridique : L'équipe de WAMaps a fait tout son possible pour développer une application qui analyse les discussions WhatsApp afin de créer des WhatsApp Maps avec la plus grande précision possible. Cependant, nous ne pouvons accepter aucune responsabilité pour les erreurs, omissions ou incohérences qui pourraient survenir. Nous vous recommandons de toujours juger par vous-même de l'exactitude des cartes et de valider les informations en utilisant d'autres sources. Si vous rencontrez des problèmes ou avez des commentaires, veuillez nous contacter à ${mailtoElem} ou via WhatsApp au <a href=${ASK_URL}>+44 7473522912.</a>.`,
				confirm: "Confirmer",
				yes: "Oui",
				no: "Non",
				sharedata: "Partager les données",
				shareimg: "Partager une photo",
				uploaddata: "Télécharger sur WAMaps Web",
				addMetadataTitle: "Décrivez cette carte",
				sharingTitle: "Partager cette carte",
				addDescription: "Ajoutez un titre",
				updateDescription: "Changer le titre",
				copyright: "WAMaps par UCL",
				supportOption: "Aide pour améliorer votre carte",
				installPrompt: "Installez WAMaps pour créer WhatsApp Maps",
				installClickMessage:
					"WAMaps est maintenant ajouté à votre écran d'accueil. Cela peut prendre quelques secondes",
				desktoporiosPrompt:
					"WAMaps fonctionne mieux sur les appareils mobiles Android. Veuillez visiter cette page sur un appareil mobile pour utiliser l'application.",
				install: "Installer",
				dismiss: "Rejeter",
			},
		},
		am: {
			translation: {
				key: "አንደትናት ዓለም",
				asktheteam: "ምንም ጥያቄ ጠይቁን",
				instructions: `<span class="title">በካፕታ መተግብሪያ ዋትስ አፕ ካርታን ይስሩ</span><hr>1 - አከባቢውን ያጋሩ<br>2 - ምልልሱን ወደካፕታ ይላኩ<br>3 - የዋትስ አፕ ካርታዎን ያጋሩ`,
				watchtutorial: "አጋዥ ስልጠናን ይመልከቱ",
				tutorialUrl: "https://youtube.com/embed/vaPHy8S-OpA" + youtubeOpts,
				viewrecentmap: "የቅርብ ጊዜ ካርታ ይመልከቱ",
				showmap: "ካርታ አሳይ",
				selectFile: "የዋትስአፕ ውይይትን ወደ ካርታ ለውጥ",
				selectImages: "የቦታ ምልክት ያላቸውን ፎቶዎች ይስቀሉ",
				observer: "ተመልካች",
				date: "ቀን",
				inputtopiclabel: "በዚህ ዋትስአፕ ቡድን ምን አሳፍረክ?",
				inputgoallabel: "በዚህ ካርታ ምን ማንኛት ነገር ልታከናውን ትፈልጋለህ?",
				datasovmessage: "በኮምዩኒቲዎ ማገዶ እንዲረዳዎ ካፕታ ቡድን ካርታዎን ማጠቃለያን ትፈቅድለታለህ?",
				about: "ስለ",
				aboutContent: `WAMaps ሞባይል ሶፍትዌር የእንቅስቃሴ ድህረ-ገጽ (Progressive Web App) ነው። በ3 ሰለስተኛ ደረጃዎች የWhatsApp ካርታዎችን ለመፍጠር ይህን ይጠቀሙ።`,
				why: "Work with us",
				whyContent: `To connect users and producers of ground information. See our latest blog and where this started in 2010:<br><li><a href='${whatsappMapsUrl}'>WhatsApp Maps? Connecting users and producers of ground information</a></li><br><li><a href='${extremeCitizenUrl}'>Extreme Citizen Science in the Congo rainforest</a></li>`,
				what: "What's Next?",
				whatContent:
					"WAMaps is a platform that brings people together to create and share WhatsApp Maps",
				people: "ሰዎች",
				peopleContent: `WAMaps በአውሮፕያን ዩኒቨርሲቲ (University College London, UCL) Extreme Citizen Science (ExCiteS) መሪ እና ከአውጪዎች ባለሙያዎች በተባባሉ እንደሚገናኙና እንዲቀላቀሉ እንገናኝ እንደምንሳቸው።<br>በአሁኑ ወቅት የWAMaps ዋና ቡድን የሚካተቱበት:<br><ul><li><a href='${marcosUrl}'>ማርኮስ ሞሬኡ, በUCL ጂዮግራፊ</a></li><li><a href='${fabienUrl}'>ፋቢዬን ሞስታርድ, በUCL ጂዮግራፊ</a></li><li><a href='${tomUrl}'>ቶም ካኡኽ, በUCL ARC</a></li><li><a href='${mukiUrl}'>ሙኪ ሃክላይ, በUCL ጂዮግራፊ</a></li><li><a href='${jonathanUrl}'>ጆናታን ኮኡፐር, በUCL ARC</a></li><li><a href='${claireUrl}'>ክሌር ኤሉል, በUCL CEGE</a></li><li><a href='${amandaUrl}'>አማንዳ ሆ-ሊን, በUCL ARC</a></li><li><a href='${jedUrl}'>ጄድ ስቴቭንሰን, በደርሀም ዩኒቨርሲቲ</a></li><li><a href='${desUrl}'>ዴሰሌን ትክሌ, አዲስ አበባ ዩኒቨርሲቲ, ማህበረሰብ IPC</a></li></ul>`,
				legalDisclaimer: `Disclaimer: The WAMaps team has made every effort to develop an app that parse WhatsApp chats to create WhatsApp Maps with the highest possible accuracy. However, we cannot accept responsibility for any errors, omissions, or inconsistencies that may occur. Please always make your own judgement about the accuracy of the maps and validate the information using other sources. If you encounter any issues or have feedback, please reach out to us at ${mailtoElem} or via WhatsApp at <a href=${ASK_URL}>+44 7473522912.</a>.`,
				confirm: "አረጋግጥ",
				yes: "አዎን",
				no: "አይደለም",
				sharedata: "መረጃወን ያጋሩ",
				shareimg: "ምስል ያጋሩ",
				uploaddata: "ወደ ካፕታ ይጫኑ።",
				addMetadataTitle: "ይህን መረጃ አርእስት ይስጡት",
				sharingTitle: "ይህን አረእስት ያጋሩ",
				addDescription: "በካርታዎ ላይ ዝርዝር ይክሉ",
				updateDescription: "የካርታ ዝርዝሩን ያዘምኑ",
				copyright: "ካፕታ በ UCL",
				supportOption: "ካርታዎን ለማሻሻል ድጋፍ አማራጭ",
				installPrompt: "ካፕታ በሞባይል መሳሪያ ላይ ሲጫኑ በተሻለ ሁኔታ ይሰራል. አሁን ይጫኑ?",
				installClickMessage:
					"ካፕታ አሁን ወደ መነሻ ስክሪንዎ እየታከለ ነው። ይሄ ጥቂት ሰከንዶች ሊወስድ ይችላል።",
				desktoporiosPrompt:
					"ካፕታ በአንድሮይድ ሞባይል መሳሪያዎች ላይ በተሻለ ሁኔታ ይሰራል። እባክዎን መተግበሪያውን ለመጠቀም ይህን ገጽ በሞባይል መሳሪያ ላይ ይጎብኙ።",
				install: "ጫን",
				dismiss: "አስወግድ",
			},
		},
		pt: {
			translation: {
				key: "olá mundo",
				asktheteam: "Pergunte-nos qualquer coisa",
				instructions: `<span class="title">Crie Mapas do WhatsApp com o WAMaps</span><hr>1 - Partilhe locais num grupo do WhatsApp<br> 2 - Exporte o chat para o WAMaps<br> 3 - Compartilhe seu WhatsApp Map`,
				watchtutorial: "Assistir tutorial",
				tutorialUrl: "https://youtube.com/embed/vaPHy8S-OpA" + youtubeOpts,
				viewrecentmap: "Ver mapa recente",
				showmap: "Mostrar mapa",
				selectFile: "Converter conversa do WhatsApp em mapa",
				selectImages: "Carregar fotos geotagged",
				observer: "Observador",
				date: "Data",
				inputtopiclabel: "O que você mapeou neste grupo de WhatsApp?",
				inputgoallabel: "O que você quer alcançar com este mapa?",
				datasovmessage:
					"Você permite que a equipe WAMaps use seu mapa para apoiar sua comunidade?",
				about: "Sobre",
				aboutContent: `WAMaps Mobile é uma Aplicação Web Progressiva para criar Mapas WhatsApp em 3 passos.`,
				what: "What's Next?",
				whatContent:
					"WAMaps is a platform that brings people together to create and share WhatsApp Maps",
				people: "Pessoas",
				peopleContent: `WAMaps está a ser desenvolvido pelo grupo de pesquisa Ciência Cidadã Extrema (ExCiteS) da University College London (UCL) e pelo Centro de Computação Avançada (UCL ARC), com ajuda de parceiros externos e colaboradores.<br>Atualmente, a equipa principal do WAMaps consiste em:<br><ul><li><a href='${marcosUrl}'>Marcos Moreu, Geografia UCL</a></li><li><a href='${fabienUrl}'>Fabien Moustard, Geografia UCL</a></li><li><a href='${tomUrl}'>Tom Couch, UCL ARC</a></li><li><a href='${mukiUrl}'>Muki Haklay, Geografia UCL</a></li><li><a href='${jonathanUrl}'>Jonathan Cooper, UCL ARC</a></li><li><a href='${claireUrl}'>Claire Ellul, UCL CEGE</a></li><li><a href='${amandaUrl}'>Amanda Ho-Lyn, UCL ARC</a></li><li><a href='${jedUrl}'>Jed Stevenson, Universidade de Durham</a></li><li><a href='${desUrl}'>Dessalegn Teckle, Universidade de Addis Abeba, ONG IPC</a></li></ul>`,
				legalDisclaimer: `Aviso Legal: A equipe WAMaps fez todo o possível para desenvolver um aplicativo que analisa conversas do WhatsApp para criar WhatsApp Maps com a maior precisão possível. No entanto, não podemos aceitar responsabilidade por erros, omissões ou inconsistências que possam ocorrer. Recomendamos que você sempre faça seu próprio julgamento sobre a precisão dos mapas e valide as informações usando outras fontes. Se encontrar algum problema ou tiver comentários, entre em contato conosco pelo e-mail ${mailtoElem} ou pelo WhatsApp no número <a href=${ASK_URL}>+44 7473522912.</a>.`,
				confirm: "Confirmar",
				yes: "Sim",
				no: "Não",
				sharedata: "Compartilhar os dados do mapa",
				shareimg: "Compartilhar a imagem do mapa",
				uploaddata: "Carregar para a Web WAMaps",
				addMetadataTitle: "Descreva este mapa",
				sharingTitle: "Compartilhar este mapa",
				addDescription: "Título do seu mapa",
				updateDescription: "Alterar o título do mapa",
				copyright: "WAMaps pela UCL",
				supportOption: "Obtenha suporte para melhorar seu mapa",
				installPrompt: "Instale o WAMaps para criar WhatsApp Maps",
				installClickMessage:
					"WAMaps está agora a ser adicionado à sua tela inicial. Isto pode levar alguns segundos",
				desktoporiosPrompt:
					"O WAMaps funciona melhor em dispositivos móveis Android. Por favor, visite esta página num dispositivo móvel para usar a aplicação.",
				install: "Instalar",
				dismiss: "Dispensar",
			},
		},
		yo: {
			translation: {
				key: "báwo ni ayé",
				asktheteam: "Béèrè ohunkóhun lọ́wọ́ wa",
				instructions: `<span class="title">Ṣẹda Awọn maapu WhatsApp pẹlu WAMaps</span><hr>1 - Pin awọn ipo ni ẹgbẹ WhatsApp kan<br>2 - okeere iwiregbe si WAMaps<br>3 - Pin maapu WhatsApp rẹ`,
				watchtutorial: "Aago Tutorial",
				tutorialUrl: "https://youtube.com/embed/vaPHy8S-OpA" + youtubeOpts,
				viewrecentmap: "Wo àwáàrí tó ṣẹṣẹ",
				showmap: "Fíhàn àwáàrí",
				selectFile: "Yí ìfọ̀rọ̀wérọ̀ WhatsApp padà sí àwòrán",
				selectImages: "Gbéga àwọn fótò geotagged",
				observer: "Olùtọ́jú",
				date: "Ọjọ́",
				inputtopiclabel: "Kí ni o ti ṣe àwáàrí ní àpàdé WhatsApp yìí?",
				inputgoallabel: "Kí ni o fẹ́ ṣe tán pẹ̀lú àwáàrí yìí?",
				datasovmessage:
					"Ṣe o jẹ́ kí ẹgbẹ́ WAMaps lò àwáàrí rẹ láti ṣèrànwọ́ ààárín rẹ?",
				about: "Nipa",
				aboutContent: `WAMaps Mobile jẹ Progressive Web App lati ṣẹda Awọn Maapu WhatsApp ni awọn igbesẹ mẹta.`,
				why: "Why WAMaps?",
				whyContent: `To connect users and producers of ground information. See our latest blog and where this started in 2010:<br><li><a href='${whatsappMapsUrl}'>WhatsApp Maps? Connecting users and producers of ground information</a></li><br><li><a href='${extremeCitizenUrl}'>Extreme Citizen Science in the Congo rainforest</a></li>`,
				what: "What's Next?",
				whatContent:
					"WAMaps is a platform that brings people together to create and share WhatsApp Maps",
				people: "Àwọn Ènìyàn",
				peopleContent: `WAMaps ni a ṣe nipasẹ ẹgbẹ iwadi Ẹkọ Citizens Extreme (ExCiteS) ti University College London (UCL) ati Ile-iṣẹ Idagbasoke Iṣiro (UCL ARC), pẹlu iranlọwọ lati ọdọ awọn alabaṣepọ ita ati awọn alabapin.<br>Lọwọlọwọ, ẹgbẹ WAMaps akọkọ ni:<br><ul><li><a href='${marcosUrl}'>Marcos Moreu, UCL Geography</a></li><li><a href='${fabienUrl}'>Fabien Moustard, UCL Geography</a></li><li><a href='${tomUrl}'>Tom Couch, UCL ARC</a></li><li><a href='${mukiUrl}'>Muki Haklay, UCL Geography</a></li><li><a href='${jonathanUrl}'>Jonathan Cooper, UCL ARC</a></li><li><a href='${claireUrl}'>Claire Ellul, UCL CEGE</a></li><li><a href='${amandaUrl}'>Amanda Ho-Lyn, UCL ARC</a></li><li><a href='${jedUrl}'>Jed Stevenson, Ile-ẹkọ giga Durham</a></li><li><a href='${desUrl}'>Dessalegn Teckle, Ile-ẹkọ giga Addis Ababa, NGO IPC</a></li></ul>`,
				legalDisclaimer: `Disclaimer: The WAMaps team has made every effort to develop an app that parse WhatsApp chats to create WhatsApp Maps with the highest possible accuracy. However, we cannot accept responsibility for any errors, omissions, or inconsistencies that may occur. Please always make your own judgement about the accuracy of the maps and validate the information using other sources. If you encounter any issues or have feedback, please reach out to us at ${mailtoElem} or via WhatsApp at <a href=${ASK_URL}>+44 7473522912.</a>.`,
				confirm: "Ẹ̀rí",
				yes: "Bẹ́ẹ̀ni",
				no: "Rárá",
				sharedata: "Pín ìwòye àwáàrí",
				shareimg: "Pín àwòrán àwáàrí",
				uploaddata: "Gbé só WAMaps lórí Ayélujára",
				addMetadataTitle: "Ṣàpèjúwe àwáàrí yìí",
				sharingTitle: "Pín àwáàrí yìí",
				addDescription: "Àkọlé àwáàrí rẹ",
				updateDescription: "Update map title",
				copyright: "WAMaps látọwọ́ UCL",
				supportOption: "Gba ìtìlẹ́yìn láti mú àwáàrí rẹ dàra sí",
				installPrompt: "Fi WAMaps sí ẹ̀rọ rẹ láti ṣẹ̀dá àwọn Màáp WhatsApp",
				installClickMessage:
					"WAMaps ti wa ni afikun si iboju ile rẹ. Eyi le gba iṣẹju diẹ",
				desktoporiosPrompt:
					"WAMaps ń ṣiṣẹ́ dáradára jù lórí àwọn ẹ̀rọ alátagbà Android. Jọ̀wọ́ ṣàbẹ̀wò sí ojú ewé yìí lórí ẹ̀rọ alátagbà láti lo iṣẹ́ àmúlò náà.",
				install: "Ìgbele",
				dismiss: "Ìsọfúnni",
			},
		},
	},
});


export { i18next, supportedLanguages };
