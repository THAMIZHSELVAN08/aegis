import pandapower as pp
import pandapower.networks as nw
import numpy as np
import pandas as pd

net = nw.case14()


def apply_voltage_manipulation(reading, attack_strength=0.08, target_buses=None):
    """
    Voltage Manipulation Attack: Direct tampering of voltage magnitudes & active/reactive power readings.
    """
    modified = dict(reading)
    if target_buses is None:
        target_buses = [3, 7, 10]

    for bus_id in target_buses:
        vm_key = f"vm_pu_bus{bus_id}"
        p_key = f"p_mw_bus{bus_id}"
        q_key = f"q_mvar_bus{bus_id}"

        if vm_key in modified:
            shift = 1.0 + np.random.choice([-1, 1]) * np.random.uniform(attack_strength * 0.8, attack_strength * 1.5)
            modified[vm_key] *= shift
        if p_key in modified:
            modified[p_key] *= (1.0 + np.random.uniform(-0.15, 0.25))
        if q_key in modified:
            modified[q_key] *= (1.0 + np.random.uniform(-0.15, 0.25))

    return modified


def apply_load_redistribution(reading, load_buses=None):
    """
    Load Redistribution Attack: Simultaneously falsifies P/Q load profiles across multiple load buses.
    Increases load readings on bus subset A while decreasing readings on bus subset B,
    keeping aggregate consumption roughly invariant to evade total-power balance checks.
    """
    modified = dict(reading)
    if load_buses is None:
        load_buses = [2, 3, 4, 5, 8, 10, 11, 12, 13]

    np.random.shuffle(load_buses)
    split = len(load_buses) // 2
    boost_buses = load_buses[:split]
    drop_buses = load_buses[split:]

    for bus_id in boost_buses:
        p_key = f"p_mw_bus{bus_id}"
        q_key = f"q_mvar_bus{bus_id}"
        va_key = f"va_deg_bus{bus_id}"

        if p_key in modified:
            modified[p_key] *= np.random.uniform(1.20, 1.45)
        if q_key in modified:
            modified[q_key] *= np.random.uniform(1.20, 1.45)
        if va_key in modified:
            modified[va_key] += np.random.uniform(-3.5, 3.5)

    for bus_id in drop_buses:
        p_key = f"p_mw_bus{bus_id}"
        q_key = f"q_mvar_bus{bus_id}"
        va_key = f"va_deg_bus{bus_id}"

        if p_key in modified:
            modified[p_key] *= np.random.uniform(0.55, 0.75)
        if q_key in modified:
            modified[q_key] *= np.random.uniform(0.55, 0.75)
        if va_key in modified:
            modified[va_key] += np.random.uniform(-3.5, 3.5)

    return modified


def apply_topology_replay(reading, stale_baseline=None, target_buses=None):
    """
    Topology / Replay Attack: Replays stale valid state telemetry for key buses
    to mask ongoing physical grid changes (e.g. line trips or sudden load shifts).
    """
    modified = dict(reading)
    if target_buses is None:
        target_buses = [1, 4, 6, 9, 13]

    for bus_id in target_buses:
        vm_key = f"vm_pu_bus{bus_id}"
        va_key = f"va_deg_bus{bus_id}"
        p_key = f"p_mw_bus{bus_id}"

        if stale_baseline and vm_key in stale_baseline:
            modified[vm_key] = stale_baseline[vm_key]
            modified[va_key] = stale_baseline.get(va_key, modified[va_key])
            modified[p_key] = stale_baseline.get(p_key, modified[p_key])
        else:
            # Synthetic replay: lock voltage and angle to ideal nominal values while true load shifted
            modified[vm_key] = 1.000
            modified[va_key] = 0.000
            modified[p_key] *= 0.60  # Stale lower load reading

    return modified


def generate_attacked_samples(
    net,
    n_samples=2000,
    load_variation=0.15,
    attack_strength=0.05,
    max_targets=4
):
    records = []
    base_loads_p = net.load["p_mw"].copy()
    base_loads_q = net.load["q_mvar"].copy()

    for i in range(n_samples):
        factors = 1 + np.random.uniform(
            -load_variation,
            load_variation,
            size=len(net.load)
        )

        net.load["p_mw"] = base_loads_p * factors
        net.load["q_mvar"] = base_loads_q * factors

        try:
            pp.runpp(net)
        except Exception:
            continue

        raw_record = {}
        for bus_id in net.res_bus.index:
            raw_record[f"vm_pu_bus{bus_id}"] = net.res_bus.at[bus_id, "vm_pu"]
            raw_record[f"va_deg_bus{bus_id}"] = net.res_bus.at[bus_id, "va_degree"]
            raw_record[f"p_mw_bus{bus_id}"] = net.res_bus.at[bus_id, "p_mw"]
            raw_record[f"q_mvar_bus{bus_id}"] = net.res_bus.at[bus_id, "q_mvar"]

        # Alternate attack types across synthetic generation
        attack_type = i % 3
        if attack_type == 0:
            attacked_record = apply_voltage_manipulation(raw_record)
        elif attack_type == 1:
            attacked_record = apply_load_redistribution(raw_record)
        else:
            attacked_record = apply_topology_replay(raw_record)

        attacked_record["sample_id"] = i + 100000
        attacked_record["label"] = 1
        records.append(attacked_record)

    return pd.DataFrame(records)


if __name__ == "__main__":
    print("Generating multi-type attacked samples...")
    df_attacked = generate_attacked_samples(net, n_samples=2000)
    df_attacked.to_csv("data/attacked_data.csv", index=False)
    print(f"Saved {len(df_attacked)} attacked samples to data/attacked_data.csv")

    df_normal = pd.read_csv("data/normal_data.csv")
    df_full = pd.concat([df_normal, df_attacked], ignore_index=True)
    df_full = df_full.sample(frac=1, random_state=42).reset_index(drop=True)
    df_full.to_csv("data/full_dataset.csv", index=False)
    print(f"Combined full dataset saved: {len(df_full)} total samples")
    print(df_full["label"].value_counts())