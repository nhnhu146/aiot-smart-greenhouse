#include <WiFi.h>                // For Wi-Fi connectivity
#include <PubSubClient.h>       // For MQTT communication
#include <ESP32Servo.h>         // For controlling servo motors
#include <DHT.h>                // For DHT temperature and humidity sensor
#include <Wire.h>               // For I2C communication
#include <LiquidCrystal_I2C.h>  // For LCD display via I2C

#include <voice_command_recognition_aiot_inferencing.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/i2s.h"

#define I2S_WS      18  // Word Select (LRCL)
#define I2S_SD      5   // Serial Data (DOUT from mic)
#define I2S_SCK     19  // Serial Clock (BCLK)
#define I2S_SAMPLE_RATE   (16000)
#define CONFIDENCE_THRESHOLD 0.85f


/** Audio buffers, pointers and selectors */
typedef struct {
    signed short *buffers[2];
    unsigned char buf_select;
    unsigned char buf_ready;
    unsigned int buf_count;
    unsigned int n_samples;
} inference_t;

static inference_t inference;
static const uint32_t sample_buffer_size = 2048;
static signed short sampleBuffer[sample_buffer_size];
static bool debug_nn = false; // Set this to true to see e.g. features generated from the raw signal
static int print_results = -(EI_CLASSIFIER_SLICES_PER_MODEL_WINDOW);
static bool record_status = true;
bool setup_mic = true;

// ==============================
// Wi-Fi Configuration
// ==============================
const char* ssid = "47/52/11";
const char* password = "12345789";

// const char* ssid = "choem5";
// const char* password = "@071104@";

// ==============================
// MQTT Broker Configuration
// ==============================
const char* mqttServer = "mqtt.noboroto.id.vn";
//const char* mqttServer = "85.119.83.194";;
const char* Username = "vision";
const char* Password = "vision";
const int mqttPort = 1883;

// ==============================
// MQTT Topics - Control
// ==============================
const char* lights_topic     = "greenhouse/devices/light/control"; 
const char* window_topic     = "greenhouse/devices/window/control";
const char* microphone_topic = "greenhouse/devices/microphone/control";
const char* watering_topic   = "greenhouse/devices/pump/control";
const char* door_topic       = "greenhouse/devices/door/control";

// ==============================
// MQTT Topics - Sensor Data
// ==============================
const char* temp_topic         = "greenhouse/sensors/temperature";
const char* humidity_topic     = "greenhouse/sensors/humidity";
const char* soil_moisture_topic= "greenhouse/sensors/soil";
const char* light_level_topic  = "greenhouse/sensors/light";
const char* water_level_topic  = "greenhouse/sensors/water";

const char* mode_topic = "greenhouse/system/mode";

