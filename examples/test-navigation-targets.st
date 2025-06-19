// Test file to verify exact navigation targets
PROGRAM TestNavigation
VAR
    testTimer : TON;
END_VAR

// Navigate to these and verify the exact targets:
// 1. testTimer → should go to line 3 (local declaration)
// 2. testTimer.Q → should go to iec61131-definitions/TON.st line 9
// 3. testTimer.IN → should go to iec61131-definitions/TON.st line 5
// 4. testTimer.PT → should go to iec61131-definitions/TON.st line 6
// 5. testTimer.ET → should go to iec61131-definitions/TON.st line 10

testTimer(IN := TRUE, PT := T#5s);
IF testTimer.Q THEN
    // Timer has elapsed
END_IF

END_PROGRAM
