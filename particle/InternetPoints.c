// This #include statement was automatically added by the Particle IDE.
#include <SoftAPLib.h>
#include <ledmatrix-max7219-max7221.h>

// allows loop to continue even when trying to connect to a network
SYSTEM_THREAD(ENABLED);

// Initialize objects from the SoftAp lib
STARTUP(softap_set_application_page_handler(SoftAPLib::getPage, nullptr));

#pragma region globals {

// EEPROM globals
const int _STRING_BUF_SIZE = 101; // num characters + 1 for null character
const int _BUF_ADDRESS = 0;       // EEPROM starting address

// Instagram globals
const int _DISPLAY_UPDATE_INTERVAL = 60; // seconds, IG API rate limit = 200 requests / user / hour (>=18 sec between requests)
int _LastDisplayUpdate = 0;              // timestamp of when display was updated last
String _AccessToken = "";
const String FOLLOWERS_TYPE = "FOLLOWERS";
const String LIKES_TYPE = "LIKES";
String _DataType = LIKES_TYPE; // defaults to likes
String _Data = "";             // number of likes or followers
String _PrevData = _Data;
bool _DataDirty = true; // set to true when data is know to be out of date

// LED display globals
LEDMatrix *led;
const int _SCROLL_RATE = 100; // number of milliseconds between scroll increments
int _LastScroll = 0;          // value of millis() at last scroll increment
String _ScrollMessage = "";
int _ScrollX = 32;
bool _Scrolling = false;
int _OfflineThrottle = 0;
const int _OFFLINE_THROTTLE_MAX = 80;

// Button globals
const int _BUTTON_PIN = D5;
bool _ButtonPressed = false;
int _ButtonHolds = 0;
const int _BUTTON_PRESS_MAX = 160;
const int _BUTTON_PRESS_MIN = 9;

#pragma endregion globals }

void setup()
{
    pinMode(_BUTTON_PIN, INPUT_PULLUP);
    // register cloud functions and variables
    Particle.function("linkIG", linkIG);
    Particle.subscribe(System.deviceID() + "/hook-response/IGFollowers", getIGFollowersCallback, MY_DEVICES);
    Particle.subscribe(System.deviceID() + "/hook-response/IGLikes", getIGLikesCallback, MY_DEVICES);
    Particle.variable("data", _Data);
    Particle.variable("dataType", _DataType);

    initAccessToken();
    initDisplay();
}

void loop()
{
    if (shouldShowSetupInstructions())
    {
        // if no access token is linked, or particle is offline with no data to display
        showSetupInstructions();
    }
    else
    {
        hideSetupInstructions();
    }

    if (Particle.connected())
    {
        tryUpdateDataDisplay();
    }
    setOfflineStatus();
    check_button();
}

//////////////////////////////////////////////////////////////

#pragma region helpers {

#pragma region general {

// fetch new data to be displayed
void updateAndDisplayData(String accessToken)
{
    String dataType = getDataType();

    if (dataType == FOLLOWERS_TYPE)
    {
        getIGFollowers(accessToken);
    }
    else if (dataType == LIKES_TYPE)
    {
        getIGLikes(accessToken);
    }
    else
    {
        logError("Invalid DataType: " + dataType);
    }
}

// force display to update and refresh IG data
void forceUpdate()
{
    _LastDisplayUpdate = 0;
}

void logError(String message)
{
    Particle.publish("ERROR", message);
}

// determines if the device should start showing setup instructions
bool shouldShowSetupInstructions()
{
    // show instuctions if there is no IG access token stored
    if (getAccessToken() == "")
    {
        return true;
    }
    // don't show setup instructins during the first few seconds of boot time
    if (millis() < 6000)
    {
        return false;
    }
    // show instructions if the device is offline and there is no data to display (device has never been online)
    if (!Particle.connected() && getData() == "")
    {
        return true;
    }

    return false;
}

// call to show setup instructions
// to hide, call hideSetupInstructions
void showSetupInstructions()
{
    if (!isScrolling())
    {
        // one-time setup
        clearDisplay(true);
        setScrollMessage("Scan QR code to get started");
        startScrolling(true); // now isScrolling will return true;
    }

    tryScrollMessage();
}

