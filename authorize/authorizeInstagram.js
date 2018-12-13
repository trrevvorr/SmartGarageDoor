// assuming url = https://trrevvorr.github.io/InternetPoints/authorize/authorizeInstagram?particle_access_token=<TOKEN>&particle_device_id=<TOKEN>#access_token=ACCESS-TOKEN

function parseURL() {
	const urlParams = new URLSearchParams(window.location.search);
	const particleCredentials = urlParams.get("particle_credentials");
	const { particleAccessToken, particleDeviceId } = decodeParticleCredentials(particleCredentials);
	const instagramAccessToken = getAccessToken();

	return { particleAccessToken, particleDeviceId, instagramAccessToken };
}

function sendTokenToDevice() {
	const { particleAccessToken, particleDeviceId, instagramAccessToken } = parseURL();

	if (validateInstagramResponse(instagramAccessToken)) {
		sendInstagramTokenToParticle(particleAccessToken, particleDeviceId, instagramAccessToken);
	} else {
		failLinkMessage();
	}
}

// Instagram account successfully linked and sent down to Photon device
function successMessage() {
	document.querySelector("body").className = "onlineState";
}

// Instagram authorization failed
function failLinkMessage() {
	document.querySelector("body").className = "authFailedState";
}

// failed to send access token down to Photon device
function failPhotonMessage() {
	document.querySelector("body").className = "offlineState";
}

// retrieve access token from URL
function getAccessToken() {
	const instagramHash = "#access_token=";
	const hash = window.location.hash;
	let accessToken = "";

	if (hash.indexOf(instagramHash) < 0) {
		console.error(`Error parsing IG access token hash: ${hash}`);
	} else {
		accessToken = hash.substring(instagramHash.length);
	}

	return accessToken;
}

// decode particle credentials from query string param
// encoded within linkAccount.js
// this is only neccessary beacuse of an instagram bug
function decodeParticleCredentials(particleCredentials) {
	const delimeter = "-";
	let particleAccessToken = "";
	let particleDeviceId = "";

	if (particleCredentials) {
		const delimeterIndex = particleCredentials.indexOf(delimeter);
		particleAccessToken = particleCredentials.substring(0, delimeterIndex);
		particleDeviceId = particleCredentials.substring(delimeterIndex + 1);
	}

	return { particleAccessToken, particleDeviceId };
}

// check if instagram account linkage was successful and response can be parsed
function validateInstagramResponse(instagramAccessToken) {
	return instagramAccessToken.length > 0;
}

// send instagram token down to photon device
function sendInstagramTokenToParticle(particleAccessToken, particleDeviceId, instagramAccessToken) {
	const url = `https://api.particle.io/v1/devices/${particleDeviceId}/linkIG`;
	const data = {
		access_token: particleAccessToken,
		arg: instagramAccessToken,
	};
	var postRequest = $.post(url, data).done(() => { successMessage() }).fail(() => { failPhotonMessage() });
}

function timeout() {
	if (document.querySelector("body").className === "loadingState") {
		failPhotonMessage();
	}
}

setTimeout(() => {
	timeout();
}, 10000);