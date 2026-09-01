import pandapower as pp
import pandapower.networks as nw
import pandas as pd
import numpy as np

# Load IEEE 14-bus test system
net = nw.case14()


def run_n_minus_1_contingency(grid_net=None):
    """
    Executes N-1 Contingency Analysis on the power grid by systematically
    taking out each transmission line one-by-one, running AC Newton-Raphson
    power flow, and checking voltage limits (0.90 pu <= V <= 1.10 pu).
    """
    if grid_net is None:
        target_net = nw.case14()
    else:
        target_net = grid_net.deepcopy() if hasattr(grid_net, 'deepcopy') else nw.case14()

    # Base load flow check
    try:
        pp.runpp(target_net)
        base_converged = True
    except Exception:
        base_converged = False

    contingency_results = []
    critical_lines = []
    stable_count = 0

    for line_idx in target_net.line.index:
        from_bus = int(target_net.line.at[line_idx, "from_bus"])
        to_bus = int(target_net.line.at[line_idx, "to_bus"])
        line_label = f"Line {from_bus}-{to_bus}"

        # Take line out of service (N-1 outage)
        target_net.line.at[line_idx, "in_service"] = False

        converged = True
        min_v = 1.0
        max_v = 1.0
        voltage_violation = False

        try:
            pp.runpp(target_net)
            min_v = float(target_net.res_bus["vm_pu"].min())
            max_v = float(target_net.res_bus["vm_pu"].max())
            if min_v < 0.90 or max_v > 1.10:
                voltage_violation = True
        except Exception:
            converged = False

        # Restore line
        target_net.line.at[line_idx, "in_service"] = True

        if not converged:
            status = "NON_CONVERGENT"
            status_label = "CRITICAL FAIL (Non-Convergent Power Flow)"
            critical_lines.append({
                "line_id": int(line_idx),
                "line_name": line_label,
                "reason": "Solver divergence (Voltage Collapse)",
            })
        elif voltage_violation:
            status = "VOLTAGE_VIOLATION"
            status_label = f"VIOLATION (Min V: {min_v:.3f} pu)"
            critical_lines.append({
                "line_id": int(line_idx),
                "line_name": line_label,
                "reason": f"Bus voltage out of bounds ({min_v:.3f} pu)",
            })
        else:
            status = "STABLE"
            status_label = "STABLE"
            stable_count += 1

        contingency_results.append({
            "line_id": int(line_idx),
            "line_name": line_label,
            "from_bus": from_bus,
            "to_bus": to_bus,
            "status": status,
            "status_label": status_label,
            "min_voltage_pu": round(min_v, 4),
            "max_voltage_pu": round(max_v, 4),
        })

    is_overall_stable = len(critical_lines) == 0
    if is_overall_stable:
        summary_msg = f"Grid remains stable under loss of any single transmission line (N-1 criteria passed across {len(contingency_results)} lines)."
    else:
        crit_names = ", ".join([c["line_name"] for c in critical_lines])
        summary_msg = f"Single point of failure detected! Grid vulnerable under loss of: {crit_names}."

    return {
        "overall_status": "STABLE" if is_overall_stable else "VULNERABLE",
        "summary": summary_msg,
        "base_converged": base_converged,
        "total_lines_tested": len(contingency_results),
        "stable_contingencies": stable_count,
        "critical_contingencies": len(critical_lines),
        "critical_lines": critical_lines,
        "contingencies": contingency_results,
    }


def generate_normal_samples(net, n_samples=5000, load_variation=0.15):
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

        record = {"sample_id": i, "label": 0}
        for bus_id in net.res_bus.index:
            record[f"vm_pu_bus{bus_id}"] = net.res_bus.at[bus_id, "vm_pu"]
            record[f"va_deg_bus{bus_id}"] = net.res_bus.at[bus_id, "va_degree"]
            record[f"p_mw_bus{bus_id}"] = net.res_bus.at[bus_id, "p_mw"]
            record[f"q_mvar_bus{bus_id}"] = net.res_bus.at[bus_id, "q_mvar"]

        records.append(record)

    return pd.DataFrame(records)


if __name__ == "__main__":
    print("Executing N-1 Contingency Analysis...")
    analysis = run_n_minus_1_contingency(net)
    print(f"Overall Status: {analysis['overall_status']}")
    print(f"Summary: {analysis['summary']}")
    print(f"Tested {analysis['total_lines_tested']} lines, {analysis['stable_contingencies']} stable.")