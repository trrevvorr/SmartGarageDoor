// assuming url = https://trrevvorr.github.io/InternetPoints/authorize/authorizeInstagram?particle_access_token=<TOKEN>&particle_device_id=<TOKEN>#access_token=ACCESS-TOKEN

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

function successMessage() {
	setStatusMessage("Instagram Account Linked!");
}


function failMessage() {
	setStatusMessage("Failed to link Instagram account. Please try again later.");
}

function setStatusMessage(status) {
	const statusNode = document.querySelector("#status");
	statusNode.textContent = status;
}

function decodeParticleCredentials(particleCredentials) {
	// see linkAccount.js for encoding
	const delimeter = "-";
	const delimeterIndex = particleCredentials.indexOf(delimeter);
	const particleAccessToken = particleCredentials.substring(0, delimeterIndex);
	const particleDeviceId = particleCredentials.substring(delimeterIndex + 1);
	return { particleAccessToken, particleDeviceId };
}

function validateInstagramResponse(instagramAccessToken) {
	return instagramAccessToken.length > 0;
}

function sendInstagramTokenToParticle(particleAccessToken, particleDeviceId, instagramAccessToken) {
	const url = `https://api.particle.io/v1/devices/${particleDeviceId}/linkIG`;
	const data = {
		access_token: particleAccessToken,
		arg: instagramAccessToken,
	};
	var postRequest = $.post( url, data).done(successMessage()).fail(failMessage());
}
