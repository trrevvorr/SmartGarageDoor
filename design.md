### Step Zero
- Create a Github pages site for registering a device
  - Account authorization page
    - Choose from available accounts (Instagram only to start) the account you want to authorize
    - "Link Instagram" button links to: `https://api.instagram.com/oauth/authorize/?client_id=CLIENT-ID&redirect_uri=REDIRECT-URI&response_type=code`
    - Device has QR on back linking to this "Account authorization page"
  - Each accout type (that requires it) has a `REDIRECT-URI` used for Step Two
    - For example: `http://your-redirect-uri?code=CODE`

### Step One
- QR Code on the back of device links to afformetioned account authorization page
- QR Code link includes optional `state` parameter which includes the device ID. This tells the client which Photon it's talking to.
- **WARNING**: sending the device ID over a URL like this isn't very secure. 
- Once the user scans the QR Code, they are navigated to the "Account authorization page"
- Before rendering, the authorization page makes a request to the Photon, checking that:
  - The passed up device ID matches the account ID
  - The Photon device is online (if not, displays instructions for how to connect photon to the internet
  - **QUESTION**: how to let others connect photon to the internet without having a Particle account?
  - The Photon device is not already registered to an account (If so, ask if you wants to delete the old account and link a new one)
- If everything checks out, the user is presented with a "Link Instagram" button
- The button links to Instagram's account authorization page, using the link passed up from the QR code

### Step Two
- Receive the redirect from Instagram
- Forward on the code recieved to the Particle Photon, using the device ID stored in the state param.

### Step Three
- Once the code has been recieved on the Photon
- Request the access_token via POST request:
```
curl -F 'client_id=CLIENT_ID' \
-F 'client_secret=CLIENT_SECRET' \
-F 'grant_type=authorization_code' \
-F 'redirect_uri=AUTHORIZATION_REDIRECT_URI' \
-F 'code=CODE' \
https://api.instagram.com/oauth/access_token
```
Response:
```json
{
    "access_token": "fb2e77d.47a0479900504cb3ab4a1f626d174d2d",
    "user": {
        "id": "1574083",
        "username": "snoopdogg",
        "full_name": "Snoop Dogg",
        "profile_picture": "..."
    }
}
```
- Store the access_token for future use using eeprom