const char* voice_command = "greenhouse/command";

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
  Serial.begin(115200);

  setup_wifi();
  // summary of inferencing settings (from model_metadata.h)
  Serial.println("Booting in MIC MODE");
  ei_printf("Inferencing settings:\n");
  ei_printf("\tInterval: ");
  ei_printf_float((float)EI_CLASSIFIER_INTERVAL_MS);
  ei_printf(" ms.\n");
  ei_printf("\tFrame size: %d\n", EI_CLASSIFIER_DSP_INPUT_FRAME_SIZE);
  ei_printf("\tSample length: %d ms.\n", EI_CLASSIFIER_RAW_SAMPLE_COUNT / 16);
  ei_printf("\tNo. of classes: %d\n", sizeof(ei_classifier_inferencing_categories) / sizeof(ei_classifier_inferencing_categories[0]));

  run_classifier_init();
  ei_printf("\nStarting continious inference in 2 seconds...\n");
  ei_sleep(2000);

  if (microphone_inference_start(EI_CLASSIFIER_SLICE_SIZE) == false) {
      ei_printf("ERR: Could not allocate audio buffer (size %d), this could be due to the window length of your model\r\n", EI_CLASSIFIER_RAW_SAMPLE_COUNT);
      return;
  }

  ei_printf("Recording...\n");
    
  dht.begin();
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

  lcd.init();
  lcd.setCursor(0,0);
  lcd.print("Hello World");
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
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  lcd.backlight();
  int Photon_value = digitalRead(Photonresistor) ^ 1;
  int rainvalue = digitalRead(rain_pin) ^ 1;
  int moisture = digitalRead(moisture_pin) ^ 1;

  long distanceCm = getDistance();
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  int PIRValue = digitalRead(PIR_in_pin);
  int FloatSwitchValue = digitalRead(float_switch);

  if (millis() - lastMotionCheck > 1000) {
    lastMotionCheck = millis();
    if (PIRValue == HIGH && lastPIRState == LOW) {
      client.publish("greenhouse/sensors/motion", "1");
      Serial.println("Motion detected and sent!");
      lastPIRState = HIGH;
    } else if (PIRValue == LOW && lastPIRState == HIGH) {
      client.publish("greenhouse/sensors/motion", "0");
      Serial.println("Motion stopped");
      lastPIRState = LOW;
    }

    if (millis() - lastWaterCheck > 5000) {
      lastWaterCheck = millis();
      sendWaterLevelValue(FloatSwitchValue);
    }

    if (millis() - lastSendTime2 > 5000) {
      lastSendTime2 = millis();
      sendTemperatureValue(t);
      sendHumidityValue(h);
      sendSoilMoistureValue(moisture);
      sendLightLevelValue(Photon_value);
      sendRainSensorValue(rainvalue);
      sendPlantHeightValue(distanceCm);

      // print on LCD
      char line1[17];
      char line2[17];
      
      snprintf(line1, sizeof(line1), "T: %.1fC H: %.0f%%", t, h);
      snprintf(line2, sizeof(line2), "S: %d W: %d P: %s",
              moisture,
              FloatSwitchValue,
              FloatSwitchValue ? "ON " : "OFF");

      lcd.setCursor(0, 0);
      lcd.print("                ");
      lcd.setCursor(0, 0);
      lcd.print(line1);

      lcd.setCursor(0, 1);
      lcd.print("                ");
      lcd.setCursor(0, 1);
      lcd.print(line2);
    }

    if (!client.connected() && WiFi.status() != WL_CONNECTED) {
      Serial.println("System unhealthy, attempting recovery...");
      setup_wifi();
      reconnect();
    }
  }
  
  bool m = microphone_inference_record();
  if (!m) {
    ei_printf("ERR: Failed to record audio...\n");
    return;
  }

  signed short *current_buffer = inference.buffers[inference.buf_select ^ 1];

  signal_t signal;
  signal.total_length = EI_CLASSIFIER_SLICE_SIZE;
  signal.get_data = &microphone_audio_signal_get_data;
  ei_impulse_result_t result = {0};

  EI_IMPULSE_ERROR r = run_classifier_continuous(&signal, &result, debug_nn);
  if (r != EI_IMPULSE_OK) {
    ei_printf("ERR: Failed to run classifier (%d)\n", r);
    return;
  }

  if (++print_results >= (EI_CLASSIFIER_SLICES_PER_MODEL_WINDOW)) {
    ei_printf("Predictions (DSP: %d ms., Classification: %d ms., Anomaly: %d ms.):\n",
        result.timing.dsp, result.timing.classification, result.timing.anomaly);
    for (size_t ix = 0; ix < EI_CLASSIFIER_LABEL_COUNT; ix++) {
      ei_printf("    %s: ", result.classification[ix].label);
      ei_printf_float(result.classification[ix].value);
      ei_printf("\n");
    }
    print_results = 0;
  }

  float max_score = 0.0f;
  size_t best_idx = 0;

  for (size_t ix = 0; ix < EI_CLASSIFIER_LABEL_COUNT; ix++) {
      if (result.classification[ix].value > max_score) {
          max_score = result.classification[ix].value;
          best_idx = ix;
      }
  }

  if (max_score > CONFIDENCE_THRESHOLD){
    const char* best_label = result.classification[best_idx].label;
    ei_printf("Voice command detected: %s (%.2f)\n", best_label, max_score);
    
    // Format: commandName;score (using semicolon as separator)
    char command_with_score[100];
    snprintf(command_with_score, sizeof(command_with_score), "%s;%.2f", best_label, max_score);
    
    client.publish("greenhouse/command", command_with_score);
    Serial.print("Sent voice command with confidence: ");
    Serial.println(command_with_score);
  }

}

/**
 * @brief Connects the ESP32 to a Wi-Fi network.
 *
 * This function attempts to connect the ESP32 to the specified Wi-Fi network using
 * the global ssid and password variables. It blocks execution until the connection
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
    } else {
      int state = client.state();
      Serial.print("Failed to connect, rc=");
      Serial.println(state);

      // Print explanation for each state
      switch (state) {
        case -4:
          Serial.println("MQTT_CONNECTION_TIMEOUT: The server didn't respond within the keepalive time.");
          break;
        case -3:
          Serial.println("MQTT_CONNECTION_LOST: Connection was lost.");
          break;
        case -2:
          Serial.println("MQTT_CONNECT_FAILED: Connect failed (e.g., server unreachable).");
          break;
        case -1:
          Serial.println("MQTT_DISCONNECTED: Client is disconnected.");
          break;
        case 0:
          Serial.println("MQTT_CONNECTED: Client is connected.");
          break;
        case 1:
          Serial.println("MQTT_CONNECT_BAD_PROTOCOL: Server doesn't support requested version.");
          break;
        case 2:
          Serial.println("MQTT_CONNECT_BAD_CLIENT_ID: Client ID rejected by broker.");
          break;
        case 3:
          Serial.println("MQTT_CONNECT_UNAVAILABLE: Broker unavailable.");
          break;
        case 4:
          Serial.println("MQTT_CONNECT_BAD_CREDENTIALS: Bad username/password.");
          break;
        case 5:
          Serial.println("MQTT_CONNECT_UNAUTHORIZED: Client not authorized.");
          break;
        default:
          Serial.println("Unknown MQTT connection state.");
          break;
      }

      retryCount++;
      mqttErrorCount++;

      if (mqttErrorCount > 5) {
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
 *w  2
 * @note The calculation is based on the speed of sound (0.034 cm/us).
 */
