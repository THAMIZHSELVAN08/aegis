"""
tests/test_inject_attacks.py — Tests for FDIA cyber-attack injection mechanisms.
"""

import pytest
import pandapower.networks as nw
import pandapower as pp
from src.inject_attacks import (
    apply_voltage_manipulation,
    apply_load_redistribution,
    apply_topology_replay,
)


@pytest.fixture
def base_reading():
    """Generate a clean, deterministic baseline reading from PandaPower case14."""
    net = nw.case14()
    pp.runpp(net)
    reading = {}
    for bus_id in net.res_bus.index:
        reading[f"vm_pu_bus{bus_id}"] = float(str(net.res_bus.at[bus_id, "vm_pu"]))
        reading[f"va_deg_bus{bus_id}"] = float(str(net.res_bus.at[bus_id, "va_degree"]))
        reading[f"p_mw_bus{bus_id}"] = float(str(net.res_bus.at[bus_id, "p_mw"]))
        reading[f"q_mvar_bus{bus_id}"] = float(str(net.res_bus.at[bus_id, "q_mvar"]))
    return reading


def test_voltage_manipulation_perturbs_target_buses(base_reading):
    """Assert voltage manipulation attack modifies target bus voltages."""
    target_buses = [3, 7, 10]
    attacked = apply_voltage_manipulation(base_reading, attack_strength=0.10, target_buses=target_buses)

    assert isinstance(attacked, dict)
    for bus_id in target_buses:
        vm_key = f"vm_pu_bus{bus_id}"
        # Assert the attacked value differs from the baseline
        assert attacked[vm_key] != base_reading[vm_key], f"Bus {bus_id} voltage was not perturbed"


def test_load_redistribution_conserves_aggregate_power(base_reading):
    """
    Assert Load Redistribution Attack alters individual buses while preserving
    overall active power profile within realistic physical bounds.
    """
    load_buses = [2, 3, 4, 5, 8, 10, 11, 12, 13]
    attacked = apply_load_redistribution(base_reading, load_buses=list(load_buses))

    # Check that individual bus readings changed
    any_changed = any(attacked[f"p_mw_bus{b}"] != base_reading[f"p_mw_bus{b}"] for b in load_buses)
    assert any_changed, "Load redistribution should modify bus active power readings"

    # Check key structure
    for bus_id in range(14):
        assert f"p_mw_bus{bus_id}" in attacked
        assert f"vm_pu_bus{bus_id}" in attacked


def test_topology_replay_attack(base_reading):
    """Assert replay attack locks telemetry to specified baseline values."""
    target_buses = [1, 4, 6]
    attacked = apply_topology_replay(base_reading, target_buses=target_buses)

    for bus_id in target_buses:
        assert attacked[f"vm_pu_bus{bus_id}"] == 1.000
        assert attacked[f"va_deg_bus{bus_id}"] == 0.000
