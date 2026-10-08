# CodeTracker IoT Hardware Plan

## 🎯 Goal

Enable a **zero-walk, zero-screen** workflow for the professor in a computer lab:

| Who | Action | How (today — software only) | How (with IoT) |
|-----|--------|----------------------------|-----------------|
| **Professor** | Add / advance task | Open dashboard, click "Add Task" | **Press a single button on a wireless remote** |
| **Professor** | See who's done | Stare at dashboard grid | **Glance across the room — see green/red/yellow flags on every desk** |
| **Professor** | Resolve issues | Click resolve on dashboard | **Press "Resolve All" on remote** |
| **Student** | Mark task done | Click on phone / companion app | **Press a physical button on the desk unit** |
| **Student** | Raise issue | Click "Help" on phone | **Press a dedicated "Help" button — desk flag turns red** |

---

## 🏗️ System Architecture

```
┌───────────────────────────────────────────────────┐
│                CodeTracker Server                  │
│          (Node.js + Socket.IO + MQTT)              │
│                                                    │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐   │
│  │ REST API │  │ Socket.IO │  │ MQTT Broker  │   │
│  │ /api/*   │  │ (dashboard)│  │ (Mosquitto)  │   │
│  └──────────┘  └───────────┘  └──────┬───────┘   │
│                                       │            │
└───────────────────────────────────────┼────────────┘
                                        │ WiFi / MQTT
                    ┌───────────────────┼───────────────────┐
                    │                   │                    │
          ┌─────────▼────────┐ ┌────────▼─────────┐ ┌──────▼──────────┐
          │ Student Desk     │ │ Student Desk     │ │  Professor      │
          │ Unit #1          │ │ Unit #2 … #60    │ │  Remote         │
          │ (ESP32 + LEDs    │ │                  │ │  (ESP32 + OLED  │
          │  + Buttons)      │ │                  │ │   + Buttons)    │
          └──────────────────┘ └──────────────────┘ └─────────────────┘
```

### Communication Flow

1. **Server → MQTT Broker**: Publishes task updates, session events on `codetrack/session/{id}/status`
2. **MQTT Broker → Student Desk ESP32**: Each desk subscribes to `codetrack/desk/{deskId}/commands`
3. **Student Desk ESP32 → MQTT Broker → Server**: Student presses button → publishes to `codetrack/desk/{deskId}/response`
4. **Professor Remote ESP32 → MQTT Broker → Server**: Professor presses button → publishes to `codetrack/session/{id}/control`

> **Note:** The MQTT broker (Mosquitto) runs on the **same machine as the CodeTracker server** or on a dedicated Raspberry Pi. The existing `mqttClient.ts` in the codebase already supports this — just set `ENABLE_MQTT=true`.

---

## 🔧 Hardware Components

### Option A: Full Desk Unit (Recommended — Best Experience)

Each student desk gets a standalone IoT unit with visual indicators and physical buttons.

#### Per-Student Desk Unit

| # | Component | Model / Spec | Purpose | Approx. Price (INR) | Qty (per desk) |
|---|-----------|-------------|---------|---------------------|----------------|
| 1 | **Microcontroller** | ESP32-WROOM-32 DevKit | WiFi + MQTT client, runs all desk logic | ₹350–450 | 1 |
| 2 | **RGB LED Strip** | WS2812B NeoPixel (8-pixel stick) | Desk status light visible from 10m+ away | ₹80–120 | 1 |
| 3 | **Push Buttons** | 12mm Tactile Push Buttons (4-pack) | "Done ✅", "Help 🚨", "In Progress 🔄" | ₹20–30 | 3 |
| 4 | **OLED Display** (optional) | 0.96" SSD1306 I2C (128×64) | Shows current task name + number | ₹150–200 | 1 |
| 5 | **Buzzer** | Active Piezo Buzzer 5V | Beep on new task arrival | ₹10–15 | 1 |
| 6 | **LED Flag Pole** (optional) | 3D-printed pole + WS2812B strip (3 LEDs) | Tall flag visible from professor's desk | ₹50–100 | 1 |
| 7 | **Power Supply** | USB-C Cable + 5V 2A Adapter | Powers ESP32 + LEDs | ₹100–150 | 1 |
| 8 | **Enclosure** | 3D-printed / plastic project box (100×60×30mm) | Protects circuit, clean look on desk | ₹50–80 | 1 |
| 9 | **Jumper Wires** | Male-Female Dupont Wires | Internal wiring | ₹30 | 1 set |
| 10 | **Breadboard** (prototyping) | 400-point Mini Breadboard | For initial testing | ₹40 | 1 |

