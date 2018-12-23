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

const ACTION = {
  open: "open",
  close: "close"
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
    updateDoorStates();
  } else {
    setDoorState(SIDE.left, STATE.offline);
    setDoorState(SIDE.right, STATE.offline);
  }
}

function updateDoorStates() {
  updateDoorState(SIDE.left);
  updateDoorState(SIDE.right);
}

/**
 * makes ajax call to get the door state (open or closed)
 * @param side {string} which side (SIDE obj value) to get status for
 * @param particleAccessToken {string} access token for particle account
 * @param particleDeviceId {string} device ID of garage door opener device
 */
function updateDoorState(side) {
  const { particleAccessToken, particleDeviceId } = parseURL();
  const url = `https://api.particle.io/v1/devices/${particleDeviceId}/${side}_open?access_token=${particleAccessToken}`;
  $.get(url)
    .done((data, textStatus, jqXHR) => {
      setDoorStateSuccess(data, side);
    })
    .fail((jqXHR, textStatus, errorThrown) => {
      setDoorStateFail(errorThrown, side);
    });
}

function delayUpdateDoorState(side, delay) {
  setTimeout(() => {
    updateDoorState(side);
  }, delay);
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
  const oldState = doorFrame.getAttribute("state");
  doorFrame.setAttribute("state", state);

  // if state just changed from loading, enable transitions
  if (oldState === STATE.loading) {
    // give DOM time to render post-loading state
    setTimeout(() => {
      doorFrame.querySelector(".door").classList.add("transition");
    }, 100);
  }
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

function closeLeft() {
  operateDoor(ACTION.close, SIDE.left);
}
function openLeft() {
  operateDoor(ACTION.open, SIDE.left);
}
function closeRight() {
  operateDoor(ACTION.close, SIDE.right);
}
function openRight() {
  operateDoor(ACTION.open, SIDE.right);
}

function operateDoor(action, side) {
  const stateDelay = action === ACTION.close ? 10000 : 500; // closing takes about 10 sec
  const newState = action === ACTION.close ? STATE.closed : STATE.open;
  setDoorState(side, newState); // assume the operation will succeed

  const { particleAccessToken, particleDeviceId } = parseURL();
  const url = `https://api.particle.io/v1/devices/${particleDeviceId}/operate`;
  const data = {
    access_token: particleAccessToken,
    arg: action + " " + side
  };
  $.post(url, data)
    .done(() => {
      delayUpdateDoorState(side, stateDelay);
    })
    .fail(() => {
      setDoorState(side, STATE.offline);
    });
}

// update the state every 30 seconds
setInterval(() => {
  updateDoorStates();
}, 30000);
