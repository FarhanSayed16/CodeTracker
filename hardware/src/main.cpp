#include <Arduino.h>
#include <WiFi.h>
#include <WiFiManager.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// --- Display ---
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// --- RGB LED (common cathode: R=GPIO25, G=GPIO26, B=GPIO27) ---
#define LED_R 25
#define LED_G 26
#define LED_B 27

// --- MQTT ---
// After WiFiManager portal, set broker IP in portal custom param or fallback:
char mqtt_server[40] = "192.168.1.100";

WiFiClient espClient;
PubSubClient client(espClient);

enum HubState { STATE_CONNECTING, STATE_READY, STATE_ACTIVE, STATE_COMPLETE, STATE_OFFLINE };
HubState hubState = STATE_CONNECTING;

bool isSessionActive = false;
int statsDone = 0;
int statsIssues = 0;
int statsInProgress = 0;
int totalTasks = 0;
int totalStudents = 0;
unsigned long lastMsgMillis = 0;
const unsigned long OFFLINE_TIMEOUT_MS = 30000;

void setRgb(uint8_t r, uint8_t g, uint8_t b) {
  analogWrite(LED_R, r);
  analogWrite(LED_G, g);
  analogWrite(LED_B, b);
}

void applyLedForState() {
  switch (hubState) {
    case STATE_READY: setRgb(0, 0, 255); break;       // blue
    case STATE_ACTIVE: setRgb(255, 180, 0); break;    // amber
    case STATE_COMPLETE: setRgb(0, 255, 0); break;    // green
    case STATE_OFFLINE: setRgb(255, 0, 0); break;     // red
    case STATE_CONNECTING: setRgb(80, 80, 80); break; // dim
  }
}

void drawScreen() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);
  display.setCursor(0, 0);

  switch (hubState) {
    case STATE_CONNECTING:
      display.println("CodeTrack");
      display.println("Connecting...");
      break;
    case STATE_READY:
      display.println(" CodeTrack Ready");
      display.println(" Waiting for session");
      break;
    case STATE_OFFLINE:
      display.println(" SERVER OFFLINE");
      display.println(" Check WiFi/MQTT");
      break;
    case STATE_COMPLETE:
      display.println(" ALL COMPLETE");
      display.printf("Done %d / Stds %d\n", statsDone, totalStudents);
      break;
    case STATE_ACTIVE:
      display.println("Live Session Stats");
      display.drawLine(0, 10, 128, 10, WHITE);
      display.setCursor(0, 15);
      display.printf("Done: %d", statsDone);
      display.setCursor(0, 25);
      display.printf("Issues: %d", statsIssues);
      display.setCursor(0, 35);
      display.printf("In Prog: %d", statsInProgress);
      display.setCursor(0, 45);
      display.printf("Tasks:%d Stds:%d", totalTasks, totalStudents);
      break;
  }
  display.display();
  applyLedForState();
}

void updateCompleteCheck() {
  if (!isSessionActive || totalStudents == 0 || totalTasks == 0) return;
  int expected = totalStudents * totalTasks;
  if (statsDone >= expected && statsIssues == 0) {
    hubState = STATE_COMPLETE;
  } else {
    hubState = STATE_ACTIVE;
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) message += (char)payload[i];

  StaticJsonDocument<512> doc;
  if (deserializeJson(doc, message)) return;

  String event = doc["event"].as<String>();
  lastMsgMillis = millis();

  if (event == "status-update" || event == "new-task") {
    isSessionActive = true;
    if (doc.containsKey("stats")) {
      statsDone = doc["stats"]["done"] | 0;
      statsIssues = doc["stats"]["issues"] | 0;
      statsInProgress = doc["stats"]["inProgress"] | 0;
      totalTasks = doc["stats"]["totalTasks"] | 0;
      totalStudents = doc["stats"]["totalStudents"] | 0;
    }
    updateCompleteCheck();
    if (hubState != STATE_COMPLETE) hubState = STATE_ACTIVE;
    drawScreen();
  } else if (event == "session-ended") {
    isSessionActive = false;
    hubState = STATE_READY;
    display.clearDisplay();
    display.setCursor(0, 20);
    display.println("Session Ended");
    display.display();
    delay(3000);
    drawScreen();
  }
}

void reconnectMqtt() {
  hubState = STATE_CONNECTING;
  drawScreen();
  while (!client.connected()) {
    Serial.print("MQTT connecting...");
    if (client.connect("CodeTrackESP32")) {
      Serial.println("ok");
      client.subscribe("codetrack/session/+/status");
      hubState = isSessionActive ? STATE_ACTIVE : STATE_READY;
      lastMsgMillis = millis();
      drawScreen();
    } else {
      hubState = STATE_OFFLINE;
      drawScreen();
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_R, OUTPUT);
  pinMode(LED_G, OUTPUT);
  pinMode(LED_B, OUTPUT);

  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("SSD1306 failed"));
    for (;;);
  }

  hubState = STATE_CONNECTING;
  drawScreen();

  WiFiManager wm;
  WiFiManagerParameter custom_mqtt("mqtt", "MQTT broker IP", mqtt_server, 40);
  wm.addParameter(&custom_mqtt);
  wm.setConfigPortalTimeout(180);

  if (!wm.autoConnect("CodeTrack-Hub")) {
    hubState = STATE_OFFLINE;
    drawScreen();
    delay(3000);
    ESP.restart();
  }

  strncpy(mqtt_server, custom_mqtt.getValue(), sizeof(mqtt_server) - 1);
  client.setServer(mqtt_server, 1883);
  client.setCallback(mqttCallback);
  reconnectMqtt();
}

void loop() {
  if (!client.connected()) {
    reconnectMqtt();
  }
  client.loop();

  if (hubState == STATE_ACTIVE || hubState == STATE_COMPLETE) {
    if (millis() - lastMsgMillis > OFFLINE_TIMEOUT_MS) {
      hubState = STATE_OFFLINE;
      drawScreen();
    }
  }
}
