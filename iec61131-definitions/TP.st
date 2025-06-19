// IEC 61131-3 Standard Timer Function Block: TP (Timer Pulse)
// This is a virtual definition file for language server navigation

FUNCTION_BLOCK TP
VAR_INPUT
    IN : BOOL;      // Timer input signal - trigger pulse
    PT : TIME;      // Preset time - pulse duration
END_VAR
VAR_OUTPUT
    Q : BOOL;       // Timer output - pulse output
    ET : TIME;      // Elapsed time - current timer value
END_VAR

// Standard behavior:
// When IN transitions from FALSE to TRUE, timer starts and Q becomes TRUE
// Q remains TRUE for duration PT, then becomes FALSE
// New triggers during active pulse are ignored

END_FUNCTION_BLOCK
