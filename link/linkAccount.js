// assuming url = https://trrevvorr.github.io/InternetPoints/link/linkAccount?particle_access_token=<TOKEN>&particle_device_id=<TOKEN>&instagram_client_id=<TOKEN>

function linkInstagram() {
	const urlParams = new URLSearchParams(window.location.search);
	const particleAccessToken = urlParams.get("particle_access_token");
	const particleDeviceId = urlParams.get("particle_device_id");
	const particleCredentials = encodeParticleCredentials(particleAccessToken, particleDeviceId);
	const instagramClientId = urlParams.get("instagram_client_id");
	const redirectURI = encodeURI(`https://trrevvorr.github.io/InternetPoints/authorize/authorizeInstagram?particle_credentials=${particleCredentials}`);
	const instagramRequest = `https://api.instagram.com/oauth/authorize/?client_id=${instagramClientId}&response_type=token&redirect_uri=${redirectURI}`;

	window.location.href = instagramRequest;
}

function encodeParticleCredentials(particleAccessToken, particleDeviceId) {
	// see authorizeInstagram.js for decoding
	const delimeter = "-";
	return particleAccessToken + delimeter + particleDeviceId;
}