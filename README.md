**What is Captallite**  
Captallite is a crowdsourcing platform to connect with people on the ground and instantly turn old and new photos into maps.

Captallite Business Mappers are people on the ground who earn money creating maps with Captallite.

**Why Captallite**  
Decades of satellite imagery archives help us understand change from space. To better understand change from the ground, we need to unlock the photos from the past that are in our phones, and incentivise the collection of new ones by many people, including the billions whose stories and data are left out in traditional crowdsourcing. To achieve that, crowdsourcing needs to be embedded in the technology and the data that people already have (i.e. photos and chats). <u>A peer-reviewed publication breaking down and justifying this statement will be available here soon.</u>

**Captallite is a Progressive Web App** 👉 https://captallite.com

# Guidance for Developers

- [Captallite first prototypes from 2021](https://github.com/MarcosMoreu/Kapta-Prototyping/commit/a06af733f0179d17b44190a7791395d624034477)
  
## Requirements

- Node.js v20.0.0 or later
- npm v10.0.0 or later

## Installation

1. Clone the repository: `git clone https://github.com/UCL/captallite.git && cd captallite`
2. Run `npm install` in the root directory
3. Create config file (see below)
4. Run `npm run build` to build the project
5. Run `npm start` to start the development server
6. Open `http://localhost:8080` in your browser

## Configuration

Captallite requires a configuration file to be created in the src directory. The file should be named `config.json` and should contain the following fields:

```json
{
	"mapbox": {
		"accessToken": "YOUR_MAPBOX_ACCESS_TOKEN"
	},
	"api": {
		"invokeUrl": "" // API URL (optional)
	}
}
```

# People

Captallite is spining out from University College London (UCL), where it is being developed by the Extreme Citizen Science Lab (Geography Dept.) and the Advanced Research Computing Centre (ARC). Currently the core Captallite team is:
- [Marcos Moreu](https://www.linkedin.com/in/marcosmoreubadia)
- [Tom Couch](https://www.ucl.ac.uk/advanced-research-computing/people/tom-couch)
- [Muki Haklay](https://profiles.ucl.ac.uk/8073-muki-haklay)
- [Claire Ellul](https://profiles.ucl.ac.uk/684-claire-ellul)
- [Jed Stevenson](https://www.durham.ac.uk/staff/jed-stevenson/)			

Captallite builds on the Kapta and Sapelli software and research with [Fabien Moustard](https://www.linkedin.com/in/fabien-moustard-996998227)
, [Jerome Lewis](https://www.ucl.ac.uk/anthropocene/people/dr-jerome-lewis) and the ExCiteS and ARC teams. This research is/was funded by UCL and the European Research Council.


# Legal disclaimer

Copyright 2024 University College London (UCL)

Licensed under the **Apache License, Version 2.0** (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License
