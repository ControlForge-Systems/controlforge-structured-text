(*
    TOF - Off-Delay Timer (IEC 61131-3)

    Q is TRUE while IN is TRUE. When IN goes FALSE, timer starts.
    Q stays TRUE until ET reaches PT, then Q goes FALSE.
    If IN goes TRUE again before PT, timer resets.

    Typical uses: cooling fan run-on, valve close delays, shutdown sequences.

    Example:
        FanDelay(IN := MotorRunning, PT := T#30s);
        FanOutput := FanDelay.Q;
        // Fan stays on 30s after motor stops
*)

FUNCTION_BLOCK TOF
VAR_INPUT
    IN : BOOL;      // Timer input - Q follows IN while TRUE
    PT : TIME;      // Preset time - off-delay duration after IN goes FALSE
END_VAR
VAR_OUTPUT
    Q : BOOL;       // Output - TRUE while IN is TRUE or timer running
    ET : TIME;      // Elapsed time - counts from T#0s to PT after IN goes FALSE
END_VAR

END_FUNCTION_BLOCK