// call to hide setup instructions
void hideSetupInstructions()
{
    if (isScrolling())
    {
        stopScrolling(); // isScrolling will now return false
        clearDisplay(true);
    }
}

#pragma endregion general }

#pragma region data {

String getData()
{
    return _Data;
}

String setData(String newData)
{
    _PrevData = _Data;
    _Data = newData;
    return _Data;
}

bool hasDataChanged()
{
    return _Data != _PrevData;
}

String getDataType()
{
    return _DataType;
}

String setDataType(String newDataType)
{
    if (newDataType == FOLLOWERS_TYPE)
    {
        _DataType = FOLLOWERS_TYPE;
    }
    else if (newDataType == LIKES_TYPE)
    {
        _DataType = LIKES_TYPE;
    }
    else
    {
        _DataType = FOLLOWERS_TYPE;
        logError("Attempted to set invalid DataType: " + newDataType);
    }

    return _DataType;
}

bool getDataDirty()
{
    return _DataDirty;
}

bool setDataDirty(bool newDataDirty)
{
    _DataDirty = newDataDirty;
    return _DataDirty;
}

#pragma endregion data }

#pragma endregion helpers }

//////////////////////////////////////////////////////////////

#pragma region LED display {

#pragma region general {

void initDisplay()
{
    // 4 displays per row, 1 display per column
    // optional pin settings - default: CLK = A0, CS = A1, D_OUT = A2
    // (pin settings is independent on HW SPI)
    led = new LEDMatrix(4, 1, A0, A1, A2);

    // > add every matrix in the order in which they have been connected <
    // the first matrix in a row, the first matrix in a column
    // vertical orientation (270°) and no mirroring (x, y axes) - last three args optional
    led->addMatrix(3, 0, 0, false, false);
    led->addMatrix(2, 0, 0, false, false);
    led->addMatrix(1, 0, 0, false, false);
    led->addMatrix(0, 0, 0, false, false);

    // set brightness (0-15)
    led->setIntensity(0);
}

// draw text
// set maxLen to 0 to disable text validation/formatting
void drawText(String text, int x, int maxLen)
{
    int fontWidth = 5;
    int space = 1;

    if (maxLen > 0)
    {
        text = formatText(text, maxLen);
    }

    int y = 0;
    for (int i = 0; i < text.length(); i++)
    {
        // Adafruit_GFX method
        led->drawChar(x + i * (fontWidth + space), y, text[i], true, false, 1);
    }

    led->flush(); // redraw display
}

String formatText(String text, int maxLength)
{
    if (text.length() > maxLength)
    {
        text = "MAX";
    }
    else
    {
        if (text == "")
        {
            text = "0";
        }
    }

    text = padStringLeft(text, maxLength);

    return text;
}

String padStringLeft(String text, int padLength)
{
    while (text.length() < padLength)
    {
        text = " " + text;
    }

    return text;
}

void clearDisplay(bool redraw)
{
    bool color = false; // turn off LEDs
    led->fillRect(0, 0, 32, 8, color);
    if (redraw)
    {
        led->flush(); // redraw display
    }
}

void setOfflineStatus()
{
    bool offline = !Particle.connected();
    bool blinkOn = _OfflineThrottle < _OFFLINE_THROTTLE_MAX / 2;
    _OfflineThrottle = (_OfflineThrottle + 1) % _OFFLINE_THROTTLE_MAX;

    bool color = offline && blinkOn;
    led->drawPixel(31, 7, color);
    led->flush(); // redraw display
}

#pragma endregion general }

#pragma region scrolling message {

String setScrollMessage(String message)
{
    _ScrollMessage = message;
    return _ScrollMessage;
}

String getScrollMessage()
{
    return _ScrollMessage;
}

// stops the scrolling message
// start again via startScrolling
void stopScrolling()
{
    _Scrolling = false;
}

// starts the scrolling message
// make sure you set the message using setScrollMessage
// stop with stopScrolling before tying to display anything else
void startScrolling(bool reset)
{
    if (reset)
    {
        _ScrollX = 32; // start off screen right
    }
    _Scrolling = true;
}

