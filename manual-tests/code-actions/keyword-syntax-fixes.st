(* Test: Quick fixes for ELSE IF and missing THEN/DO *)
(*
   How to use:
   1. Open this file in VS Code with the extension active
   2. Hover over each squiggled error to confirm the message
   3. Click the lightbulb (or Ctrl+.) to apply the quick fix
   4. Verify the fix produces valid ST code
*)

(* === Fix: Replace 'ELSE IF' with 'ELSIF' === *)
(* Hover: "'ELSE IF' is not valid IEC 61131-3 syntax; use 'ELSIF'" *)
(* Quick fix: "Replace 'ELSE IF' with 'ELSIF'" *)
PROGRAM FixElseIf
VAR
    x : INT := 5;
    result : INT := 0;
END_VAR
    IF x > 10 THEN
        result := 3;
    ELSE IF x > 5 THEN    // <-- apply fix here: becomes ELSIF
        result := 2;
    ELSE
        result := 1;
    END_IF;
END_PROGRAM


(* === Fix: Insert THEN after IF condition === *)
(* Hover: "'IF' is missing 'THEN'" *)
(* Quick fix: "Insert THEN" *)
PROGRAM FixMissingIfThen
VAR
    level : INT := 50;
    alarm : BOOL := FALSE;
END_VAR
    IF level > 90             // <-- apply fix here: becomes "IF level > 90 THEN"
        alarm := TRUE;
    END_IF;
END_PROGRAM


(* === Fix: Insert THEN after ELSIF condition === *)
(* Hover: "'ELSIF' is missing 'THEN'" *)
(* Quick fix: "Insert THEN" *)
PROGRAM FixMissingElsifThen
VAR
    level : INT := 50;
    zone : INT := 0;
END_VAR
    IF level > 90 THEN
        zone := 3;
    ELSIF level > 70          // <-- apply fix here: becomes "ELSIF level > 70 THEN"
        zone := 2;
    END_IF;
END_PROGRAM


(* === Fix: Insert DO after FOR header === *)
(* Hover: "'FOR' is missing 'DO'" *)
(* Quick fix: "Insert DO" *)
PROGRAM FixMissingForDo
VAR
    i : INT := 0;
    sum : INT := 0;
END_VAR
    FOR i := 1 TO 10          // <-- apply fix here: becomes "FOR i := 1 TO 10 DO"
        sum := sum + i;
    END_FOR;
END_PROGRAM


(* === Fix: Insert DO after WHILE condition === *)
(* Hover: "'WHILE' is missing 'DO'" *)
(* Quick fix: "Insert DO" *)
PROGRAM FixMissingWhileDo
VAR
    count : INT := 10;
END_VAR
    WHILE count > 0            // <-- apply fix here: becomes "WHILE count > 0 DO"
        count := count - 1;
    END_WHILE;
END_PROGRAM
