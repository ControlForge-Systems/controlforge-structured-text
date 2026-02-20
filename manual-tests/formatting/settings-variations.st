(* Manual test: Formatting with different settings
   Test formatting behavior when VS Code settings are changed.
   After each setting change, format this file (Shift+Alt+F) and verify. *)

(* === Baseline: Default settings === *)
(* keywordCase: "upper", insertSpacesAroundOperators: true,
   alignVarDeclarations: true, trimTrailingWhitespace: true,
   insertFinalNewline: true *)

PROGRAM SettingsTest
VAR
    counter : INT := 0;
    temperature : REAL := 25.0;
    running : BOOL := TRUE;
    longName : DINT := 999;
END_VAR

counter := counter + 1;
temperature := temperature * 1.5 + 2.0;

IF running AND counter < 100 THEN
    running := FALSE;
END_IF

END_PROGRAM

(* === Test 1: keywordCase = "lower" === *)
(* Change setting: structured-text.format.keywordCase = "lower" *)
(* Format file, then verify: PROGRAM -> program, VAR -> var, etc. *)

(* === Test 2: keywordCase = "preserve" === *)
(* Change setting: structured-text.format.keywordCase = "preserve" *)
(* Manually type mixed case: Program, Var, If *)
(* Format file, verify: case is NOT changed *)

(* === Test 3: insertSpacesAroundOperators = false === *)
(* Change setting, format, verify: "counter:=counter+1" (no spaces) *)

(* === Test 4: alignVarDeclarations = false === *)
(* Change setting, format, verify: variable colons are NOT aligned *)

(* === Test 5: trimTrailingWhitespace = false === *)
(* Add trailing spaces to lines, format, verify: spaces preserved *)

(* === Test 6: insertFinalNewline = false === *)
(* Format, verify: no trailing newline at end of file *)

(* === Test 7: Format Selection (range formatting) === *)
(* Select only the IF block below, right-click > Format Selection *)
(* Verify: only selected range is formatted, rest unchanged *)
if running then
counter:=0;
end_if;

(* === Test 8: Idempotency === *)
(* Format this file, then format again immediately *)
(* Verify: second format produces no changes *)
