(*
    RS - Reset-Dominant Bistable (IEC 61131-3)

    Latching flip-flop where reset (R1) has priority over set (S).
    Q1 = TRUE when S is TRUE and R1 is FALSE.
    Q1 = FALSE when R1 is TRUE (regardless of S).
    Q1 holds state when both S and R1 are FALSE.

    Typical uses: emergency stop latches, fault conditions requiring manual reset.

    Example:
        EStopLatch(S := StartPermit, R1 := EStopPressed);
        MotorEnable := EStopLatch.Q1;
        // EStop always overrides start permit
*)

FUNCTION_BLOCK RS
VAR_INPUT
    S : BOOL;       // Set input - sets Q1 TRUE (non-dominant)
    R1 : BOOL;      // Reset input - resets Q1 FALSE (dominant, priority)
END_VAR
VAR_OUTPUT
    Q1 : BOOL;      // Output - latched bistable state
END_VAR

END_FUNCTION_BLOCK
