FUNCTION CalcGain : REAL
    VAR_INPUT
        InputValue : REAL;
        Gain       : REAL;
    END_VAR
END_FUNCTION

FUNCTION_BLOCK FB_Filter
    VAR_INPUT
        Enable : BOOL;
        Raw    : REAL;
        Alpha  : REAL;
    END_VAR
    VAR_OUTPUT
        Out : REAL;
    END_VAR
END_FUNCTION_BLOCK

PROGRAM SignatureHelpManualTest
    VAR
        timerA   : TON;
        counterA : CTU;
        filterA  : FB_Filter;
        result   : REAL;
    END_VAR

    // Step 1: place cursor after LIMIT( and expect signature help popup.
    // Expect: LIMIT(MN: ANY_MAGNITUDE; IN: ANY_MAGNITUDE; MX: ANY_MAGNITUDE)
    // Expect: first parameter highlighted, then second/third as cursor passes commas.
    result := LIMIT(0.0, 12.5, 100.0);

    // Step 2: place cursor after timerA( and expect TON signature.
    // Expect: TON(IN: BOOL; PT: TIME) with IN then PT highlighted by position.
    timerA(IN := TRUE, PT := T#2s);

    // Step 3: place cursor after counterA( and expect CTU signature.
    // Expect: CTU(CU: BOOL; R: BOOL; PV: INT).
    counterA(CU := TRUE, R := FALSE, PV := 10);

    // Step 4: place cursor after filterA( and expect custom FB signature.
    // Expect: FB_Filter(Enable: BOOL; Raw: REAL; Alpha: REAL).
    filterA(Enable := TRUE, Raw := 7.5, Alpha := 0.2);

    // Step 5: place cursor after CalcGain( and expect custom function signature.
    // Expect: CalcGain(InputValue: REAL; Gain: REAL): REAL.
    result := CalcGain(InputValue := 5.0, Gain := 1.5);

    // Step 6: manual trigger test.
    // Place cursor inside any call argument list, press Ctrl+Shift+Space.
    // Expect: same signature help appears even without typing '(' or ','.
END_PROGRAM
