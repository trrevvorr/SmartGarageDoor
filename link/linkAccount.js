// assuming url = https://trrevvorr.github.io/InternetPoints/link/linkAccount?particle_access_token=<TOKEN>&particle_device_id=<TOKEN>&instagram_client_id=<TOKEN>

function parseURL() {
	const urlParams = new URLSearchParams(window.location.search);
	const particleAccessToken = urlParams.get("particle_access_token");
	const particleDeviceId = urlParams.get("particle_device_id");
	const instagramClientId = urlParams.get("instagram_client_id");

	return { particleAccessToken, particleDeviceId, instagramClientId };
}

function linkInstagram() {
	const { particleAccessToken, particleDeviceId, instagramClientId } = parseURL();
	const particleCredentials = encodeParticleCredentials(particleAccessToken, particleDeviceId);
	const redirectURI = encodeURI(`https://trrevvorr.github.io/InternetPoints/authorize/authorizeInstagram?particle_credentials=${particleCredentials}`);
	const instagramRequest = `https://api.instagram.com/oauth/authorize/?client_id=${instagramClientId}&response_type=token&redirect_uri=${redirectURI}`;

	window.location.href = instagramRequest;
}

function encodeParticleCredentials(particleAccessToken, particleDeviceId) {
	// see authorizeInstagram.js for decoding
	const delimeter = "-";
	return particleAccessToken + delimeter + particleDeviceId;
}

function startPingDevice() {
	const { particleAccessToken, particleDeviceId } = parseURL();
	pingDevice(particleAccessToken, particleDeviceId);
}

// send instagram token down to photon device
function pingDevice(particleAccessToken, particleDeviceId) {
	$.ajax({
		url: `https://api.particle.io/v1/devices/${particleDeviceId}/ping`,
		data: {
			access_token: particleAccessToken,
		},
		type: 'PUT',
		success: (data) => { pingSuccess(data) },
	});
}

function pingSuccess(response) {
	if (response.online) {
		document.querySelector("body").className = "onlineState";
	} else {
		document.querySelector("body").className = "offlineState";
	}
}

function timeout() {
	if (document.querySelector("body").className === "loadingState") {
		document.querySelector("body").className = "offlineState"
	}
}

setTimeout(() => {
	timeout();
}, 10000);