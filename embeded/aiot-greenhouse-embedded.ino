#include <WiFi.h>                // For Wi-Fi connectivity
#include <PubSubClient.h>       // For MQTT communication
#include <ESP32Servo.h>         // For controlling servo motors
#include <DHT.h>                // For DHT temperature and humidity sensor
#include <Wire.h>               // For I2C communication
#include <LiquidCrystal_I2C.h>  // For LCD display via I2C
#include <es/**
 * @brief Publishes the water level value to the MQTT broker.
 *
 * Converts the water level value to binary: 0 = normal, 1 = flooded
 *
 * @param[in] waterLevel The water level measured by float switch (0 or 1).
 *
 * @return void
 */
void sendWaterLevelValue(int waterLevel) {
  // Convert to binary: 0 = normal (no flood), 1 = flooded
  int binaryValue = (waterLevel == 0) ? 1 : 0; // Float switch: LOW = water present (flood)
  String payload = String(binaryValue);
  client.publish(water_level_topic, payload.c_str());
  Serial.println("Sent water level (binary): " + payload + " (0=normal, 1=flooded)");
}     // For watchdog timer

// ==============================
// Wi-Fi Configuration
// ==============================
const char* ssid = "47/52/11";
const char* password = "12345789";

// ==============================
// MQTT Broker Configuration
// ==============================
const char* mqttServer = "tcp://mqtt.noboroto.id.vn";
const int mqttPort = 1883;

// ==============================
// MQTT Topics - Control
// ==============================
const char* lights_topic     = "greenhouse/devices/light/control"; 
const char* window_topic     = "greenhouse/devices/window/control";
const char* microphone_topic = "greenhouse/devices/microphone/control";
const char* watering_topic   = "greenhouse/devices/pump/control";
const char* door_topic       = "greenhouse/devices/door/control";
const char* lcd_topic        = "greenhouse/devices/lcd/control";

// ==============================
// MQTT Topics - Sensor Data
// ==============================
const char* temp_topic         = "greenhouse/sensors/temperature";
const char* humidity_topic     = "greenhouse/sensors/humidity";
const char* soil_moisture_topic= "greenhouse/sensors/soil";
const char* light_level_topic  = "greenhouse/sensors/light";
const char* water_level_topic  = "greenhouse/sensors/water";

// LCD setup for 16x2 I2C display at address 0x27
LiquidCrystal_I2C lcd(0x27, 16, 2);

// MQTT client setup
WiFiClient espClient;
PubSubClient client(espClient);

// ==============================
// GPIO Pin Definitions
// ==============================
const int Led            = 32;
const int Photonresistor = 35;
const int echo_pin       = 33;
const int trig_pin       = 25;
const int window_pin     = 26;
const int door_pin       = 27;
const int rain_pin       = 39;
const int moisture_pin   = 36;
const int float_switch   = 14;
const int PIR_in_pin     = 2;
const int pump           = 4;
const int microphone     = 12;

DHT dht(15, DHT11);          // DHT11 sensor on GPIO 15

Servo windowServo;           // Servo motor for window
Servo doorServo;             // Servo motor for door

// Constant and pins
unsigned long lastSendTime1 = 0;
unsigned long lastSendTime2 = 0;
unsigned long lastSendTime3 = 0;
unsigned long lastMotionCheck = 0;
unsigned long lastWaterCheck = 0;
int i = 0; // Biến đếm
int lastPIRState = LOW; // Track PIR state changes

// Error counting for system recovery
int wifiErrorCount = 0;
int mqttErrorCount = 0;

/**
 * @brief Initializes the ESP32 and its peripherals.
 *
 * This function sets up the DHT sensor, initializes the serial communication,
 * connects to Wi-Fi, attaches servos, and configures MQTT client settings.
 * It also initializes the LCD display and sets pin modes for various sensors.
 *
 * @return void
 */
