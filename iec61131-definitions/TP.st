(*
    TP - Pulse Timer (IEC 61131-3)

    Generates a fixed-duration pulse on rising edge of IN.
    Q goes TRUE immediately on IN rising edge and stays TRUE for PT.
    New rising edges during active pulse are ignored.
    ET counts up to PT then stops.

    Typical uses: momentary outputs, reset pulses, notification signals.

    Example:
        Pulse(IN := TriggerInput, PT := T#500ms);
        PulseOutput := Pulse.Q;
        // 500ms pulse on each rising edge of TriggerInput
*)

FUNCTION_BLOCK TP
VAR_INPUT
    IN : BOOL;      // Trigger input - rising edge starts pulse
    PT : TIME;      // Preset time - pulse duration
END_VAR
VAR_OUTPUT
    Q : BOOL;       // Pulse output - TRUE for duration PT
    ET : TIME;      // Elapsed time - counts from T#0s to PT during pulse
END_VAR

END_FUNCTION_BLOCK
