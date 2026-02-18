(*
    TON - On-Delay Timer (IEC 61131-3)

    Starts timing when IN transitions FALSE -> TRUE.
    Q becomes TRUE after elapsed time ET reaches preset PT.
    Q stays TRUE while IN remains TRUE.
    When IN goes FALSE, Q resets immediately and ET resets to T#0s.

    Typical uses: motor start delays, alarm confirmation, process step durations.

    Example:
        MyTimer(IN := StartCondition, PT := T#5s);
        IF MyTimer.Q THEN
            // 5 seconds elapsed since StartCondition went TRUE
        END_IF;
*)

FUNCTION_BLOCK TON
VAR_INPUT
    IN : BOOL;      // Start signal - rising edge starts timer
    PT : TIME;      // Preset time - delay duration before Q goes TRUE
END_VAR
VAR_OUTPUT
    Q : BOOL;       // Output - TRUE when ET >= PT and IN is TRUE
    ET : TIME;      // Elapsed time - counts from T#0s to PT while IN is TRUE
END_VAR

END_FUNCTION_BLOCK
