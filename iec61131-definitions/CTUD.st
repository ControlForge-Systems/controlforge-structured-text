(*
    CTUD - Count Up/Down Counter (IEC 61131-3)

    CV increments on rising edge of CU, decrements on rising edge of CD.
    QU becomes TRUE when CV >= PV.
    QD becomes TRUE when CV <= 0.
    R resets CV to 0. LD loads PV into CV.

    Typical uses: position tracking, bidirectional counting, balance calculations.

    Example:
        BiCounter(CU := AddPart, CD := RemovePart, R := FALSE, LD := FALSE, PV := 100);
        IF BiCounter.QU THEN
            // Upper limit reached
        END_IF;
*)

FUNCTION_BLOCK CTUD
VAR_INPUT
    CU : BOOL;      // Count up - CV increments on rising edge
    CD : BOOL;      // Count down - CV decrements on rising edge
    R : BOOL;       // Reset - sets CV to 0 when TRUE
    LD : BOOL;      // Load - sets CV to PV when TRUE
    PV : INT;       // Preset value - target for QU, load value for LD
END_VAR
VAR_OUTPUT
    QU : BOOL;      // Up output - TRUE when CV >= PV
    QD : BOOL;      // Down output - TRUE when CV <= 0
    CV : INT;       // Current value - running count
END_VAR

END_FUNCTION_BLOCK