void setup() {
  dht.begin();
  Serial.begin(115200);

  setup_wifi();

  windowServo.attach(window_pin);
  windowServo.write(180);

  doorServo.attach(door_pin);
  doorServo.write(90);

  client.setServer(mqttServer, mqttPort);
  client.setCallback(mqttCallback);

  // pins
  pinMode(Led, OUTPUT);
  pinMode(Photonresistor, INPUT);
  pinMode(trig_pin, OUTPUT);
  pinMode(echo_pin, INPUT);
  pinMode(rain_pin, INPUT);
  pinMode(PIR_in_pin, INPUT);
  pinMode(moisture_pin, INPUT);
  pinMode(float_switch, INPUT_PULLUP);
  pinMode(pump, OUTPUT);
  pinMode(microphone, OUTPUT);

  lcd.init();
  lcd.setCursor(0,0);
  lcd.print("Hello World");
  
  // Enable watchdog timer (30 seconds timeout)
  esp_task_wdt_init(30, true);
  esp_task_wdt_add(NULL);
  
  Serial.println("Watchdog timer enabled");
}

/**
 * @brief Main loop function for the ESP32.
 *
 * This function handles MQTT connection, sensor readings, and data publishing.
 * It also updates the LCD display with humidity and temperature values.
 *
 * @return void
 */
void loop() {
  // Reset watchdog timer
  esp_task_wdt_reset();
  
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  int Photon_value = analogRead(Photonresistor);
  long distanceCm = getDistance();
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  int rainvalue = analogRead(rain_pin);
  int moisture = analogRead(moisture_pin);

  int PIRValue = digitalRead(PIR_in_pin);
  int FloatSwitchValue = digitalRead(float_switch);

  lcd.backlight();

  // Motion detection continuous (FR-010) - Check every second
  if (millis() - lastMotionCheck > 1000) {
    lastMotionCheck = millis();
    
    if (PIRValue == HIGH && lastPIRState == LOW) {
      // Motion detected - state changed from LOW to HIGH
      client.publish("greenhouse/sensors/motion", "1");
      Serial.println("Motion detected and sent!");
      
      // Auto open door if motion detected
      controlDoor("HIGH");
      
      lastPIRState = HIGH;
    } else if (PIRValue == LOW && lastPIRState == HIGH) {
      // Motion stopped
      client.publish("greenhouse/sensors/motion", "0");
      Serial.println("Motion stopped");
      lastPIRState = LOW;
    }
  }

  // Water level check every 1 minute (FR-007)
  if (millis() - lastWaterCheck > 60000) {
    lastWaterCheck = millis();
    sendWaterLevelValue(FloatSwitchValue);
  }

  // Gửi dữ liệu sensor qua MQTT mỗi 5 giây
  if (millis() - lastSendTime2 > 5000) {
    lastSendTime2 = millis();
    
    // Gửi dữ liệu sensor theo topics của backend
    sendTemperatureValue(t);
    sendHumidityValue(h);
    sendSoilMoistureValue(moisture);
    sendLightLevelValue(Photon_value);
    sendRainSensorValue(rainvalue);
    
    // FR-006: Gửi dữ liệu chiều cao cây (plant height)
    sendPlantHeightValue(distanceCm);
  }
  
  // Check if system is healthy and attempt recovery if needed
  if (!client.connected() && WiFi.status() != WL_CONNECTED) {
    Serial.println("System unhealthy, attempting recovery...");
    setup_wifi();
    reconnect();
  }
}

/**
 * @brief Connects the ESP32 to a Wi-Fi network.
 *
 * This function attempts to connect the ESP32 to the specified Wi-Fi network using
 * the global `ssid` and `password` variables. It blocks execution until the connection
 * is successfully established.
 *
 * @return void
 *
 * @note On successful connection, the function prints the assigned IP address to the Serial Monitor.
 */