**Per-desk cost: ₹880 – ₹1,175** (without optional OLED and flag)
**Per-desk cost: ₹1,080 – ₹1,475** (with all options)

#### Professor Wireless Remote

| # | Component | Model / Spec | Purpose | Approx. Price (INR) | Qty |
|---|-----------|-------------|---------|---------------------|-----|
| 1 | **Microcontroller** | ESP32-WROOM-32 DevKit | WiFi + MQTT, central control | ₹350–450 | 1 |
| 2 | **OLED Display** | 1.3" SH1106 I2C (128×64) | Show session stats, current task | ₹200–250 | 1 |
| 3 | **Push Buttons** | 12mm Tactile Buttons (colored caps) | "Next Task", "Resolve All", "End Session" | ₹30 | 4 |
| 4 | **LiPo Battery** | 3.7V 2000mAh LiPo | Wireless — professor walks freely | ₹250–350 | 1 |
| 5 | **Charge Module** | TP4056 USB-C LiPo Charger | Charge the battery | ₹30–50 | 1 |
| 6 | **Enclosure** | 3D-printed handheld remote case | Ergonomic, fits in hand | ₹80–120 | 1 |
| 7 | **Buzzer** | Passive Buzzer | Audible alert when student raises issue | ₹10 | 1 |

**Professor remote cost: ₹950 – ₹1,250**

#### Shared Infrastructure

| # | Component | Model / Spec | Purpose | Approx. Price (INR) | Qty |
|---|-----------|-------------|---------|---------------------|-----|
| 1 | **MQTT Broker** | Raspberry Pi 4 (2GB) OR run on server PC | Runs Mosquitto MQTT broker | ₹3,500 (Pi) or ₹0 (server PC) | 1 |
| 2 | **WiFi Router** | Dedicated 2.4GHz AP (TP-Link Archer) | Dedicated IoT network (isolated from college WiFi) | ₹1,500–2,500 | 1 |
| 3 | **5V Power Hub** | USB Charging Station (10-port) | Power 10 desk units per hub | ₹800–1,200 | 6 |

---

### Option B: Minimal Desk Unit (Budget-Friendly)

If budget is tight, skip the OLED and use only LEDs + buttons.

| Component | Purpose | Price (INR) |
|-----------|---------|-------------|
| ESP32 DevKit | Brain | ₹400 |
| 3× Tactile Buttons | Done / Help / In Progress | ₹25 |
| WS2812B 3-LED strip | Status color (Green/Red/Yellow) | ₹40 |
| USB cable + power | Power | ₹100 |
| Small enclosure | Housing | ₹50 |

**Per-desk cost: ₹615**

---

### Option C: LED-Only Flag System (Cheapest — No Student Interaction)

Students still use their phones/companion app. The desk only has a **visual flag**.

| Component | Purpose | Price (INR) |
|-----------|---------|-------------|
| ESP32 DevKit | Receives status via MQTT | ₹400 |
| WS2812B 8-LED strip on a pole | Tall visible flag | ₹120 |
| USB power | Power | ₹100 |

**Per-desk cost: ₹620** (but students still need phone/companion)

---

## 💰 Total Bill of Materials (60-desk lab)

| Item | Option A (Full) | Option B (Minimal) | Option C (LED-only) |
|------|----------------|--------------------|--------------------|
| 60 Desk Units | ₹64,800 – ₹88,500 | ₹36,900 | ₹37,200 |
| 1 Professor Remote | ₹1,250 | ₹1,250 | ₹1,250 |
| WiFi Router | ₹2,500 | ₹2,500 | ₹2,500 |
| 6× USB Power Hubs | ₹7,200 | ₹7,200 | ₹7,200 |
| Raspberry Pi (optional) | ₹3,500 | ₹3,500 | ₹3,500 |
| Wiring / Misc | ₹2,000 | ₹1,500 | ₹1,500 |
| **TOTAL** | **₹81,250 – ₹1,04,950** | **₹52,850** | **₹53,150** |

> **Tip:** Start with **Option B (Minimal)** for the first 10 desks as a pilot. If successful, upgrade to Option A for the full lab. This limits initial spend to **~₹8,750** for 10 desks + shared infra.

