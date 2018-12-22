// assuming url = https://trrevvorr.github.io/SmartGarageDoor?particle_access_token=<TOKEN>&particle_device_id=<TOKEN>

const SIDE = {
  left: "left",
  right: "right"
};

const STATE = {
  loading: "loading",
  open: "open",
  closed: "closed",
  offline: "offline"
};

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
    retrieveDoorStates();
  } else {
    setDoorState(SIDE.left, STATE.offline);
    setDoorState(SIDE.right, STATE.offline);
  }
}

function retrieveDoorStates() {
  const { particleAccessToken, particleDeviceId } = parseURL();
  retrieveDoorState(SIDE.left, particleAccessToken, particleDeviceId);
  retrieveDoorState(SIDE.right, particleAccessToken, particleDeviceId);
}

/**
 * makes ajax call to get the door state (open or closed)
 * @param side {string} which side (SIDE obj value) to get status for
 * @param particleAccessToken {string} access token for particle account
 * @param particleDeviceId {string} device ID of garage door opener device
 */
function retrieveDoorState(side, particleAccessToken, particleDeviceId) {
  const url = `https://api.particle.io/v1/devices/${particleDeviceId}/${side}_open?access_token=${particleAccessToken}`;
  $.get(url)
    .done((data, textStatus, jqXHR) => {
      setDoorStateSuccess(data, side);
    })
    .fail((jqXHR, textStatus, errorThrown) => {
      setDoorStateFail(errorThrown, side);
    });
}

/**
 * success callback for door state, displays state on page
 * @param data {object} JSON response from device
 * @param side {string} which side (SIDE obj value) the state applies to
 */
function setDoorStateSuccess(data, side) {
  const openState = data.result ? STATE.open : STATE.closed;
  setDoorState(side, openState);
}

/**
 * failure callback for door state, displays error on page
 * @param errorThrown {string} error thrown from device
 * @param side {string} which side (SIDE obj value) the state applies to
 */
function setDoorStateFail(errorThrown, side) {
  setDoorState(side, STATE.offline);
}

function getDoorState(side) {
  const doorFrame = document.querySelector(`.doorframe.${side}`);
  return doorFrame.getAttribute("state");
}

function setDoorState(side, state) {
  const doorFrame = document.querySelector(`.doorframe.${side}`);
  doorFrame.setAttribute("state", state);
}

function timeout() {
  if (getDoorState(SIDE.left) === STATE.loading) {
    setDoorState(SIDE.left, STATE.offline);
  }
  if (getDoorState(SIDE.right) === STATE.loading) {
    setDoorState(SIDE.right, STATE.offline);
  }
}

setTimeout(() => {
  timeout();
}, 10000);
