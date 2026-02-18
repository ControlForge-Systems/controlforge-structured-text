(*
    SR - Set-Dominant Bistable (IEC 61131-3)

    Latching flip-flop where set (S1) has priority over reset (R).
    Q1 = TRUE when S1 is TRUE (regardless of R).
    Q1 = FALSE when R is TRUE and S1 is FALSE.
    Q1 holds state when both S1 and R are FALSE.

    Typical uses: start/run conditions, permissive latches.

    Example:
        RunLatch(S1 := StartCmd, R := StopCmd);
        Running := RunLatch.Q1;
        // Start always overrides stop
*)

FUNCTION_BLOCK SR
VAR_INPUT
    S1 : BOOL;      // Set input - sets Q1 TRUE (dominant, priority)
    R : BOOL;        // Reset input - resets Q1 FALSE (non-dominant)
END_VAR
VAR_OUTPUT
    Q1 : BOOL;      // Output - latched bistable state
END_VAR

END_FUNCTION_BLOCK