---

## 🖥️ Software Architecture (What to Build)

### 1. ESP32 Firmware — Student Desk Unit (`firmware/desk-unit/`)

```
desk-unit/
├── src/
│   ├── main.cpp          # Setup WiFi + MQTT, button ISRs, LED control
│   ├── config.h          # WiFi SSID, MQTT broker IP, desk ID
│   ├── mqtt_handler.cpp  # Subscribe to desk commands, publish responses
│   ├── led_controller.cpp # NeoPixel animations (pulse, flash, solid)
│   ├── button_handler.cpp # Debounced button reads with ISR
│   └── display.cpp       # OLED task display (optional)
├── platformio.ini        # PlatformIO build config for ESP32
└── README.md
```

**MQTT Topics — Student Desk:**

| Topic | Direction | Payload Example |
|-------|-----------|----------------|
| `codetrack/desk/{deskId}/commands` | Server → Desk | `{"action":"new_task","taskId":"abc","title":"Setup Express","taskNum":2}` |
| `codetrack/desk/{deskId}/commands` | Server → Desk | `{"action":"session_end"}` |
| `codetrack/desk/{deskId}/response` | Desk → Server | `{"action":"status_update","taskId":"abc","status":"DONE"}` |
| `codetrack/desk/{deskId}/response` | Desk → Server | `{"action":"help","taskId":"abc","message":"Server won't start"}` |

**LED Color Mapping:**

| Status | Color | Animation |
|--------|-------|-----------|
| No session / idle | Off (or dim white pulse) | Slow breathe |
| Waiting (session active, no tasks) | Blue | Slow pulse |
| In Progress | Yellow / Amber | Solid |
| Done ✅ | Green | Solid |
| Issue / Help 🚨 | Red | Fast blink |
| Resolved (after help) | Green flash → Yellow | Flash 3× then solid |

### 2. ESP32 Firmware — Professor Remote (`firmware/professor-remote/`)

```
professor-remote/
├── src/
│   ├── main.cpp          # Setup WiFi + MQTT, button handler, OLED
│   ├── config.h          # WiFi SSID, MQTT broker IP
│   ├── mqtt_handler.cpp  # Publish control commands, subscribe to stats
│   ├── display.cpp       # OLED: show "3/60 done · 2 issues · Task 4"
│   └── button_handler.cpp
├── platformio.ini
└── README.md
```

**MQTT Topics — Professor Remote:**

| Topic | Direction | Payload |
|-------|-----------|---------|
| `codetrack/session/{id}/control` | Remote → Server | `{"action":"add_task","title":"Task 5: Deploy"}` |
| `codetrack/session/{id}/control` | Remote → Server | `{"action":"resolve_all"}` |
| `codetrack/session/{id}/control` | Remote → Server | `{"action":"end_session"}` |
| `codetrack/session/{id}/stats` | Server → Remote | `{"done":45,"inProgress":10,"issues":3,"total":60,"currentTask":"Task 4"}` |

### 3. Server-Side MQTT Handler (Extend Existing Code)

The existing `mqttClient.ts` already publishes session status. We need to extend it to:

1. **Subscribe** to `codetrack/desk/+/response` — handle student button presses
2. **Subscribe** to `codetrack/session/+/control` — handle professor remote commands
3. **Publish** to `codetrack/desk/{deskId}/commands` — push new tasks to specific desks
4. **Publish** to `codetrack/session/{id}/stats` — periodic aggregated stats for professor remote

```typescript
// New topics to handle:
// ON RECEIVE: codetrack/desk/{deskId}/response
//   → Call responsesService.updateStatus() or responsesService.raiseIssue()
//   → Forward via Socket.IO to dashboard

// ON RECEIVE: codetrack/session/{sessionId}/control
//   → Call tasksService.create() for "add_task"
//   → Call responsesService.resolveAll() for "resolve_all"
//   → Call sessionsService.end() for "end_session"

// ON TASK CREATE (existing hook):
//   → Publish to codetrack/desk/{deskId}/commands for every enrolled desk
```

### 4. Desk Mapping (New DB Table)

We need a mapping between physical desk units and student sessions:

