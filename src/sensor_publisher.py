# -*- coding: utf-8 -*-
"""
sensor_publisher.py -- SCADA Telemetry Generator / MQTT Publisher

Simulates smart grid sensor telemetry (IEEE 14-bus feeder) and publishes raw
readings to the MQTT broker topic 'grid/bus/telemetry'.

Matches real-world SCADA/WAMS deployment (IEC 61850 / DNP3 over MQTT).
"""

import sys
import json
import time
import random
import os
import io
from pathlib import Path
import numpy as np

import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.filterwarnings("ignore", category=UserWarning)

# Force UTF-8 stdout
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import pandapower as pp
import pandapower.networks as nw
import paho.mqtt.client as mqtt

try:
    from src.inject_attacks import (
        apply_voltage_manipulation,
        apply_load_redistribution,
        apply_topology_replay,
    )
except ModuleNotFoundError:
    from inject_attacks import (
        apply_voltage_manipulation,
        apply_load_redistribution,
        apply_topology_replay,
    )

MQTT_BROKER = os.environ.get("MQTT_BROKER", "localhost")
MQTT_PORT   = int(os.environ.get("MQTT_PORT", 1883))
MQTT_TOPIC  = "grid/bus/telemetry"

net = nw.case14()
base_loads_p = net.load["p_mw"].copy()
base_loads_q = net.load["q_mvar"].copy()


def generate_single_telemetry(inject=None, attack_type="random"):
    """Simulate single grid reading with optional attack injection."""
    factors = 1 + np.random.uniform(-0.15, 0.15, size=len(net.load))
    net.load["p_mw"] = base_loads_p * factors
    net.load["q_mvar"] = base_loads_q * factors
    pp.runpp(net)

    raw_record = {}
    for bus_id in net.res_bus.index:
        raw_record[f"vm_pu_bus{bus_id}"] = float(net.res_bus.at[bus_id, "vm_pu"])
        raw_record[f"va_deg_bus{bus_id}"] = float(net.res_bus.at[bus_id, "va_degree"])
        raw_record[f"p_mw_bus{bus_id}"] = float(net.res_bus.at[bus_id, "p_mw"])
        raw_record[f"q_mvar_bus{bus_id}"] = float(net.res_bus.at[bus_id, "q_mvar"])

    if inject is None:
        inject = random.random() < 0.3

    if not inject:
        return raw_record, False, "None (Clean Baseline)", "none"

    if attack_type == "random" or not attack_type:
        attack_type = random.choice(["voltage_manipulation", "load_redistribution", "topology_replay"])

    if attack_type == "load_redistribution":
        modified = apply_load_redistribution(raw_record)
        attack_label = "Load Redistribution Attack"
    elif attack_type == "topology_replay":
        modified = apply_topology_replay(raw_record)
        attack_label = "Topology / Replay Attack"
    else:
        modified = apply_voltage_manipulation(raw_record)
        attack_label = "Voltage Manipulation"

    return modified, True, attack_label, attack_type


def main():
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="scada_sensor_publisher")
    
    print(f"[Sensor Publisher] Connecting to MQTT broker at {MQTT_BROKER}:{MQTT_PORT}...", flush=True)
    try:
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_start()
        print(f"[Sensor Publisher] Connected! Publishing telemetry to '{MQTT_TOPIC}' every 2 seconds.", flush=True)
    except Exception as err:
        print(f"[Sensor Publisher] Warning: Broker connect failed ({err}). Using fallback loop.", flush=True)

    sample_id = 0
    while True:
        try:
            sample_id += 1
            reading, inject, attack_label, attack_key = generate_single_telemetry()
            payload = {
                "sample_id": sample_id,
                "timestamp": time.time(),
                "reading": reading,
                "inject": inject,
                "attack_type": attack_label,
                "attack_key": attack_key,
            }

            json_data = json.dumps(payload)
            if client.is_connected():
                client.publish(MQTT_TOPIC, json_data)
                print(f"[Sensor Publisher] #{sample_id} Published -> {MQTT_TOPIC} (Injected: {inject})", flush=True)
            else:
                print(f"[Sensor Publisher] #{sample_id} Generated telemetry (Injected: {inject})", flush=True)

        except Exception as exc:
            print(f"[Sensor Publisher] Error generating telemetry: {exc}", flush=True)

        time.sleep(2)


if __name__ == "__main__":
    main()
