var OIPJS = require("oip-js").OIPJS;
var GeoPattern = require('geopattern');
var fs = require("fs");
var sharp = require('sharp');

var Core = OIPJS();

var ThumbnailScraper = {};

ThumbnailScraper.getThumbnail = function(txid, onSuccess, onError){
	console.log("Grabbing Artifact!", txid);

	Core.Index.getArtifactFromID(txid, function(artifact){
		console.log("Grabbing Thumbnail!");

		var thumbnail = artifact.getThumbnail();
		var location = artifact.getLocation();

		if (!thumbnail){
			ThumbnailScraper.generateGeopattern(artifact.getTXID(), onSuccess, onError)
		} else {
			console.log("Grabbing Thumbnail from IPFS!");
			Core.Network.ipfsUploadAPI.files.cat(Core.util.buildIPFSShortURL(location, thumbnail), function(err, data){
				if (err) {
					ThumbnailScraper.generateGeopattern(artifact.getTXID(), onSuccess, onError);
					return;
				}

				console.log("Writing Thumbnail to Disk!");

				sharp(data)
					.resize(720, 480)
					.toFile(__dirname + "/thumbnails/" + txid + ".png", function(err, info){
						if (err){
							ThumbnailScraper.generateGeopattern(artifact.getTXID(), onSuccess, onError)
						} else {
							console.log("Thumbnail written successfully.");
							onSuccess();
						}
					})
			})
		}
	}, onError)
}

ThumbnailScraper.generateGeopattern = function(txid, onSuccess, onError){
	console.log("Generating Geopattern!", txid);

	var geoPat = GeoPattern.generate(txid);
	var geoSVG = geoPat.toSvg();

	console.log("Generated Geopattern!");
	console.log("Converting Geopattern!");

	sharp(Buffer.from(geoSVG, "utf8"))
		.resize(380, 250)
		.toFile(__dirname + "/thumbnails/" + txid.substr(0,6) + ".png", function(err, info){
			if (err){
				console.error("Error writing thumbnail to disk!");
			} else {
				console.log("Thumbnail written successfully.");
				onSuccess();
			}
		})
}

module.exports = ThumbnailScraper;