```prisma
model DeskUnit {
  id        String   @id @default(uuid())
  deskId    String   @unique  // e.g., "DESK-01", "DESK-42"
  labRoom   String              // e.g., "Lab-301"
  position  String?             // e.g., "Row 3, Col 5"
  macAddress String? @unique    // ESP32 MAC for auto-identification

  // Current session binding (nullable)
  currentStudentId String?
  currentSessionId String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## 🔌 Circuit Diagrams

### Student Desk Unit Wiring

```
                    ESP32 DevKit
                   ┌────────────┐
                   │            │
    [BTN-DONE] ────┤ GPIO 25   │
    [BTN-HELP] ────┤ GPIO 26   │
    [BTN-PROG] ────┤ GPIO 27   │
                   │            │
    [BUZZER]   ────┤ GPIO 32   │
                   │            │
    [NeoPixel] ────┤ GPIO 13   │──── WS2812B Data In
                   │            │
    [OLED SDA] ────┤ GPIO 21   │──── SSD1306 SDA (I2C)
    [OLED SCL] ────┤ GPIO 22   │──── SSD1306 SCL (I2C)
                   │            │
              5V ──┤ VIN       │
             GND ──┤ GND       │
                   └────────────┘

    All buttons: one leg to GPIO, other leg to GND (use INPUT_PULLUP)
    NeoPixel: VIN→5V, GND→GND, DIN→GPIO13
    OLED: VCC→3.3V, GND→GND, SDA→GPIO21, SCL→GPIO22
    Buzzer: +→GPIO32, –→GND
```

### Professor Remote Wiring

```
                    ESP32 DevKit
                   ┌────────────┐
    [BTN-NEXT]  ───┤ GPIO 25   │   "Add Next Task"
    [BTN-RESOLVE]──┤ GPIO 26   │   "Resolve All Issues"
    [BTN-END]   ───┤ GPIO 27   │   "End Session"
    [BTN-QR]    ───┤ GPIO 14   │   "Show QR / Stats toggle"
                   │            │
    [BUZZER]    ───┤ GPIO 32   │   Alert on new issue
                   │            │
    [OLED SDA]  ───┤ GPIO 21   │
    [OLED SCL]  ───┤ GPIO 22   │
                   │            │
    [LiPo BAT]    │            │
     via TP4056 ──┤ VIN / 5V  │
                   │ GND       │
                   └────────────┘
```

---

## 📋 Shopping List (Ready to Order)

### For 10-Desk Pilot (Option B — Minimal)

| # | Item | Qty | Link / Source | Est. Price |
|---|------|-----|--------------|-----------|
| 1 | ESP32 DevKit V1 (30-pin) | 11 (10 desks + 1 remote) | Amazon.in / Robocraze | ₹4,400 |
| 2 | WS2812B NeoPixel 8-LED Stick | 10 | Robocraze / Robu.in | ₹1,000 |
| 3 | 12mm Tactile Push Buttons (pack of 25) | 2 packs | Amazon.in | ₹100 |
| 4 | 0.96" OLED SSD1306 I2C Display | 1 (for professor remote) | Amazon.in | ₹180 |
| 5 | Active Piezo Buzzers (pack of 10) | 1 pack | Amazon.in | ₹120 |
| 6 | 3.7V 2000mAh LiPo Battery | 1 | Amazon.in | ₹300 |
| 7 | TP4056 USB-C LiPo Charger | 1 | Amazon.in | ₹40 |
| 8 | USB-A to Micro-USB Cables (pack of 10) | 1 pack | Amazon.in | ₹500 |
| 9 | 5V 2A USB Charger (10-port hub) | 1 | Amazon.in | ₹1,200 |
| 10 | Male-Female Dupont Wires (40pcs) | 3 sets | Amazon.in | ₹120 |
| 11 | Mini Breadboards 400-pt (pack of 6) | 2 packs | Amazon.in | ₹300 |
| 12 | Small Project Enclosures 100×68×50mm (pack of 5) | 2 packs | Amazon.in | ₹500 |
| | | | **TOTAL** | **~₹8,760** |

### Software You Already Have (No Cost)

- ✅ MQTT client in the CodeTracker server (`mqttClient.ts`)
- ✅ Socket.IO real-time infrastructure
- ✅ Session management, task creation, status tracking APIs
- ✅ Dashboard with live status grid

### Software to Build

| Component | Effort | Description |
|-----------|--------|-------------|
| ESP32 Desk Firmware | ~2 days | Arduino/PlatformIO — WiFi connect, MQTT subscribe, button ISR, NeoPixel |
| ESP32 Remote Firmware | ~1 day | Similar to desk but with OLED stats display |
| Server MQTT Handler Extension | ~1 day | Extend `mqttClient.ts` to process desk/remote messages |
| Desk Mapping API | ~0.5 day | CRUD for desk ↔ student assignment |
| Desk Config Web Page | ~0.5 day | Simple page to assign desk IDs to lab positions |

**Total development effort: ~5 days**

---

## 🛠️ Implementation Phases

### Phase 1: Prototype (Week 1)
- [ ] Order 2× ESP32 + 1× NeoPixel + buttons + breadboard
- [ ] Flash desk unit firmware (WiFi + MQTT + 3 buttons + LED)
- [ ] Run Mosquitto on the CodeTracker server PC
- [ ] Extend `mqttClient.ts` to handle desk responses
- [ ] Test: button press → server receives → dashboard updates → LED changes

### Phase 2: Professor Remote (Week 2)
- [ ] Build professor remote with OLED + buttons + LiPo
- [ ] Add "add task" / "resolve all" via MQTT control topic
- [ ] Test: professor presses button → task appears on all desks + dashboard

### Phase 3: Pilot (Week 3)
- [ ] Build 10 desk units on breadboards
- [ ] Run pilot in real lab session
- [ ] Gather feedback, iterate on button layout / LED brightness

### Phase 4: Production (Week 4-5)
- [ ] Design and 3D-print enclosures (or buy project boxes)
- [ ] Solder production boards (replace breadboards)
- [ ] Build remaining 50 units
- [ ] Deploy WiFi router + power hubs
- [ ] Full lab deployment

---

## ⚡ Quick-Start: First Prototype in 30 Minutes

If you have an ESP32 and a few LEDs/buttons right now:

```ini
; platformio.ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
lib_deps =
    knolleary/PubSubClient@^2.8
    adafruit/Adafruit NeoPixel@^1.12.0
    adafruit/Adafruit SSD1306@^2.5.9
