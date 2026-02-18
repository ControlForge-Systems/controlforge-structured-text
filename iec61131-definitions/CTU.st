(*
    CTU - Count Up Counter (IEC 61131-3)

    CV increments by 1 on each rising edge of CU.
    Q becomes TRUE when CV >= PV.
    R resets CV to 0 and Q to FALSE.

    Typical uses: production counting, cycle tracking, batch quantities.

    Example:
        Counter(CU := PartSensor, R := ResetBtn, PV := 100);
        IF Counter.Q THEN
            // 100 parts counted
        END_IF;
*)

FUNCTION_BLOCK CTU
VAR_INPUT
    CU : BOOL;      // Count up - CV increments on rising edge
    R : BOOL;       // Reset - sets CV to 0 when TRUE
    PV : INT;       // Preset value - target count for Q output
END_VAR
VAR_OUTPUT
    Q : BOOL;       // Output - TRUE when CV >= PV
    CV : INT;       // Current value - running count
END_VAR

END_FUNCTION_BLOCK
