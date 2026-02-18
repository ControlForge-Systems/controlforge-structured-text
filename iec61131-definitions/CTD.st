(*
    CTD - Count Down Counter (IEC 61131-3)

    CV decrements by 1 on each rising edge of CD.
    Q becomes TRUE when CV <= 0.
    LD loads PV into CV when TRUE.

    Typical uses: remaining inventory, countdown sequences, quota tracking.

    Example:
        Countdown(CD := ItemDispensed, LD := Reload, PV := 50);
        IF Countdown.Q THEN
            // All items dispensed
        END_IF;
*)

FUNCTION_BLOCK CTD
VAR_INPUT
    CD : BOOL;      // Count down - CV decrements on rising edge
    LD : BOOL;      // Load - sets CV to PV when TRUE
    PV : INT;       // Preset value - initial count loaded by LD
END_VAR
VAR_OUTPUT
    Q : BOOL;       // Output - TRUE when CV <= 0
    CV : INT;       // Current value - running count
END_VAR

END_FUNCTION_BLOCK
