// assuming url = https://trrevvorr.github.io/InternetPoints/authorize/authorizeInstagram?particle_access_token=<TOKEN>&particle_device_id=<TOKEN>#access_token=ACCESS-TOKEN

const urlParams = new URLSearchParams(window.location.search);
const particleAccessToken = urlParams.get("particle_access_token");
const particleDeviceId = urlParams.get("particle_device_id");
const instagramAccessToken = window.location.hash;
console.log([particleAccessToken, particleDeviceId, instagramAccessToken])
const particleRequest = `https://api.particle.io/v1/devices/${particleDeviceId}/authorizeInstagram?access_token=${particleAccessToken}&arg=${instagramAccessToken}`;

const statusNode = document.querySelector("#status");
statusNode.textContent = "Instagram Account Linked!"