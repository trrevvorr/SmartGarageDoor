// Trevor Ross
// 02/04/2016
//
// This function opens our garage door when triggered via IFTT app
// Publishes on trigger so we can tally the number of uses

#pragma region globals {

// RELAY SWITCH PIN CONSTANTS //
// left door pins
const int BUTTON_OL = D0;
const int BUTTON_CL = D1;
const int BUTTON_SL = D2;
// right door pins
const int BUTTON_OR = D3;
const int BUTTON_CR = D4;
const int BUTTON_SR = D5;

// REED SWITCH PIN CONSTANTS //
// door sensors
const int SENSOR_L = D7;
const int SENSOR_R = D6;

// door status variables
bool sensor_L_open = false;
bool sensor_R_open = false;
// presence detection
const String HOME = "home";
const String AWAY = "away";
String Presence = "";

#pragma endregion globals }

void setup()
{
    // Configure the pins
    pinMode(BUTTON_OL, OUTPUT);
    pinMode(BUTTON_CL, OUTPUT);
    pinMode(BUTTON_SL, OUTPUT);
    pinMode(BUTTON_OR, OUTPUT);
    pinMode(BUTTON_CR, OUTPUT);
    pinMode(BUTTON_SR, OUTPUT);

    // set all pins to high
    digitalWrite(BUTTON_OL, HIGH);
    digitalWrite(BUTTON_CL, HIGH);
    digitalWrite(BUTTON_SL, HIGH);
    digitalWrite(BUTTON_OR, HIGH);
    digitalWrite(BUTTON_CR, HIGH);
    digitalWrite(BUTTON_SR, HIGH);

    // configure sensor pins
    pinMode(SENSOR_L, INPUT_PULLUP);
    pinMode(SENSOR_R, INPUT_PULLUP);

    // declare the door functions, function("cloud_name", local_name)
    Particle.function("open_left", open_left);
    Particle.function("close_left", close_left);
    Particle.function("toggle_left", toggle_left);
    Particle.function("open_right", open_right);
    Particle.function("close_right", close_right);
    Particle.function("toggle_right", toggle_right);
    Particle.function("operate", operate);
    Particle.function("close_all", close_all);

    // register door status variables
    Particle.variable("left_open", sensor_L_open);
    Particle.variable("right_open", sensor_R_open);
}

void loop()
{
    check_door_positions();
}

#pragma region helpers {

void press_button(int button)
{
    digitalWrite(button, LOW);
    delay(200);
    digitalWrite(button, HIGH);
}

void check_door_positions()
{
    sensor_L_open = digitalRead(SENSOR_L) == LOW;
    sensor_R_open = digitalRead(SENSOR_R) == LOW;

    if (sensor_L_open || sensor_R_open)
    {
        if (Presence != HOME) {
            // state change
            Presence = HOME;
            Particle.publish("presence", HOME);
        }
    }
    else
    {
        if (Presence != AWAY) {
            // state change
            Presence = AWAY;
            Particle.publish("presence", AWAY);
        }
    }
}

#pragma endregion helpers }

#pragma region left door {

int open_left(String command)
{
    parse_and_delay(command);
    press_button(BUTTON_SL);
    delay(200);
    press_button(BUTTON_OL);

    Particle.publish("Event", "open_left");
    return 1;
}

int close_left(String command)
{
    parse_and_delay(command);
    press_button(BUTTON_SL);
    delay(200);
    press_button(BUTTON_CL);

    Particle.publish("Event", "close_left");
    return 1;
}

int toggle_left(String command)
{
    // door proximity switches needed for efficient toggle

    Particle.publish("Event", "toggle_left");
    return 1;
}

#pragma endregion left door }

#pragma region right door {

int open_right(String command)
{
    parse_and_delay(command);
    press_button(BUTTON_SR);
    delay(200);
    press_button(BUTTON_OR);

    Particle.publish("Event", "open_right");
    return 1;
}

int close_right(String command)
{
    parse_and_delay(command);
    press_button(BUTTON_SR);
    delay(200);
    press_button(BUTTON_CR);

    Particle.publish("Event", "close_right");
    return 1;
}

int toggle_right(String command)
{
    // door proximity switches needed for efficient toggle

    Particle.publish("Event", "toggle_right");
    return 1;
}

#pragma endregion right door }

#pragma region any door {

int operate(String command)
{
    Particle.publish("Event", command);

    if (strstr(command, "open") != NULL)
    {
        if (strstr(command, "left") != NULL)
        {
            open_left(command);
        }
        else if (strstr(command, "all") != NULL)
        {
            close_all(command);
        }
        else if (strstr(command, "both") != NULL)
        {
            close_all(command);
        }
        else
        {
            // open right door if no door is specified
            open_right(command);
        }
    }
    else if (strstr(command, "close") != NULL)
    {
        if (strstr(command, "left") != NULL)
        {
            close_left(command);
        }
        else if (strstr(command, "all") != NULL)
        {
            close_all(command);
        }
        else if (strstr(command, "both") != NULL)
        {
            close_all(command);
        }
        else
        {
            // open right door if no door is specified
            close_right(command);
        }
    }
    else
    {
        return -1;
    }
    return 1;
}

int parse_and_delay(String command)
{
    int minutes;

    if ((strstr(command, " 1 ") != NULL) || (strstr(command, " one ") != NULL))
    {
        minutes = 1;
    }
    else if ((strstr(command, " 2 ") != NULL) || (strstr(command, " two ") != NULL))
    {
        minutes = 2;
    }
    else if ((strstr(command, " 3 ") != NULL) || (strstr(command, " three ") != NULL))
    {
        minutes = 3;
    }
    else if ((strstr(command, " 4 ") != NULL) || (strstr(command, " four ") != NULL))
    {
        minutes = 4;
    }
    else if ((strstr(command, " 5 ") != NULL) || (strstr(command, " five ") != NULL))
    {
        minutes = 5;
    }
    else
    {
        minutes = 0;
    }

    delay(1000 * 60 * minutes);
    return 1;
}

int close_all(String command)
{
    parse_and_delay(command);
    close_left("");
    delay(200);
    close_right("");

    Particle.publish("Event", "close_all");
    return 1;
}

#pragma endregion any door }
