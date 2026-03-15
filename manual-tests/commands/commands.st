(* Manual test: Extension commands
   Open this file, then test commands via Command Palette (Ctrl+Shift+P). *)

(* === Test 1: "Structured Text: Validate Syntax" === *)
(* Run command on this file — expect no errors reported *)
PROGRAM ValidSyntaxTest
VAR
    x : INT := 42;
END_VAR
    x := x + 1;
END_PROGRAM

(* === Test 2: "Structured Text: Validate Syntax" with errors === *)
(* Uncomment the block below to test error detection *)
(*
PROGRAM InvalidSyntaxTest
VAR
    y : INT
END_VAR
    y := y + 1
END_PROGRAM
*)

(* === Test 3: "Structured Text: Show Index Statistics" === *)
(* Run command — expect a notification showing symbol counts *)
(* Should report symbols from this file and any other open .st files *)

(* === Test 4: "Structured Text: Check LSP Status" === *)
(* Run command — expect a notification confirming the language server is running *)
(* If LSP is not running, expect an error message *)

(* Provide symbols for the index statistics test *)
FUNCTION_BLOCK FB_CommandTest
VAR_INPUT
    enable : BOOL;
END_VAR
VAR_OUTPUT
    status : BOOL;
END_VAR
    status := enable;
END_FUNCTION_BLOCK

FUNCTION MultiplyValues : INT
VAR_INPUT
    a : INT;
    b : INT;
END_VAR
    MultiplyValues := a * b;
END_FUNCTION