```

```cpp
// src/main.cpp (minimal proof-of-concept)
#include <WiFi.h>
#include <PubSubClient.h>
#include <Adafruit_NeoPixel.h>

#define WIFI_SSID     "YourLabWiFi"
#define WIFI_PASS     "YourPassword"
#define MQTT_SERVER   "192.168.1.100"  // CodeTracker server IP
#define MQTT_PORT     1883
#define DESK_ID       "DESK-01"

#define BTN_DONE      25
#define BTN_HELP      26
#define BTN_PROGRESS  27
#define NEOPIXEL_PIN  13
#define NUM_PIXELS    8
#define BUZZER_PIN    32

WiFiClient espClient;
PubSubClient mqtt(espClient);
Adafruit_NeoPixel strip(NUM_PIXELS, NEOPIXEL_PIN, NEO_GRB + NEO_KHZ800);

String currentTaskId = "";
String currentStatus = "idle";

void setColor(uint32_t color) {
  for (int i = 0; i < NUM_PIXELS; i++) strip.setPixelColor(i, color);
  strip.show();
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  // Parse incoming commands from server
  String msg;
  for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];
  
  // Simple JSON parsing (use ArduinoJson in production)
  if (msg.indexOf("new_task") > -1) {
    // Extract task info, update display, beep
    currentStatus = "waiting";
    setColor(strip.Color(0, 0, 255));  // Blue = new task
    digitalWrite(BUZZER_PIN, HIGH);
    delay(200);
    digitalWrite(BUZZER_PIN, LOW);
  }
  else if (msg.indexOf("session_end") > -1) {
    currentStatus = "idle";
    setColor(strip.Color(0, 0, 0));  // Off
  }
}

void publishStatus(const char* status) {
  String topic = "codetrack/desk/" + String(DESK_ID) + "/response";
  String payload = "{\"action\":\"status_update\",\"taskId\":\"" 
                   + currentTaskId + "\",\"status\":\"" + status + "\"}";
  mqtt.publish(topic.c_str(), payload.c_str());
}

