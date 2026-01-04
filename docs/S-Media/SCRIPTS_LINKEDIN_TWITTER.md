
# Text-Based Social Posts (LinkedIn / X)

## Post 1: The Philosophy of the "Dumb" Smart Home

**Headline:** Why I'm making my Smart Home "Dumb" again.

**Body:**
I love IoT. I hate dependencies.
If my internet goes down, my light switch shouldn't stop working.
If AWS has an outage, my thermostat shouldn't freeze.

I'm moving my home telemetry to **EdgeKite**.
1. It runs on a Raspberry Pi.
2. It stores data locally (SQLite).
3. It creates a beautiful dashboard that works on LAN.
4. It only syncs to the cloud when *I* tell it to.

It's the "Missing Middle" between a dumb home and a fragile smart home.
Resilient. Private. Fast.

#SelfHosted #HomeLab #Rust #IoT

---

## Post 2: The Brewing Monitor

**Headline:** Data driven brewing. 🍺 + 🦀

**Body:**
Brewing a Pilsner requires strict temperature control (50°F - 55°F).
Most commercial monitors require a cloud subscription.

I built my own with a $5 sensor and EdgeKite.
The best part? It uses the **Pattern Detection Engine** (written in Rust) to watch for anomalies.

If the compressor dies and temp spikes > 60°F?
EdgeKite flags a "Critical Incident" locally before the beer is ruined.

Open source > Closed ecosystems.

#HomeBrewing #FunPilsner #EdgeComputing

---

## Post 3: Introducing Fun-EE (Fun Enterprise Edition)

**Headline:** Monitor your "Boring Apps" for $0.

**Body:**
Every company has that one legacy internal tool.
The HR Portal. The Inventory System. The Wiki.
Users complain "it's slow," but you can't justify a $10k Datadog license for a server under a desk.

Enter **EdgeKite Fun-EE**.
It's an offline-first observability stack for the apps IT forgot.

✅ Drop a 5-line JS snippet in the footer.
✅ Track load times & JS errors.
✅ View it all on a local, beige-colored dashboard that looks like it belongs in 1999.

Stop flying blind in your own intranet.

#SysAdmin #DevOps #LegacyCode #ShadowIT
