// IEC 61131-3 Standard Timer Function Block: TOF (Timer Off Delay)
// This is a virtual definition file for language server navigation

FUNCTION_BLOCK TOF
VAR_INPUT
    IN : BOOL;      // Timer input signal
    PT : TIME;      // Preset time - delay duration
END_VAR
VAR_OUTPUT
    Q : BOOL;       // Timer output - FALSE when timer elapsed
    ET : TIME;      // Elapsed time - current timer value
END_VAR

// Standard behavior:
// When IN transitions from TRUE to FALSE, timer starts counting
// Q becomes FALSE when ET reaches PT
// Q is TRUE when IN is TRUE or when timer is running (ET < PT)

END_FUNCTION_BLOCK
