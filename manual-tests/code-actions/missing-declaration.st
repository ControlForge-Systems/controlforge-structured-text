// Manual test: Missing Variable Declaration Detection & Auto-Fix
//
// How to test:
//  1. Open this file in VS Code with ControlForge ST extension active.
//  2. The undefined variables below will show yellow squiggles.
//  3. Hover over each squiggle or click the light bulb (Ctrl+.) to see quick fixes.
//
// Expected quick-fix actions per variable:
//  - undeclaredBool  → "Declare 'undeclaredBool' as BOOL"
//  - undeclaredInt   → "Declare 'undeclaredInt' as INT"
//  - undeclaredReal  → "Declare 'undeclaredReal' as REAL"
//  - undeclaredTime  → "Declare 'undeclaredTime' as TIME"
//  - undeclaredStr   → "Declare 'undeclaredStr' as STRING"
//  - myTimer         → "Declare 'myTimer' as TON"
//  - myCounter       → "Declare 'myCounter' as CTU"
//
// When there are multiple undefined vars, an additional batch action appears:
//  - "Declare all N undefined variables"
//
// After applying a fix, the new declaration should appear inside the VAR block
// and the squiggle should disappear.

PROGRAM MissingDeclarationTest
VAR
    existingVar : INT := 0;
END_VAR

    // BOOL — assigned TRUE/FALSE
    undeclaredBool := TRUE;

    // INT — assigned integer literal
    undeclaredInt := 100;

    // REAL — assigned float literal
    undeclaredReal := 3.14;

    // TIME — assigned T# literal
    undeclaredTime := T#10s;

    // STRING — assigned string literal
    undeclaredStr := 'hello world';

    // TON instance — member access .Q and .ET
    myTimer(IN := existingVar > 0, PT := T#5s);
    IF myTimer.Q THEN
        existingVar := myTimer.ET;
    END_IF

    // CTU instance — member access .CV
    myCounter(CU := undeclaredBool, R := FALSE, PV := 10);
    existingVar := myCounter.CV;

END_PROGRAM


// Test: no local VAR block — fix should create one
PROGRAM NoPriorVarBlock
VAR_INPUT
    trigger : BOOL;
END_VAR

    // undeclaredLocal should get a new VAR block inserted
    undeclaredLocal := 99;

END_PROGRAM