long getDistance() {
  digitalWrite(trig_pin, LOW);
  delayMicroseconds(2);
  digitalWrite(trig_pin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig_pin, LOW);

  long duration = pulseIn(echo_pin, HIGH);

  long distanceCm = 8 - duration * 0.034/2;

  return distanceCm;
}

/**
 * @brief Publishes the current temperature to the MQTT broker.
 *
 * Converts the temperature value to a string and publishes it to the configured
 * temp_topic.
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
 * water_level_topic.
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
 * temp_topic.
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
 * humidity_topic.
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
 * Converts the soil moisture value to a string and publishes it to the configured
 * soil_moisture_topic.
 *
 * @param[in] moisture The soil moisture level.
 *
 * @return void
 */
void sendSoilMoistureValue(int moisture) {
  String payload = String(moisture);
  client.publish(soil_moisture_topic, payload.c_str());
  Serial.println("Sent soil moisture: " + payload);
}

/**
 * @brief Publishes the water level value to the MQTT broker.
 *
 * Converts the water level value to a string and publishes it to the configured
 * water_level_topic.
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
 * Converts the light level value to a string and publishes it to the configured
 * light_level_topic.
 *
 * @param[in] lightLevel The light level measured by the photonresistor.
 *
 * @return void
 */
void sendLightLevelValue(int lightLevel) {
  String payload = String(lightLevel);
  client.publish(light_level_topic, payload.c_str());
  Serial.println("Sent light level: " + payload);
}

/**
 * @brief Publishes the rain sensor value to the MQTT broker.
 *
 * Converts the rain sensor value to a string and publishes it to the configured
 * rain_sensor_topic.
 *
 * @param[in] rain The rain sensor value.
 *
 * @return void
 */
void sendRainSensorValue(int rain) {
  String payload = String(rain);
  client.publish("greenhouse/sensors/rain", payload.c_str());
  Serial.println("Sent rain: " + payload);
}

/**
 * @brief Publishes the plant height value to the MQTT broker.
 *
 * Converts the plant height value to a string and publishes it to the configured
 * height_topic.
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
  if (strcmp(value, "0") == 0) { // Compare C-style strings correctly
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
  if (strcmp(value, "0") == 0) { // Compare C-style strings correctly
    for(int posDegrees = 140; posDegrees <= 180; posDegrees++) {
      windowServo.write(posDegrees);
      delay(20);
    } 
  } else if (strcmp(value, "1") == 0){
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
  Serial.println(value);
  if (strcmp(value, "0") == 0) { // Compare C-style strings correctly
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
  if (strcmp(value, "0") == 0) {
    digitalWrite(pump, LOW);
  }
  else {
    digitalWrite(pump, HIGH);
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

  // Use String for easier topic comparison
  String topicStr = String(topic);

  // Device controls
  if (topicStr == "greenhouse/devices/light/control") {
    controlLights(message);
  }
  else if (topicStr == "greenhouse/devices/window/control") {
    controlWindow(message);
  }
  else if (topicStr == "greenhouse/devices/door/control") {
    controlDoor(message);
  }
  else if (topicStr == "greenhouse/devices/pump/control") {
    controlPump(message);
  }
}


static void audio_inference_callback(uint32_t n_bytes)
{
    for(int i = 0; i < n_bytes>>1; i++) {
      inference.buffers[inference.buf_select][inference.buf_count++] = sampleBuffer[i];

      if(inference.buf_count >= inference.n_samples) {
          inference.buf_select ^= 1;
          inference.buf_count = 0;
          inference.buf_ready = 1;
      }
    }
}

static void capture_samples(void* arg) {

  const int32_t i2s_bytes_to_read = (uint32_t)arg;
  size_t bytes_read = i2s_bytes_to_read;

  while (record_status) {

    /* read data at once from i2s */
    i2s_read(I2S_NUM_0, (void*)sampleBuffer, i2s_bytes_to_read, &bytes_read, portMAX_DELAY);

    int samples_read = bytes_read / sizeof(int32_t);
    double sum = 0;

    // for (int i = 0; i < samples_read && i < 200; i++) {  // Limit to 200 samples
    //   int32_t raw_sample = sampleBuffer[i];

    //   // Optional: normalize to float [-1.0, 1.0]
    //   float sample = (float)raw_sample / INT32_MAX;

    //   sum += sample * sample;

    //   // Print raw or normalized sample (choose one)
    //   //Serial.println(raw_sample);  // For raw values
      
    // }
    // Serial.println(sum);        // For normalized float values

    if (bytes_read <= 0) {
      ei_printf("Error in I2S read : %d", bytes_read);
    }
    else {
        if (bytes_read < i2s_bytes_to_read) {
        ei_printf("Partial I2S read");
        }

        //scale the data (otherwise the sound is too quiet)
        for (int x = 0; x < i2s_bytes_to_read/2; x++) {
            sampleBuffer[x] = (int16_t)(sampleBuffer[x]) * 8;
        }

        if (record_status) {
            audio_inference_callback(i2s_bytes_to_read);
        }
        else {
            break;
        }
    }
  }
  vTaskDelete(NULL);
}

