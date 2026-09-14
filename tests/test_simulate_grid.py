"""
tests/test_simulate_grid.py — Unit and integration tests for IEEE 14-bus simulation.
"""

import pandapower as pp
import pandapower.networks as nw
import pandas as pd
from src.simulate_grid import run_n_minus_1_contingency, generate_normal_samples


def test_ieee_14_topology_structure():
    """Verify IEEE 14-bus test network loads with correct bus, line, and generator counts."""
    net = nw.case14()
    assert len(net.bus) == 14, "Expected 14 buses in IEEE 14-bus case"
    assert len(net.line) == 15, "Expected 15 transmission lines in IEEE 14-bus case"
    assert len(net.trafo) == 5, "Expected 5 transformers in IEEE 14-bus case"
    assert (len(net.gen) + len(net.ext_grid)) == 5, "Expected 5 generator sources"


def test_power_flow_convergence_nominal():
    """Verify standard AC Newton-Raphson power flow converges for nominal case."""
    net = nw.case14()
    pp.runpp(net)
    assert net.converged is True
    assert "vm_pu" in net.res_bus
    assert "va_degree" in net.res_bus
    assert "p_mw" in net.res_bus
    assert "q_mvar" in net.res_bus


def test_generate_normal_samples():
    """Verify generate_normal_samples produces valid DataFrame with expected columns."""
    net = nw.case14()
    n_samples = 5
    df = generate_normal_samples(net, n_samples=n_samples, load_variation=0.05)
    
    assert isinstance(df, pd.DataFrame)
    assert len(df) <= n_samples
    assert "sample_id" in df.columns
    assert "label" in df.columns
    assert (df["label"] == 0).all()

    # Check that all 14 buses have 4 electrical metrics: vm_pu, va_deg, p_mw, q_mvar (56 features)
    for bus_id in range(14):
        assert f"vm_pu_bus{bus_id}" in df.columns
        assert f"va_deg_bus{bus_id}" in df.columns
        assert f"p_mw_bus{bus_id}" in df.columns
        assert f"q_mvar_bus{bus_id}" in df.columns


def test_n_minus_1_contingency_analysis():
    """Verify N-1 contingency analysis runs across all lines and produces valid results structure."""
    net = nw.case14()
    results = run_n_minus_1_contingency(net)

    assert "overall_status" in results
    assert results["overall_status"] in ["STABLE", "VULNERABLE"]
    assert "summary" in results
    assert results["total_lines_tested"] == 15
    assert "contingencies" in results
    assert len(results["contingencies"]) == 15

    first_contingency = results["contingencies"][0]
    assert "line_id" in first_contingency
    assert "line_name" in first_contingency
    assert "from_bus" in first_contingency
    assert "to_bus" in first_contingency
    assert "status" in first_contingency
    assert first_contingency["status"] in ["STABLE", "VOLTAGE_VIOLATION", "NON_CONVERGENT"]
