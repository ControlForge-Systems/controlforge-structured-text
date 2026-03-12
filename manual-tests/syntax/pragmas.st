(* Manual QA: pragma / attribute blocks (#81)
   OPEN: this file in VS Code with the extension active.
   USE:  Ctrl+Shift+P -> "Developer: Inspect Editor Tokens and Scopes"

   EXPECT for every {…} block:
     - entire block scoped as  meta.pragma.st
     - { and } scoped as       punctuation.definition.pragma.begin/end.st
     - directive keyword inside scoped as  keyword.other.pragma.st
     - string literals inside  highlighted normally (string.quoted.single etc.)
*)

{attribute 'qualified_only'}
{attribute 'hide'}
{attribute 'obsolete' := 'Use NewFB instead'}
{warning 'disable' '95'}

{region 'Motor Control Logic'}
(* code here *)
{endregion}

{IF defined(SIMULATION_MODE)}
(* simulation-only code *)
{ELSE}
(* hardware code *)
{ENDIF}

PROGRAM PragmaTest
{attribute 'no_check'}
VAR
    x : INT := 0;
END_VAR

x := x + 1;

END_PROGRAM
