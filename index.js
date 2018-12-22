// assuming url = https://trrevvorr.github.io/InternetPoints/link/linkAccount?particle_access_token=<TOKEN>&particle_device_id=<TOKEN>

function parseURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const particleAccessToken = urlParams.get("particle_access_token");
  const particleDeviceId = urlParams.get("particle_device_id");

  return { particleAccessToken, particleDeviceId };
}

function startPingDevice() {
  const { particleAccessToken, particleDeviceId } = parseURL();
  pingDevice(particleAccessToken, particleDeviceId);
}

function pingDevice(particleAccessToken, particleDeviceId) {
  $.ajax({
    url: `https://api.particle.io/v1/devices/${particleDeviceId}/ping`,
    data: {
      access_token: particleAccessToken
    },
    type: "PUT",
    success: data => {
      pingSuccess(data);
    }
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
    document.querySelector("body").className = "offlineState";
  }
}

setTimeout(() => {
  timeout();
}, 10000);
