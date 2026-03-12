(* Snippet Manual Tests — IEC 61131-3 Code Snippets *)
(*
   HOW TO TEST:
   In a .st file, type the prefix and press Tab (or select from IntelliSense).
   Verify the expanded snippet body and that tab stops work correctly.

   PREFIXES TO TEST:
   st if          → IF / THEN / END_IF
   st ife         → IF / ELSIF / ELSE / END_IF
   st case        → CASE / OF / END_CASE
   st for         → FOR loop
   st while       → WHILE loop
   st repeat      → REPEAT / UNTIL loop
   st program     → PROGRAM declaration
   st function    → FUNCTION declaration
   st fb          → FUNCTION_BLOCK declaration
   st var         → VAR block
   st var_input   → VAR_INPUT block
   st var_output  → VAR_OUTPUT block
   st var_in_out  → VAR_IN_OUT block
   st var_temp    → VAR_TEMP block
   st var_global  → VAR_GLOBAL block
   st struct      → TYPE STRUCT definition
   st enum        → TYPE enumeration definition
   st union       → TYPE UNION definition
   st initial_step → SFC INITIAL_STEP
   st step        → SFC STEP
   st action      → SFC ACTION
   st transition  → SFC TRANSITION
   st class       → CLASS declaration
   st method      → METHOD declaration
   st property    → PROPERTY declaration
   st namespace   → NAMESPACE declaration
   st var decl    → single variable declaration

   EXPECTED BEHAVIOUR FOR EACH:
   - Snippet expands with correct IEC 61131-3 structure
   - First tab stop is focused immediately after expansion
   - Tab navigates through all tab stops in logical order
   - Type choice tab stops (e.g. BOOL,INT,DINT,...) show a dropdown
   - Final Tab/Enter exits the snippet
*)

(* ===== EXPECTED EXPANSIONS (reference) ===== *)

(* st if → *)
IF condition THEN
    // body
END_IF;

(* st ife → *)
IF condition THEN
    // if-body
ELSIF condition2 THEN
    // elsif-body
ELSE
    // else-body
END_IF;

(* st case → *)
CASE expression OF
    0:
        // case-body
    1:
        // case-body
ELSE
    // default-body
END_CASE;

(* st for → *)
FOR i := 0 TO 9 BY 1 DO
    // body
END_FOR;

(* st while → *)
WHILE condition DO
    // body
END_WHILE;

(* st repeat → *)
REPEAT
    // body
UNTIL condition
END_REPEAT;

(* st program → *)
PROGRAM ProgramName
VAR
    varName : BOOL;
END_VAR

    // body

END_PROGRAM

(* st function → *)
FUNCTION FunctionName : BOOL
VAR_INPUT
    paramName : BOOL;
END_VAR
VAR
    varName : BOOL;
END_VAR

    FunctionName := // return value;

END_FUNCTION

(* st fb → *)
FUNCTION_BLOCK FBName
VAR_INPUT
    inputName : BOOL;
END_VAR
VAR_OUTPUT
    outputName : BOOL;
END_VAR
VAR
    varName : BOOL;
END_VAR

    // body

END_FUNCTION_BLOCK
