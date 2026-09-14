"""
tests/test_chi_square_baseline.py — Tests for Chi-Square state estimation baseline.
"""

import numpy as np
from scipy.stats import chi2


def test_chi_square_threshold_calculation():
    """Verify chi-square critical value calculation for degrees of freedom and alpha."""
    alpha = 0.01
    dof = 42  # 56 measurements - 14 states (example)
    threshold = chi2.ppf(1.0 - alpha, df=dof)

    assert threshold > 0
    assert threshold > dof  # Upper tail critical value is higher than mean dof


def test_residual_norm_detection():
    """Verify residual norm triggers alarm for anomalous residuals."""
    dof = 10
    alpha = 0.01
    threshold = chi2.ppf(1.0 - alpha, df=dof)

    # Clean residuals (small variance)
    normal_residuals = np.random.normal(0, 0.5, size=dof)
    normal_j = np.sum(normal_residuals ** 2)
    
    # Attack residuals (large perturbation)
    attack_residuals = np.random.normal(5.0, 1.0, size=dof)
    attack_j = np.sum(attack_residuals ** 2)

    assert attack_j > threshold
