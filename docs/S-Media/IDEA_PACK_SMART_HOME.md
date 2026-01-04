
# 🏠 The EdgeKite "Home Lab" Idea Pack

**"Don't just make your home smart. Make it resilient."**

This guide is for the @FunPilsner community. Here are 3 ways to use EdgeKite to monitor your life without selling your data.

---

## Project 1: The "Yeager" Kegerator Monitor 🍺

**The Problem:** You run out of CO2 or your fridge dies, ruining a batch of homebrew.
**The Fix:** A $10 monitoring station.

### Hardware
*   Raspberry Pi Zero W ($15)
*   DS18B20 Temp Sensor ($4)
*   Digital Scale (hackable) or Flow Meter.

### The Code (Bash script)
Run this cronjob every minute on the Pi:

```bash
# Read temp from sensor
TEMP=$(cat /sys/bus/w1/devices/28-*/w1_slave | grep -oP 't=\K\d+')
TEMP_C=$(echo "scale=2; $TEMP/1000" | bc)

# Send to EdgeKite (Assuming EdgeKite is running on port 3000)
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "category": "iot",
    "type": "temp_reading",
    "detail": "Kegerator Main Chamber",
    "meta": { "temp_c": '$TEMP_C', "unit": "Kegerator 1" }
  }'
```

**Theme Tip:** Use the **Ranch Theme**.
*   "Livestock" -> "Kegs"
*   "Water Levels" -> "Beer Left"

---

## Project 2: The "Sourdough" Proofing Box 🍞

**The Problem:** Sourdough starter is picky. It needs 75°F - 80°F.
**The Fix:** Use EdgeKite to log the temp curve of your oven with the light on.

**Why EdgeKite?**
You can visualize the *rate of change* (Sparklines) to predict when the dough is ready. Use the **Pattern Engine** to alert you if it drops below 70°F.

**Pattern Rule (`patterns.json`):**
```json
{
  "name": "Dough Too Cold",
  "logic": "VAL < 70 AND SENSOR = 'proofing_box'",
  "severity": "medium"
}
```

---

## Project 3: The "Retro" Car Logger 🏎️

**The Problem:** You have an older fun car (90s/00s) with no telemetry.
**The Fix:** An OBD2 Bluetooth adapter + EdgeKite.

1.  Connect Pi to OBD2 adapter via Bluetooth.
2.  Script queries RPM, Oil Temp, Intake Temp every second.
3.  EdgeKite stores it locally (`synced=false`).
4.  **The Magic:** When you pull into your driveway, the Pi connects to home WiFi. EdgeKite automatically pushes the drive data to your Hub.

**Theme Tip:** Use the **Edge Theme** (Industrial/Dark).

---

## 📢 Share Your Setup!
Did you wire up your chicken coop? Your aquarium? Your gaming PC temps?
Tag **#EdgeKite #FunPilsner** to be featured.