bool isScrolling()
{
    return _Scrolling;
}

int _calcScrollX()
{
    // display starts at 0 (far left), ends at 32 (far right)
    // message will start off-screen right then scroll across the screen
    // until the last character moves off the screen left

    // define boundaries
    int messageLength = getScrollMessage().length();
    const int fontWidth = 5;
    const int space = 1;
    const int start = 32;
    const int end = 0 - messageLength * (fontWidth + 1);
    // move left
    _ScrollX--;
    // wrap/loop when needed
    if (_ScrollX <= end)
    {
        _ScrollX = start;
    }

    return _ScrollX;
}

bool _shouldScroll()
{
    int mills = millis(); // millis() will overflow (go back to zero), after approximately 49 days.
    bool timeToUpdate = _LastScroll + _SCROLL_RATE <= mills;
    // if millis() could have reset since last update, scroll
    // this prevents message getting stuck on rollover
    // 10 is a safety buffer, but this is by no means bullet proof
    bool millsReset = mills <= _SCROLL_RATE + 10;

    return (timeToUpdate || millsReset);
}

// should only be called by tryScrollMessage()
void _scrollMessage()
{
    if (getScrollMessage() == "")
    {
        setScrollMessage("No Message Set");
    }

    drawText(getScrollMessage(), _calcScrollX(), 0);

    _LastScroll = millis();
}

void tryScrollMessage()
{
    if (_Scrolling && _shouldScroll())
    {
        _scrollMessage();
    }
}

#pragma endregion scrolling message }

#pragma region followers {

// display the number of followers with icon
void displayFollowers(String followers)
{
    clearDisplay(false);
    drawFollower(0);
    drawText(followers, 8, 4);
}

// draw a follower/person icon on LED display
void drawFollower(int startX)
{
    bool color = true; // turn on LEDs
    led->drawLine(startX + 3, 0, startX + 4, 0, color);
    led->drawLine(startX + 2, 1, startX + 5, 1, color);
    led->drawLine(startX + 2, 2, startX + 5, 2, color);
    led->drawLine(startX + 3, 3, startX + 4, 3, color);
    led->drawLine(startX + 2, 4, startX + 5, 4, color);
    led->drawLine(startX + 1, 5, startX + 6, 5, color);
    led->drawLine(startX + 1, 6, startX + 6, 6, color);

    led->flush(); // redraw display
}

#pragma endregion followers }

#pragma region likes {

// display the number of likes with icon
void displayLikes(String likes)
{
    clearDisplay(false);
    drawHeart(0);
    drawText(likes, 8, 4);
}

// draw a simple heart on LED display
void drawHeart(int startX)
{
    bool color = true; // turn on LEDs
    led->drawLine(startX + 1, 1, startX + 2, 1, color);
    led->drawLine(startX + 4, 1, startX + 5, 1, color);
    led->drawLine(startX + 0, 2, startX + 6, 2, color);
    led->drawLine(startX + 0, 3, startX + 6, 3, color);
    led->drawLine(startX + 1, 4, startX + 5, 4, color);
    led->drawLine(startX + 2, 5, startX + 4, 5, color);
    led->drawPixel(startX + 3, 6, color);

    led->flush(); // redraw display
}

#pragma endregion likes }

#pragma endregion LED display }

//////////////////////////////////////////////////////////////

#pragma region EEPROM {

// write data to EEPROM for perminate storage
// used to store IG token
void offlineWrite(String value)
{
    if (value.length() > _STRING_BUF_SIZE - 1)
    {
        logError("offlineWrite - value length exceeds max length");
    }
    else
    {
        char stringBuf[_STRING_BUF_SIZE];

        EEPROM.clear();

        value.getBytes((unsigned char *)stringBuf, _STRING_BUF_SIZE);
        EEPROM.put(_BUF_ADDRESS, stringBuf);
    }
}

