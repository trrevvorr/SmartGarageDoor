// assuming url = https://trrevvorr.github.io/InternetPoints/authorize/authorizeInstagram?particle_access_token=<TOKEN>&particle_device_id=<TOKEN>#access_token=ACCESS-TOKEN

let STATUS = "Loading...";
document.onload = () => {trySetStatusMessage(STATUS);}

// try writing success message to screen
function successMessage() {
	trySetStatusMessage("Instagram Account Linked!");
}

// try writing fail message to screen
function failMessage() {
	trySetStatusMessage("Failed to link Instagram account. Please try again later.");
}

// try writing status to screen, if failed, store status off in variable to be written after DOM renders
function trySetStatusMessage(status) {
	STATUS = status;
	const statusNode = document.querySelector("#status");
	if (statusNode) {
		statusNode.textContent = STATUS;
	}
}


const urlParams = new URLSearchParams(window.location.search);
const particleCredentials = urlParams.get("particle_credentials");
const { particleAccessToken, particleDeviceId } = decodeParticleCredentials(particleCredentials);
const instagramAccessToken = getAccessToken();
if (validateInstagramResponse(instagramAccessToken)) {
	sendInstagramTokenToParticle(particleAccessToken, particleDeviceId, instagramAccessToken);
} else {
	console.log([particleAccessToken, particleDeviceId, instagramAccessToken]);
	failMessage();
}

// retrieve access token from URL
function getAccessToken() {
	const instagramHash = "#access_token=";
	const hash = window.location.hash;
	let accessToken = "";

	if (hash.indexOf(instagramHash) < 0) {
		console.error(`Instagram changed their hash format: ${hash}`);
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
	const delimeterIndex = particleCredentials.indexOf(delimeter);
	const particleAccessToken = particleCredentials.substring(0, delimeterIndex);
	const particleDeviceId = particleCredentials.substring(delimeterIndex + 1);
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
	var postRequest = $.post( url, data).done(() => {successMessage()}).fail(() => {failMessage()});
}
