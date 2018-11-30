// assuming url = https://trrevvorr.github.io/InternetPoints/link/linkAccount?particle_access_token=<TOKEN>&particle_device_id=<TOKEN>&instagram_client_id=<TOKEN>

function linkInstagram() {
	const urlParams = new URLSearchParams(window.location.search);
	const particleAccessToken = urlParams.get("particle_access_token");
	const particleDeviceId = urlParams.get("particle_device_id");
	const instagramClientId = urlParams.get("instagram_client_id");
	const redirectURI = encodeURI(`https://trrevvorr.github.io/InternetPoints/authorize/authorizeInstagram?particle_access_token=${particleAccessToken}&particle_device_id=${particleDeviceId}`);
	const instagramRequest = `https://api.instagram.com/oauth/authorize/?client_id=${instagramClientId}&response_type=token&redirect_uri=${redirectURI}`;

	window.location.href = instagramRequest;
}