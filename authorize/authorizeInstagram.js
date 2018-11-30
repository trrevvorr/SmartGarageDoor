// assuming url = https://trrevvorr.github.io/InternetPoints/authorize/authorizeInstagram?particle_access_token=<TOKEN>&particle_device_id=<TOKEN>#access_token=ACCESS-TOKEN

const urlParams = new URLSearchParams(window.location.search);
const particleCredentials = urlParams.get("particle_credentials");
const { particleAccessToken, particleDeviceId } = decodeParticleCredentials(particleCredentials);
const instagramAccessToken = getAccessToken();
console.log([particleAccessToken, particleDeviceId, instagramAccessToken])
const particleRequest = `https://api.particle.io/v1/devices/${particleDeviceId}/authorizeInstagram?access_token=${particleAccessToken}&arg=${instagramAccessToken}`;
setTimeout(successMessage, 100); // give DOM time to render


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
	const statusNode = document.querySelector("#status");
	statusNode.textContent = "Instagram Account Linked!"
}

function decodeParticleCredentials(particleCredentials) {
	// see linkAccount.js for encoding
	const delimeter = "-";
	const delimeterIndex = particleCredentials.indexOf(delimeter);
	const particleAccessToken = particleCredentials.substring(0, delimeterIndex);
	const particleDeviceId = particleCredentials.substring(delimeterIndex + 1);
	return { particleAccessToken, particleDeviceId };
}