void setup_wifi() {
  Serial.print("Connecting to WiFi...");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }

  Serial.println("Connected to WiFi!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

/**
 * @brief Reconnects the ESP32 to the MQTT broker.
 *
 * This function repeatedly attempts to establish a connection with the MQTT broker.
 * Upon successful connection, it subscribes to all relevant control topics required for
 * device operation.
 *
 * @return void
 *
 * @note This function blocks until the connection is established. It uses a random client ID to avoid conflicts.
 */
void reconnect() {
  int retryCount = 0;
  while (!client.connected() && retryCount < 5) {
    Serial.println("Attempting MQTT connection...");
    String clientId = "ESP32Client-" + String(random(0xffff), HEX);

    if (client.connect(clientId.c_str())) {
      Serial.println("Connected to MQTT!");
      mqttErrorCount = 0; // Reset error count on success
      
      client.subscribe(lights_topic);
      client.subscribe(microphone_topic);
      client.subscribe(watering_topic);
      client.subscribe(door_topic);
      client.subscribe(window_topic);
      client.subscribe(lcd_topic);
    } else {
      Serial.print("Failed to connect, rc=");
      Serial.print(client.state());
      Serial.println();
      
      retryCount++;
      mqttErrorCount++;
      
      if (mqttErrorCount > 10) {
        Serial.println("Too many MQTT errors, restarting ESP32...");
        ESP.restart();
      }
      
      delay(5000);
    }
  }
}

/**
 * @brief Measures the distance using an ultrasonic sensor.
 *
 * This function sends a trigger pulse and measures the echo time to calculate the distance
 * between the sensor and an object.
 *
 * @return The measured distance in centimeters.
 *
 * @note The calculation is based on the speed of sound (0.034 cm/us).
 */
long getDistance() {
  digitalWrite(trig_pin, LOW);
  delayMicroseconds(2);
  digitalWrite(trig_pin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig_pin, LOW);

  long duration = pulseIn(echo_pin, HIGH);

  long distanceCm = duration * 0.034/2;

  return distanceCm;
}

/**
 * @brief Publishes the current temperature to the MQTT broker.
 *
 * Converts the temperature value to a string and publishes it to the configured
 * `temp_topic`.
 *
 * @param[in] value The temperature in Celsius.
 *
 * @return void
 */
void sendPhotonresistorValue(int Photon_value) {
  String payload = String(Photon_value);
  client.publish(light_level_topic, payload.c_str());
  Serial.println("Sent light level: " + payload);
}

/**
 * @brief Publishes the distance measured by the ultrasonic sensor.
 *
 * Converts the distance value to a string and publishes it to the configured
 * `water_level_topic`.
 *
 * @param[in] distance The measured distance in centimeters.
 *
 * @return void
 */
void sendUltraSonicValue(long distance) {
  String payload = String(distance);
  client.publish(water_level_topic, payload.c_str());
  Serial.println("Sent water level: " + payload);
}

/**
 * @brief Publishes the temperature value to the MQTT broker.
 *
 * Converts the temperature value to a string and publishes it to the configured
 * `temp_topic`.
 *
 * @param[in] temperature The temperature in Celsius.
 *
 * @return void
 */
void sendTemperatureValue(float temperature) {
  String payload = String(temperature);
  client.publish(temp_topic, payload.c_str());
  Serial.println("Sent temperature: " + payload);
}

/**
 * @brief Publishes the humidity value to the MQTT broker.
 *
 * Converts the humidity value to a string and publishes it to the configured
 * `humidity_topic`.
 *
 * @param[in] humidity The humidity percentage.
 *
 * @return void
 */
void sendHumidityValue(float humidity) {
  String payload = String(humidity);
  client.publish(humidity_topic, payload.c_str());
  Serial.println("Sent humidity: " + payload);
}

/**
 * @brief Publishes the soil moisture value to the MQTT broker.
 *
 * Converts the analog soil moisture reading to binary value (0 or 1) and publishes 
 * it to the configured `soil_moisture_topic`.
 * 
 * Conversion logic:
 * - Raw analog reading from sensor (0-4095 on ESP32)
 * - Convert to binary: 1 = có nước (wet), 0 = khô (dry)
 * - Threshold: readings below 2000 indicate wet soil (1), above 2000 indicate dry soil (0)
 *
 * @param[in] moisture The raw analog soil moisture reading (0-4095).
 *
 * @return void
 */
void sendSoilMoistureValue(int moisture) {
  // Convert analog reading to binary
  // Lower analog values = more moisture = wet (1)
  // Higher analog values = less moisture = dry (0)
  int binaryValue = (moisture < 2000) ? 1 : 0;
  
  String payload = String(binaryValue);
  client.publish(soil_moisture_topic, payload.c_str());
  Serial.println("Sent soil moisture: " + payload + " (raw: " + String(moisture) + ")");
}

/**
 * @brief Publishes the water level value to the MQTT broker.
 *
 * Converts the water level value to a string and publishes it to the configured
 * `water_level_topic`.
 *
 * @param[in] waterLevel The water level status (0 or 1).
 *
 * @return void
 */
void sendWaterLevelValue(int waterLevel) {
  String payload = String(waterLevel);
  client.publish(water_level_topic, payload.c_str());
  Serial.println("Sent water level: " + payload);
}

/**
 * @brief Publishes the light level value to the MQTT broker.
 *
 * Converts the light level value to binary: 0 = dark, 1 = bright
 *
 * @param[in] lightLevel The light level measured by the photonresistor.
 *
 * @return void
 */
void sendLightLevelValue(int lightLevel) {
  // Convert to binary: 0 = dark, 1 = bright (threshold: 500)
  int binaryValue = (lightLevel > 500) ? 1 : 0;
  String payload = String(binaryValue);
  client.publish(light_level_topic, payload.c_str());
  Serial.println("Sent light level (binary): " + payload + " (0=dark, 1=bright) - Raw: " + String(lightLevel));
}

/**
 * @brief Publishes the rain sensor value to the MQTT broker.
 *
 * Converts the rain sensor value to binary: 0 = no rain, 1 = raining
 *
 * @param[in] rain The rain sensor value.
 *
 * @return void
 */
void sendRainSensorValue(int rain) {
  // Convert to binary: 0 = no rain, 1 = raining (threshold: 500)
  int binaryValue = (rain < 500) ? 1 : 0; // Lower analog value = more moisture = rain
  String payload = String(binaryValue);
  client.publish("greenhouse/sensors/rain", payload.c_str());
  Serial.println("Sent rain (binary): " + payload + " (0=no rain, 1=raining) - Raw: " + String(rain));
}

/**
 * @brief Publishes the plant height value to the MQTT broker.
 *
 * Converts the plant height value to a string and publishes it to the configured
 * `height_topic`.
 *
 * @param[in] height The plant height measured by ultrasonic sensor in cm.
 *
 * @return void
 */
void sendPlantHeightValue(long height) {
  String payload = String(height);
  client.publish("greenhouse/sensors/height", payload.c_str());
  Serial.println("Sent plant height: " + payload + " cm");
}

/**
 * @brief Controls the LED light based on MQTT command.
 *
 * Turns the light ON or OFF based on the received command string ("HIGH" or "LOW").
 *
 * @param[in] value A string representing the desired light state.
 *
 * @return void
 *
 * @note Uses digitalWrite with the configured LED pin.
 */
void controlLights(char* value) {
  if (strcmp(value, "LOW") == 0) { // Compare C-style strings correctly
    digitalWrite(Led, LOW);
  } else {
    digitalWrite(Led, HIGH);
  }
}

/**
 * @brief Controls the window servo motor.
 *
 * Opens or closes the window based on the command received from MQTT.
 * The servo angle is smoothly adjusted to simulate realistic motion.
 *
 * @param[in] value A string representing the desired window state ("HIGH" or "LOW").
 *
 * @return void
 */
void controlWindow(char* value) {
  if (strcmp(value, "LOW") == 0) { // Compare C-style strings correctly
    for(int posDegrees = 140; posDegrees <= 180; posDegrees++) {
      windowServo.write(posDegrees);
      delay(20);
    } 
  } else {
    for(int posDegrees = 180; posDegrees >= 140; posDegrees--) {
      windowServo.write(posDegrees);
      delay(20);
    }
  }
}

/**
 * @brief Controls the door servo motor.
 *
 * Opens or closes the door smoothly based on the MQTT command received.
 *
 * @param[in] value A string representing the desired door state ("HIGH" or "LOW").
 *
 * @return void
 */
void controlDoor(char* value) {
  if (strcmp(value, "LOW") == 0) { // Compare C-style strings correctly
    for(int posDegrees = 160; posDegrees >= 90; posDegrees--) {
      doorServo.write(posDegrees);
      delay(20);
    }
  } else {
    for(int posDegrees = 90; posDegrees <= 160; posDegrees++) {
      doorServo.write(posDegrees);
      delay(20);
    } 
  }
}

/**
 * @brief Controls the pump.
 *
 * Opens or closes the pump smoothly based on the MQTT command received.
 *
 * @param[in] value A string representing the desired pump state ("HIGH" or "LOW").
 *
 * @return void
 */
void controlPump(char* value) {
  if (strcmp(value, "LOW") == 0) {
    digitalWrite(pump, LOW);
  }
  else {
    digitalWrite(pump, HIGH);
  }
}

/**
 * @brief Controls the microphone.
 *
 * Opens or closes the microphone smoothly based on the MQTT command received.
 *
 * @param[in] value A string representing the desired microphone state ("HIGH" or "LOW").
 *
 * @return void
 */
void controlmicrophone(char* value) {
  if (strcmp(value, "LOW") == 0) {
    digitalWrite(microphone, LOW);
  }
  else {
    digitalWrite(microphone, HIGH);
  }
}

/**
 * @brief Displays humidity and temperature on the I2C LCD screen.
 *
 * This function expects a message in the format "Humidity| Temperature" and
 * displays each value on a separate row of the LCD, centered.
 *
 * @param[in] message A character array containing humidity and temperature separated by '|'.
 *
 * @return void
 *
 * @note The function automatically clears the LCD before updating content.
 */
void controlLCD(char* message) {
  char* humidityToken = strtok(message, "|");
  char* temperatureToken = strtok(NULL, "|");

  if (humidityToken != NULL && temperatureToken != NULL) {
    // Extract Humidity value
    char humidity[16];
    snprintf(humidity, sizeof(humidity), "%s", humidityToken);

    // Extract Temperature value
    char temperature[16];
    snprintf(temperature, sizeof(temperature), "%s", temperatureToken + 1); // Skip the leading space

    // Clear the LCD
    lcd.clear();

    // Center Humidity on the top row
    int humidityPadding = (16 - strlen(humidity)) / 2; // Calculate padding
    lcd.setCursor(humidityPadding, 0);                // Set cursor to top row
    lcd.print(humidity);                              // Print Humidity

    // Center Temperature on the second row
    int temperaturePadding = (16 - strlen(temperature)) / 2; // Calculate padding
    lcd.setCursor(temperaturePadding, 1);                   // Set cursor to second row
    lcd.print(temperature);                                 // Print Temperature
  }
}

/**
 * @brief Handles incoming MQTT messages.
 *
 * This function parses the MQTT message payload and routes control commands
 * to the appropriate device handler based on the topic.
 *
 * @param[in] topic The MQTT topic the message was received on.
 * @param[in] payload The message payload.
 * @param[in] length The length of the payload.
 *
 * @return void
 *
 * @note The payload is converted to a null-terminated string for easier parsing.
 */
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");

  // Combine payload into a single char array
  char message[length + 1];
  for (unsigned int i = 0; i < length; i++) {
    message[i] = (char)payload[i];
  }
  message[length] = '\0'; // Null-terminate the string
  Serial.println(message);

  // Check topic for device control
  if (strcmp(topic, lights_topic) == 0) {
    controlLights(message);
  }
  else if (strcmp(topic, window_topic) == 0) {
    controlWindow(message);
  }
  else if (strcmp(topic, door_topic) == 0) {
    Serial.print("Door activity");
    controlDoor(message);
  }
  else if (strcmp(topic, microphone_topic) == 0) {
    Serial.print("microphone activity");
    controlmicrophone(message);
  }
  else if (strcmp(topic, watering_topic) == 0) {
    Serial.print("Pump activity");
    controlPump(message);
  }

  else if (strcmp(lastSegment, "lcd") == 0) {
    Serial.print("Show LCD");
    controlLCD(message);
  }
}
