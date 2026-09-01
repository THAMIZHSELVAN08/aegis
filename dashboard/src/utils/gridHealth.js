/**
 * calculateGridHealth
 * Single source of truth for "is this bus healthy" logic, shared by
 * Header.jsx and GridHealth.jsx so their numbers never drift apart.
 *
 * A bus is considered nominal when its per-unit voltage sits within
 * the 0.94–1.07 pu band (matches IEEE 14-bus normal operating range).
 */
export function calculateGridHealth(reading, totalBuses = 14) {
    if (!reading) {
        return { healthPct: 0, healthyBuses: 0, totalBuses, buses: [] };
    }

    const buses = [];
    for (let i = 0; i < totalBuses; i++) {
        const raw = reading[`vm_pu_bus${i}`];
        const voltage = parseFloat(raw ?? 1.0);
        const healthy = !isNaN(voltage) && voltage >= 0.94 && voltage <= 1.07;
        buses.push({ busId: i + 1, voltage, healthy });
    }

    const healthyBuses = buses.filter((b) => b.healthy).length;
    const healthPct = totalBuses > 0 ? Math.round((healthyBuses / totalBuses) * 100) : 0;

    return { healthPct, healthyBuses, totalBuses, buses };
}

export default calculateGridHealth;