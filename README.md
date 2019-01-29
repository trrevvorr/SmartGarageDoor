# Smart Garage Door Opener
Controls garage doors using a particle photon and a web interface

### How To
This is primarily a personal project, so it'll take a little work to get it working for yourself but here's how:
1. Order a Particle Photon: [link](https://store.particle.io/products/photon)
1. Order an 8 channel DC 5V relay. This may differ based on your use case, I needed 6 channels (one for each open, close, and stop function, for two garage doors)
1. Order two magnetic reed switches (each used to detect when a garage door is closed)
1. Flash `particle/garage-door-opener.ino` to your Photon
1. Hook up the relay to your Photon (Photon should be powered down)
	- See pin constants at top of `garage-door-opener.ino` for which pins to use
	- My garage door had contol pins that when grounded, sent an open, close, or stop command to the cooresponding garage door. When triggered by the Photon, the relay will ground the apropriate contol pin.
1. Hook up the reed switches to your Photon (Photon should still be powered down)
	- See pin constants at top of `garage-door-opener.ino` for which pins to use
	- Reed swtiches should be normally open (i.e. they should read closed when the door is closed)
1. Power up your Photon and navigate to `https://trrevvorr.github.io/SmartGarageDoor/?particle_access_token=<ACCESS_TOKEN>&particle_device_id=<DIVICE_ID>` with your Particle access token and device ID inserted in to the appropriate locations.
1. If you configured everything correctly, the web app should render to something like this ![example web app view](https://github.com/trrevvorr/SmartGarageDoor/blob/master/Screenshot%202019-01-28%20at%209.01.11%20PM.png?raw=true)

### Know Bugs
- Doesn't render properly on iOS (and probably OS X)
