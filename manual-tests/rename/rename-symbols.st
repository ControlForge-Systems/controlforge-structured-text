(* Manual test: Rename Symbol (#28)
   Use F2 or right-click > Rename Symbol to test rename across this file.
   Verify both successful renames and rejection of invalid names. *)

(* === Test 1: Rename a local variable === *)
(* Place cursor on "counter", rename to "loopCounter" *)
(* Expected: all 3 references updated *)
PROGRAM RenameVarTest
VAR
    counter : INT := 0;
    limit : INT := 100;
END_VAR
    counter := counter + 1;
    IF counter >= limit THEN
        counter := 0;
    END_IF;
END_PROGRAM

(* === Test 2: Rename a function block instance === *)
(* Place cursor on "delayTimer", rename to "startupDelay" *)
(* Expected: all references updated including member access *)
PROGRAM RenameFBInstanceTest
VAR
    delayTimer : TON;
    done : BOOL;
END_VAR
    delayTimer(IN := TRUE, PT := T#5s);
    done := delayTimer.Q;
END_PROGRAM

(* === Test 3: Rename inside a FUNCTION_BLOCK === *)
(* Place cursor on "speed", rename to "motorSpeed" *)
FUNCTION_BLOCK FB_RenameTest
VAR_INPUT
    speed : REAL;
    enable : BOOL;
END_VAR
VAR_OUTPUT
    active : BOOL;
END_VAR
    active := enable AND (speed > 0.0);
END_FUNCTION_BLOCK

(* === Test 4: Rename a FUNCTION name === *)
(* Place cursor on "AddValues", rename to "SumValues" *)
FUNCTION AddValues : INT
VAR_INPUT
    a : INT;
    b : INT;
END_VAR
    AddValues := a + b;
END_FUNCTION

(* === Test 5: Reject reserved keyword as new name === *)
(* Place cursor on "myVar", press F2, type "IF" *)
(* Expected: rename rejected with error message *)
PROGRAM RejectKeywordTest
VAR
    myVar : INT;
END_VAR
    myVar := 42;
END_PROGRAM

(* === Test 6: Reject data type as new name === *)
(* Place cursor on "myVar2", press F2, type "BOOL" *)
(* Expected: rename rejected *)
PROGRAM RejectDataTypeTest
VAR
    myVar2 : INT;
END_VAR
    myVar2 := 10;
END_PROGRAM

(* === Test 7: Reject standard function as new name === *)
(* Place cursor on "myVar3", press F2, type "ABS" *)
(* Expected: rename rejected *)
PROGRAM RejectStdFuncTest
VAR
    myVar3 : INT;
END_VAR
    myVar3 := -5;
END_PROGRAM

(* === Test 8: Reject standard FB as new name === *)
(* Place cursor on "myVar4", press F2, type "TON" *)
(* Expected: rename rejected *)
PROGRAM RejectStdFBTest
VAR
    myVar4 : INT;
END_VAR
    myVar4 := 1;
END_PROGRAM

(* === Test 9: Case-insensitive rejection === *)
(* Place cursor on "myVar5", press F2, type "if" (lowercase) *)
(* Expected: rename rejected — keywords are case-insensitive *)
PROGRAM CaseInsensitiveRejectTest
VAR
    myVar5 : INT;
END_VAR
    myVar5 := 99;
END_PROGRAM

(* === Test 10: Cursor on keyword should not offer rename === *)
(* Place cursor on "IF" keyword below *)
(* Expected: no rename offered / prepare rename fails *)
PROGRAM NoRenameOnKeywordTest
VAR
    x : INT := 1;
END_VAR
    IF x > 0 THEN
        x := 0;
    END_IF;
END_PROGRAM
