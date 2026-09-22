var webpack = require("webpack");
var path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { InjectManifest } = require("workbox-webpack-plugin");
const WebpackPwaManifest = require("webpack-pwa-manifest");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = (env, argv) => {
	const isProduction = argv.mode === "production";

	return {
		mode: isProduction ? "production" : "development",
		entry: {
			main: "./src/main.js",
		},
		devServer: {
			static: "./dist",
			devMiddleware: {
				index: true,
				mimeTypes: { phtml: "text/html" },
				publicPath: "/dist",
				serverSideRender: true,
				writeToDisk: true,
			},
		},
		output: {
			path: path.resolve(__dirname, "dist"),
			filename: "[name].bundle.js",
			clean: isProduction,
		},
		resolve: {
			fallback: { path: require.resolve("path-browserify") },
		},
		optimization: {
			runtimeChunk: "single",
		},
		module: {
			rules: [
				{
					test: /\.css$/i,
					use: ["style-loader", "css-loader"],
				},
				{
					test: /\.(png|svg|jpg|jpeg|gif|webp)$/i,
					type: "asset/resource",
				},
				{
					test: /\.jsx?$/,
					exclude: /node_modules/,
					use: {
						loader: "babel-loader",
						options: {
							presets: ["@babel/preset-env", "@babel/preset-react"],
						},
					},
				},
			],
		},
		plugins: [
			new webpack.EnvironmentPlugin({
				ASK_URL: "",
				POOL_ID: "",
				CLIENT_ID: "",
				REGION: "",
				UPLOAD_URL: "",
				MAPBOX_TOKEN: "",
				CODE_API_URL: "",
			}),
			new webpack.ProvidePlugin({
				L: "leaflet",
			}),
			new CopyPlugin({
				patterns: [
					{
						from: "./src/images/og-icon.png",
						to: "og-icon.png",
					},
				],
			}),
			new HtmlWebpackPlugin({
				template: "./src/index.html",
				title: "WAMaps",
				mobile: true,
				favicon: "src/images/icons/favicon.png",
				gaMeasurementId: process.env.GA_MEASUREMENT_ID || 'G-JEHLJFG92D',
				meta: {
					"Content-Type": {
						"http-equiv": "content-type",
						content: "text/html; charset=UTF-8",
					},
					viewport:
						"width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
					"og:title": {
						property: "og:title",
						content: "WAMaps",
					},
					"og:description": {
						property: "og:description",
						content: "Turn photos into maps. Connect.",
					},
					"og:type": {
						property: "og:type",
						content: "website",
					},
					"og:url": {
						property: "og:url",
						content: "https://whatfire.com/",
					},
					"og:image": {
						property: "og:image",
						itemprop: "image",
						content: "https://whatfire.com/og-icon.png",
					},
					"og:image:type": {
						property: "og:image:type",
						content: "image/png",
					},
					"og:image:width": {
						property: "og:image:width",
						content: "1200",
					},
					"og:image:height": {
						property: "og:image:height",
						content: "630",
					},
				},
				appMountIds: ["main"],
				manifest: "src/manifest.webmanifest",
			}),
			new InjectManifest({
				swSrc: "./src/sw.js",
				swDest: "sw.js",
				maximumFileSizeToCacheInBytes: 10485760, // 10MB - increased for better offline support
				exclude: [
					/\.map$/,
					/manifest$/,
					/node_modules\/(?!workbox)/,
					/\.DS_Store$/,
					/\.git/,
					/\.md$/,
				],
				// Additional files to include in precache
				manifestTransforms: [
					(manifestEntries) => {
						// console.log('Precaching', manifestEntries.length, 'files');
						return {
							manifest: manifestEntries.filter(entry => {
								// Include essential files for offline functionality
								return !entry.url.includes('hot-update') && 
									   !entry.url.includes('.map');
							})
						};
					}
				]
			}),
			new WebpackPwaManifest({
				publicPath: "/",
				name: "WAMaps",
				short_name: "WAMaps",
				description: "Turn photos into maps. Connect.",
				lang: "en-GB",
				theme_color: "#2D2C2C",
				background_color: "#2D2C2C",
				display: "standalone",
				orientation: "portrait",
				start_url: "/",
				scope: "/",
				categories: ["productivity", "utilities", "navigation"],
				share_target: {
					action: "/share-target",
					method: "POST",
					enctype: "multipart/form-data",
					params: {
						title: "name",
						text: "description",
						url: "link",
						files: [
							{ name: "file", accept: ["*/*"] },
							{ name: "lists", accept: ["text/plain", ".txt"] },
							{ name: "geographies", accept: ["application/json", ".geojson"] },
							{ name: "docs", accept: ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"] },
							{ name: "zips", accept: ["application/zip"] },
							{ name: "codes", accept: ["text/html", "text/css", "text/javascript", "application/json", "application/xml"] },
							{ name: "others", accept: ["*/*"] },
						],
					},
				},
				icons: [
					{
						src: path.resolve("src/images/icons/favicon.svg"),
						sizes: [72, 96, 128, 192, 256, 512],
					},
					{
						src: path.resolve("src/images/icons/favicon.svg"),
						size: "512x512",
						purpose: "maskable",
					},
				],
			}),
		],
	};
};
