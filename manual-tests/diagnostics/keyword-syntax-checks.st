(* Test: Keyword syntax diagnostics - ELSE IF and missing THEN/DO *)
(* Open this file in VS Code to verify diagnostics appear correctly *)

(* === ELSE IF should be ELSIF === *)
(* Expected: Error squiggle on "ELSE IF", quick fix "Replace 'ELSE IF' with 'ELSIF'" *)
PROGRAM ElseIfTest
VAR
    temp : REAL := 75.0;
    zone : INT := 0;
END_VAR
    IF temp > 100.0 THEN
        zone := 3;
    ELSE IF temp > 75.0 THEN   // <-- Error: use ELSIF
        zone := 2;
    ELSE IF temp > 50.0 THEN   // <-- Error: use ELSIF
        zone := 1;
    ELSE
        zone := 0;
    END_IF;
END_PROGRAM

(* Valid equivalent using ELSIF - no diagnostics expected *)
PROGRAM ElseIfCorrect
VAR
    temp : REAL := 75.0;
    zone : INT := 0;
END_VAR
    IF temp > 100.0 THEN
        zone := 3;
    ELSIF temp > 75.0 THEN     // <-- OK
        zone := 2;
    ELSIF temp > 50.0 THEN     // <-- OK
        zone := 1;
    ELSE
        zone := 0;
    END_IF;
END_PROGRAM

(* Case variants - all should be flagged *)
PROGRAM ElseIfCaseVariants
VAR
    x : INT := 0;
END_VAR
    IF x > 10 THEN
        x := 3;
    else if x > 5 THEN         // <-- Error: lowercase else if
        x := 2;
    Else If x > 2 THEN         // <-- Error: mixed case
        x := 1;
    END_IF;
END_PROGRAM


(* === Missing THEN after IF / ELSIF === *)
(* Expected: Error squiggle at end of condition line, quick fix "Insert THEN" *)
PROGRAM MissingThenTest
VAR
    level : INT := 0;
    alarm : BOOL := FALSE;
    warning : BOOL := FALSE;
END_VAR
    IF level > 90              // <-- Error: missing THEN
        alarm := TRUE;
        warning := TRUE;
    ELSIF level > 70           // <-- Error: missing THEN
        warning := TRUE;
    ELSE
        alarm := FALSE;
        warning := FALSE;
    END_IF;
END_PROGRAM

(* Valid - no diagnostics expected *)
PROGRAM MissingThenCorrect
VAR
    level : INT := 0;
    alarm : BOOL := FALSE;
END_VAR
    IF level > 90 THEN         // <-- OK
        alarm := TRUE;
    ELSIF level > 70 THEN      // <-- OK
        alarm := FALSE;
    END_IF;
END_PROGRAM


(* === Missing DO after FOR === *)
(* Expected: Error squiggle at end of FOR header, quick fix "Insert DO" *)
PROGRAM MissingForDoTest
VAR
    i : INT := 0;
    total : INT := 0;
END_VAR
    FOR i := 1 TO 100          // <-- Error: missing DO
        total := total + i;
    END_FOR;

    FOR i := 100 TO 1 BY -1 DO // <-- OK
        total := total - i;
    END_FOR;
END_PROGRAM


(* === Missing DO after WHILE === *)
(* Expected: Error squiggle at end of WHILE header, quick fix "Insert DO" *)
PROGRAM MissingWhileDoTest
VAR
    count : INT := 0;
END_VAR
    WHILE count < 10           // <-- Error: missing DO
        count := count + 1;
    END_WHILE;

    WHILE count > 0 DO         // <-- OK
        count := count - 1;
    END_WHILE;
END_PROGRAM


(* === No false positives === *)
(* Keywords in comments should NOT trigger diagnostics *)
PROGRAM NoFalsePositives
VAR
    x : INT := 0;
END_VAR
    (* ELSE IF this is a comment, no diagnostic expected *)
    (* IF x > 10 with no THEN, still just a comment *)
    IF x > 5 THEN
        x := 1;
    END_IF;
END_PROGRAM
