#include <WiFi.h>
#include <PubSubClient.h>
#include <ESP32Servo.h>
#include <DHT.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// Thông tin Wi-Fi
const char* ssid = "47/52/11";
const char* password = "12345789";
//const char* ssid = "socola";
//const char* password = "88888888";

// Thông tin MQTT (Mosquitto)
const char* mqttServer = "broker.hivemq.com";
const int mqttPort = 1883;

// MQTT Topics for device control (subscribe)
const char* lights_topic = "greenhouse/devices/light/control"; 
const char* window_topic = "greenhouse/devices/window/control";
const char* fan_topic = "greenhouse/devices/fan/control";
const char* watering_topic = "greenhouse/devices/pump/control";
const char* door_topic = "greenhouse/devices/door/control";
const char* lcd_topic = "greenhouse/devices/lcd/control";

// MQTT Topics for sensor data (publish)
const char* temp_topic = "greenhouse/sensors/temperature";
const char* humidity_topic = "greenhouse/sensors/humidity";
const char* soil_moisture_topic = "greenhouse/sensors/soil";
const char* light_level_topic = "greenhouse/sensors/light";
const char* water_level_topic = "greenhouse/sensors/water";

LiquidCrystal_I2C lcd(0x27,16,2);

WiFiClient espClient;
PubSubClient client(espClient);

// Constant and pins
unsigned long lastSendTime1 = 0;
unsigned long lastSendTime2 = 0;
unsigned long lastSendTime3 = 0;
int i = 0; // Biến đếm

const int Led = 32;
const int Photonresistor = 35;
const int echo_pin = 33;
const int trig_pin = 25;
const int window_pin = 26;
const int door_pin = 27;
const int rain_pin = 39;
//const int pump = 15;
const int moisture_pin = 36;
const int float_switch = 14;

const int PIR_in_pin = 2;
const int pump = 4;
const int fan = 12;

DHT dht(15, DHT11);

Servo windowServo;
Servo doorServo;

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
  //pinMode(pump, OUTPUT);
  pinMode(Photonresistor, INPUT);
  pinMode(trig_pin, OUTPUT);
  pinMode(echo_pin, INPUT);
  pinMode(rain_pin, INPUT);
  pinMode(PIR_in_pin, INPUT);
  pinMode(moisture_pin, INPUT);
  pinMode(float_switch, INPUT_PULLUP);
  pinMode(pump, OUTPUT);
  pinMode(fan, OUTPUT);

  lcd.init();
  lcd.setCursor(0,0);
  lcd.print("Hello World");
}

void loop() {
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

  // Gửi dữ liệu sensor qua MQTT mỗi 5 giây
  if (millis() - lastSendTime2 > 5000) {
    lastSendTime2 = millis();
    
    // Gửi dữ liệu sensor theo topics của backend
    sendTemperatureValue(t);
    sendHumidityValue(h);
    sendSoilMoistureValue(moisture);
    sendWaterLevelValue(FloatSwitchValue);
    sendLightLevelValue(Photon_value);
    sendRainSensorValue(rainvalue);
  }
}

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

void reconnect() {
  while (!client.connected()) {
    Serial.println("Attempting MQTT connection...");
    String clientId = "ESP32Client-" + String(random(0xffff), HEX);

    if (client.connect(clientId.c_str())) {
      Serial.println("Connected to MQTT!");
      client.subscribe(lights_topic);
      client.subscribe(fan_topic);
      client.subscribe(watering_topic);
      client.subscribe(door_topic);
      client.subscribe(window_topic);
      client.subscribe(lcd_topic);
    } else {
      Serial.print("Failed to connect, rc=");
      Serial.print(client.state());
      Serial.println();
      delay(5000);
    }
  }
}

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

void sendPhotonresistorValue(int Photon_value) {
  String payload = String(Photon_value);
  client.publish(light_level_topic, payload.c_str());
  Serial.println("Sent light level: " + payload);
}

void sendUltraSonicValue(long distance) {
  String payload = String(distance);
  client.publish(water_level_topic, payload.c_str());
  Serial.println("Sent water level: " + payload);
}

void sendTemperatureValue(float temperature) {
  String payload = String(temperature);
  client.publish(temp_topic, payload.c_str());
  Serial.println("Sent temperature: " + payload);
}

void sendHumidityValue(float humidity) {
void sendHumidityValue(float humidity) {
  String payload = String(humidity);
  client.publish(humidity_topic, payload.c_str());
  Serial.println("Sent humidity: " + payload);
}

void sendSoilMoistureValue(int moisture) {
  String payload = String(moisture);
  client.publish(soil_moisture_topic, payload.c_str());
  Serial.println("Sent soil moisture: " + payload);
}

void sendWaterLevelValue(int waterLevel) {
  String payload = String(waterLevel);
  client.publish(water_level_topic, payload.c_str());
  Serial.println("Sent water level: " + payload);
}

void sendLightLevelValue(int lightLevel) {
  String payload = String(lightLevel);
  client.publish(light_level_topic, payload.c_str());
  Serial.println("Sent light level: " + payload);
}

void sendRainSensorValue(int rain) {
  String payload = String(rain);
  client.publish("greenhouse/sensors/rain", payload.c_str());
  Serial.println("Sent rain: " + payload);
}

void controlLights(char* value) {
  if (strcmp(value, "LOW") == 0) { // Compare C-style strings correctly
    digitalWrite(Led, LOW);
  } else {
    digitalWrite(Led, HIGH);
  }
}

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

void controlPump(char* value) {
  if (strcmp(value, "LOW") == 0) {
    digitalWrite(pump, LOW);
  }
  else {
    digitalWrite(pump, HIGH);
  }
}

void controlFan(char* value) {
  if (strcmp(value, "LOW") == 0) {
    digitalWrite(fan, LOW);
  }
  else {
    digitalWrite(fan, HIGH);
  }
}

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
  else if (strcmp(topic, fan_topic) == 0) {
    Serial.print("Fan activity");
    controlFan(message);
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
