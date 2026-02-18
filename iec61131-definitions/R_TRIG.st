(*
    R_TRIG - Rising Edge Detector (IEC 61131-3)

    Q is TRUE for exactly one scan cycle when CLK transitions FALSE -> TRUE.
    Q is FALSE at all other times.
    Uses internal memory M to track previous CLK state.

    Typical uses: button press detection, start triggers, rising alarm conditions.

    Example:
        StartEdge(CLK := StartButton);
        IF StartEdge.Q THEN
            // Start button just pressed (one-shot)
        END_IF;
*)

FUNCTION_BLOCK R_TRIG
VAR_INPUT
    CLK : BOOL;     // Clock input - signal to monitor for rising edge
END_VAR
VAR_OUTPUT
    Q : BOOL;       // Output - TRUE for one scan on FALSE->TRUE transition
END_VAR
VAR
    M : BOOL;       // Internal memory - previous CLK state
END_VAR

END_FUNCTION_BLOCK