/**
 * @brief      Init inferencing struct and setup/start PDM
 *
 * @param[in]  n_samples  The n samples
 *
 * @return     { description_of_the_return_value }
 */
static bool microphone_inference_start(uint32_t n_samples)
{
    inference.buffers[0] = (signed short *)malloc(n_samples * sizeof(signed short));
    if (inference.buffers[0] == NULL) {
        return false;
    }

    inference.buffers[1] = (signed short *)malloc(n_samples * sizeof(signed short));

    if (inference.buffers[1] == NULL) {
        ei_free(inference.buffers[0]);
        return false;
    }

    inference.buf_select = 0;
    inference.buf_count = 0;
    inference.n_samples = n_samples;
    inference.buf_ready = 0;

    if (i2s_init(EI_CLASSIFIER_FREQUENCY)) {
        ei_printf("Failed to start I2S!");
    }

    ei_sleep(100);

    record_status = true;

    xTaskCreate(capture_samples, "CaptureSamples", 1024 * 32, (void*)sample_buffer_size, 10, NULL);

    return true;
}

/**
 * @brief      Wait on new data
 *
 * @return     True when finished
 */
static bool microphone_inference_record(void)
{
    bool ret = true;

    if (inference.buf_ready == 1) {
        ei_printf(
            "Error sample buffer overrun. Decrease the number of slices per model window "
            "(EI_CLASSIFIER_SLICES_PER_MODEL_WINDOW)\n");
        ret = false;
    }

    while (inference.buf_ready == 0) {
        delay(1);
    }

    inference.buf_ready = 0;
    return true;
}

/**
 * Get raw audio signal data
 */
static int microphone_audio_signal_get_data(size_t offset, size_t length, float *out_ptr)
{
    numpy::int16_to_float(&inference.buffers[inference.buf_select ^ 1][offset], out_ptr, length);
    //memcpy(out_ptr, &features[offset], length * sizeof(float));
    return 0;
}

/**
 * @brief      Stop PDM and release buffers
 */
static void microphone_inference_end(void)
{
    i2s_deinit();
    ei_free(inference.buffers[0]);
    ei_free(inference.buffers[1]);
}

static int i2s_init(uint32_t sampling_rate) {
  // Start listening for audio: MONO @ 8/16KHz
  i2s_config_t i2s_config = {
      .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
      .sample_rate = sampling_rate,
      .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
      .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
      .communication_format = I2S_COMM_FORMAT_I2S,
      .intr_alloc_flags = 0,
      .dma_buf_count = 16,
      .dma_buf_len = 1024,
      .use_apll = 1,
      .tx_desc_auto_clear = false,
      .fixed_mclk = -1,
  };
  i2s_pin_config_t pin_config = {
      .bck_io_num = I2S_SCK,
      .ws_io_num = I2S_WS,
      .data_out_num = -1,
      .data_in_num = I2S_SD
  };
  esp_err_t ret = 0;

  ret = i2s_driver_install(I2S_NUM_0, &i2s_config, 0, NULL);
  if (ret != ESP_OK) {
    ei_printf("Error in i2s_driver_install");
  }

  ret = i2s_set_pin(I2S_NUM_0, &pin_config);
  if (ret != ESP_OK) {
    ei_printf("Error in i2s_set_pin");
  }

  ret = i2s_zero_dma_buffer(I2S_NUM_0);
  if (ret != ESP_OK) {
    ei_printf("Error in initializing dma buffer with 0");
  }

  return int(ret);
}

static int i2s_deinit(void) {
    i2s_driver_uninstall(I2S_NUM_0); //stop & destroy i2s driver
    return 0;
}

#if !defined(EI_CLASSIFIER_SENSOR) || EI_CLASSIFIER_SENSOR != EI_CLASSIFIER_SENSOR_MICROPHONE
#error "Invalid model for current sensor."
#endif