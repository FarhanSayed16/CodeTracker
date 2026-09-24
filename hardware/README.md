# CodeTrack ESP32 Hardware Hub

Firmware for the professor desk hub: ESP32 + 128x64 I2C OLED (SSD1306) + RGB LED.
Shows live session stats from MQTT topic `codetrack/session/+/status`.

## Hardware Requirements
- ESP32 Development Board
- 0.96" I2C OLED Display (SSD1306)
- Common-cathode RGB LED (+ resistors)
- Jumper wires

## Wiring

### OLED (I2C)
| OLED Pin | ESP32 Pin |
|----------|-----------|
| VCC      | 3.3V |
| GND      | GND |
| SCL      | D22 |
| SDA      | D21 |

### RGB LED
| LED | ESP32 Pin |
|-----|-----------|
| R   | GPIO25 |
| G   | GPIO26 |
| B   | GPIO27 |
| GND | GND (via resistors ~220Ω) |

LED colors: blue=ready, amber=active, green=complete, red=offline.

## Setup & Flashing
1. Install PlatformIO.
2. Open `hardware/` in PlatformIO.
3. Flash firmware. On first boot, connect to Wi-Fi AP **CodeTrack-Hub** and set Wi-Fi + MQTT broker IP.
4. Hub subscribes to `codetrack/session/+/status`.

## Display states
- **CONNECTING** — Wi-Fi/MQTT connecting
- **READY** — waiting for session
- **ACTIVE** — live Done / Issues / In Progress counts
- **COMPLETE** — all student×task cells done
- **OFFLINE** — no MQTT messages for 30s (or broker down)

Disconnecting the hub never affects the web dashboard (view-only).
