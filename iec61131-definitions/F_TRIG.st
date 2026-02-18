(*
    F_TRIG - Falling Edge Detector (IEC 61131-3)

    Q is TRUE for exactly one scan cycle when CLK transitions TRUE -> FALSE.
    Q is FALSE at all other times.
    Uses internal memory M to track previous CLK state.

    Typical uses: stop command detection, end-of-cycle detection, falling alarm acknowledgment.

    Example:
        StopEdge(CLK := RunningSignal);
        IF StopEdge.Q THEN
            // Signal just dropped (one-shot)
        END_IF;
*)

FUNCTION_BLOCK F_TRIG
VAR_INPUT
    CLK : BOOL;     // Clock input - signal to monitor for falling edge
END_VAR
VAR_OUTPUT
    Q : BOOL;       // Output - TRUE for one scan on TRUE->FALSE transition
END_VAR
VAR
    M : BOOL;       // Internal memory - previous CLK state
END_VAR

END_FUNCTION_BLOCK
