// IEC 61131-3 Standard Timer Function Block: TON (Timer On Delay)
// This is a virtual definition file for language server navigation

FUNCTION_BLOCK TON
VAR_INPUT
    IN : BOOL;      // Timer input signal - starts timer when TRUE
    PT : TIME;      // Preset time - duration of the timer
END_VAR
VAR_OUTPUT
    Q : BOOL;       // Timer output - TRUE when timer elapsed
    ET : TIME;      // Elapsed time - current timer value
END_VAR

// Standard behavior:
// When IN transitions from FALSE to TRUE, timer starts counting
// Q becomes TRUE when ET reaches PT
// Q remains TRUE as long as IN is TRUE and ET >= PT
// When IN becomes FALSE, Q immediately becomes FALSE and ET resets to T#0s

END_FUNCTION_BLOCK
