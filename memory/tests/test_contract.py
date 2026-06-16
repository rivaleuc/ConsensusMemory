import contract_mod as C


def test_derived_valid_matches_strength():
    assert C.normalize_fact_verdict({"strength": 80, "reasoning": "x"})["valid"] is True
    assert C.normalize_fact_verdict({"strength": 50, "reasoning": "x"})["valid"] is True
    assert C.normalize_fact_verdict({"strength": 49, "reasoning": "x"})["valid"] is False


def test_normalize_clamps_out_of_range():
    assert C.normalize_fact_verdict({"strength": 150})["strength"] == 100
    assert C.normalize_fact_verdict({"strength": -10})["strength"] == 0


def test_validator_accepts_consistent():
    assert C.validate_fact_verdict({"valid": True, "strength": 75, "reasoning": "ok"}) is True
    assert C.validate_fact_verdict({"valid": False, "strength": 20, "reasoning": "ok"}) is True


def test_validator_rejects_out_of_range_strength():
    assert C.validate_fact_verdict({"valid": True, "strength": 120, "reasoning": "x"}) is False
    assert C.validate_fact_verdict({"valid": False, "strength": -3, "reasoning": "x"}) is False


def test_validator_rejects_inconsistent_valid():
    assert C.validate_fact_verdict({"valid": False, "strength": 90, "reasoning": "x"}) is False
    assert C.validate_fact_verdict({"valid": True, "strength": 10, "reasoning": "x"}) is False


def test_validator_rejects_bad_types_and_empty_reasoning():
    assert C.validate_fact_verdict({"valid": "yes", "strength": 80, "reasoning": "x"}) is False
    assert C.validate_fact_verdict({"valid": True, "strength": "80", "reasoning": "x"}) is False
    assert C.validate_fact_verdict({"valid": True, "strength": True, "reasoning": "x"}) is False
    assert C.validate_fact_verdict({"valid": True, "strength": 80, "reasoning": ""}) is False


def test_normalized_output_always_passes_validator():
    for s in range(-20, 130, 3):
        v = C.normalize_fact_verdict({"strength": s})
        assert C.validate_fact_verdict(v) is True
