### Step Zero
- Create a Github pages site for registering a device
  - Account authorization page
    - Choose from available accounts the account you want to authorize
    - "Link Instagram" button links to: `https://api.instagram.com/oauth/authorize/?client_id=CLIENT-ID&redirect_uri=REDIRECT-URI&response_type=code`
    - Device has QR on back linking to this page
  - Each accout type (that requires it) has a `REDIRECT-URI` used for Step Two
    - For example: `http://your-redirect-uri?code=CODE`

### Step One
- QR Code on the back of device links to afformetioned account authorization page
- Once the user scans the QR Code, they then the choose to "Link Instagram", they are redirected to Instagram's account authorization page
- QR Code link includes optional `state` parameter which includes the device ID. This makes Step Two possible
- **WARNING**: sending the device ID over a URL like this isn't very secure. 

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