// read data from EEPROM
// used to retrieve IG token
String offlineRead()
{
    const int _STRING_BUF_SIZE = 101; // num characters + 1 for null character
    char stringBuf[_STRING_BUF_SIZE];

    EEPROM.get(_BUF_ADDRESS, stringBuf);
    stringBuf[sizeof(stringBuf) - 1] = 0; // make sure it's null terminated

    String value(stringBuf);

    return value;
}

#pragma endregion EEPROM }

//////////////////////////////////////////////////////////////

#pragma region IG API {

#pragma region general {

// link instagram account
int linkIG(String accessToken)
{
    setData(""); // data shouldn't carry over between accounts
    Particle.publish("IGToken", accessToken);
    offlineWrite(accessToken);
    _AccessToken = accessToken;
    forceUpdate();
    return 1;
}

void tryUpdateDataDisplay()
{
    // update display data if it's time
    if (Time.now() >= _LastDisplayUpdate + _DISPLAY_UPDATE_INTERVAL)
    {
        updateAndDisplayData(_AccessToken);
        _LastDisplayUpdate = Time.now();
    }
}

String initAccessToken()
{
    _AccessToken = offlineRead();
    return _AccessToken;
}

String getAccessToken()
{
    return _AccessToken;
}

#pragma endregion general }

#pragma region followers {

// call webhook to get IG followers
void getIGFollowers(String accessToken)
{
    Particle.publish("IGFollowers", accessToken, PRIVATE);

    if (getDataDirty())
    {
        displayFollowers("----"); // loading indicator
    }
}

// callback to handle response from getIGFollowers request
void getIGFollowersCallback(const char *event, const char *followers)
{
    if (getDataType() == FOLLOWERS_TYPE)
    {
        setData(followers);
        setDataDirty(false);
        if (hasDataChanged())
        {
            displayFollowers(getData());
        }
    }
}

#pragma endregion followers }

#pragma region likes {

// call webhook to get IG likes
void getIGLikes(String accessToken)
{
    Particle.publish("IGLikes", accessToken, PRIVATE);

    if (getDataDirty())
    {
        displayLikes("----"); // loading indicator
    }
}

// callback to handle response from getIGLikes request
void getIGLikesCallback(const char *event, const char *likes)
{
    if (getDataType() == LIKES_TYPE)
    {
        int totalLikes = sumLikes(likes);
        setData(String(totalLikes));
        setDataDirty(false);
        if (hasDataChanged())
        {
            displayLikes(getData());
        }
    }
}

int sumLikes(String response)
{
    int searchFrom = 0; // index of response to start searching from
    int sum = 0;
    int nextComma = 0;
    String nextNum = "";

    while (response.indexOf(",", searchFrom) >= 0)
    {
        nextComma = response.indexOf(",", searchFrom);
        nextNum = response.substring(searchFrom, nextComma);
        sum = sum + nextNum.toInt();
        searchFrom = nextComma + 1;
    }

    return sum;
}

#pragma endregion likes }

#pragma endregion IG API }

//////////////////////////////////////////////////////////////

#pragma region buttons {

void check_button()
{
    // if button is pressed in
    if (digitalRead(_BUTTON_PIN) == LOW)
    {
        _ButtonPressed = true;
        _ButtonHolds++;

        // triggered one "hold" after the button press zone
        if (_ButtonHolds == _BUTTON_PRESS_MAX + 1)
        {
            WiFi.listen();
        }
    }
    // if button is not pressed in
    else
    {
        // if button was released within the button press zone
        if (_ButtonPressed && (_ButtonHolds >= _BUTTON_PRESS_MIN) && (_ButtonHolds <= _BUTTON_PRESS_MAX))
        {
            toggleDataType();
        }

        // reset button state
        _ButtonPressed = false;
        _ButtonHolds = 0;
    }
}

String toggleDataType()
{
    String dataType = getDataType();
    if (dataType == FOLLOWERS_TYPE)
    {
        setDataType(LIKES_TYPE);
    }
    else if (dataType == LIKES_TYPE)
    {
        setDataType(FOLLOWERS_TYPE);
    }

    setDataDirty(true); // since type has changed, current data is in accurate
    forceUpdate();
    return getDataType();
}

#pragma endregion buttons }