void setup() {
  Serial.begin(115200);
  
  pinMode(BTN_DONE, INPUT_PULLUP);
  pinMode(BTN_HELP, INPUT_PULLUP);
  pinMode(BTN_PROGRESS, INPUT_PULLUP);
  pinMode(BUZZER_PIN, OUTPUT);
  
  strip.begin();
  strip.setBrightness(80);
  setColor(strip.Color(255, 255, 0));  // Yellow = booting
  
  // Connect WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  setColor(strip.Color(0, 255, 0));  // Green = connected
  
  // Connect MQTT
  mqtt.setServer(MQTT_SERVER, MQTT_PORT);
  mqtt.setCallback(onMqttMessage);
  
  String subTopic = "codetrack/desk/" + String(DESK_ID) + "/commands";
  while (!mqtt.connected()) {
    mqtt.connect(DESK_ID);
    delay(1000);
  }
  mqtt.subscribe(subTopic.c_str());
  
  setColor(strip.Color(50, 50, 50));  // Dim white = ready, idle
}

void loop() {
  mqtt.loop();
  
  // Button reads (with simple debounce)
  static unsigned long lastPress = 0;
  if (millis() - lastPress < 300) return;
  
  if (digitalRead(BTN_DONE) == LOW) {
    lastPress = millis();
    currentStatus = "DONE";
    setColor(strip.Color(0, 255, 0));  // Green
    publishStatus("DONE");
  }
  else if (digitalRead(BTN_HELP) == LOW) {
    lastPress = millis();
    currentStatus = "ISSUE";
    setColor(strip.Color(255, 0, 0));  // Red
    publishStatus("ISSUE");
  }
  else if (digitalRead(BTN_PROGRESS) == LOW) {
    lastPress = millis();
    currentStatus = "IN_PROGRESS";
    setColor(strip.Color(255, 165, 0));  // Amber
    publishStatus("IN_PROGRESS");
  }
}
```

---

## 🔐 Security & Network Considerations

| Concern | Solution |
|---------|----------|
| Unauthorized MQTT messages | Use MQTT username/password auth (already in `env.ts`) |
| Students spoofing other desks | Bind desk MAC address to desk ID at registration |
| WiFi congestion | Use a **dedicated 2.4GHz IoT WiFi** (separate SSID from lab WiFi) |
| Power failures | ESP32 auto-reconnects on boot; MQTT `cleanSession: false` for QoS 1 |
| Desk unit tampering | Screw-down enclosures; firmware OTA update capability |

---

## 📊 Comparison Summary

| Feature | Option A (Full) | Option B (Minimal) | Option C (LED-only) |
|---------|----------------|--------------------|--------------------|
| Student presses physical button | ✅ | ✅ | ❌ (phone only) |
| Visual desk flag (LED) | ✅ | ✅ | ✅ |
| OLED shows task name | ✅ | ❌ | ❌ |
| Professor wireless remote | ✅ | ✅ | ✅ |
| Per-desk cost | ₹1,080–1,475 | ₹615 | ₹620 |
| Total (60 desks) | ₹81K–1.05L | ₹53K | ₹53K |
| Dev effort | 5 days | 4 days | 3 days |

> **Recommendation**: Go with **Option B (Minimal)** to start. It gives students physical buttons AND visual flags at nearly half the cost of Option A. You can always add OLEDs later since the ESP32 has plenty of spare GPIO pins.

---

## 🛒 Where to Buy (India)

| Store | Best For | URL |
|-------|----------|-----|
| **Robocraze** | ESP32, sensors, all-in-one kits | robocraze.com |
| **Robu.in** | NeoPixels, motors, bulk components | robu.in |
| **Amazon.in** | Buttons, wires, enclosures, USB hubs | amazon.in |
| **Quartz Components** | Bulk electronic components | quartzcomponents.com |
| **Electronics For You** | Project kits, Raspberry Pi | efyindia.com |

---

## ✅ Summary — What to Order Today for Pilot

**Immediate order for 10-desk pilot + professor remote:**

1. **11× ESP32 DevKit V1** — ₹4,400
2. **10× WS2812B 8-LED NeoPixel Stick** — ₹1,000
3. **2× Pack of 25 Tactile Buttons** — ₹100
4. **1× 0.96" OLED Display** — ₹180
5. **1× Pack of 10 Buzzers** — ₹120
6. **1× 3.7V LiPo Battery** — ₹300
7. **1× TP4056 Charger** — ₹40
8. **1× 10-port USB Hub** — ₹1,200
9. **10× USB Cables** — ₹500
10. **3× Dupont Wire Sets** — ₹120
11. **2× Breadboard Packs** — ₹300
12. **2× Enclosure Packs** — ₹500

**Total: ~₹8,760**

> Order today → components arrive in 2-3 days → prototype in 1 day → pilot-ready in 1 week.
