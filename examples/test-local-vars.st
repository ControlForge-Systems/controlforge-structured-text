// Quick test to verify local variable symbol indexing
PROGRAM TestLocalVars
VAR
    testTimer : TON;
    testCounter : CTU;
    localFlag : BOOL;
END_VAR

// Test navigation on these:
// 1. testTimer (should go to declaration)
// 2. testTimer.Q (should go to TON.Q member)
// 3. localFlag (should go to declaration)

testTimer(IN := TRUE, PT := T#1s);
localFlag := testTimer.Q;

END_PROGRAM
