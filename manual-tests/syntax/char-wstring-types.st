(* Manual QA: WSTRING / CHAR / WCHAR data types (#87)
   OPEN: this file in VS Code with the extension active.
   USE:  Ctrl+Shift+P -> "Developer: Inspect Editor Tokens and Scopes"
   EXPECT: CHAR, WCHAR, WSTRING each scoped as storage.type.st
*)

PROGRAM CharTypeTest
VAR
    myChar    : CHAR    := 'A';          (* EXPECT: CHAR    → storage.type.st *)
    myWChar   : WCHAR   := "Ω";          (* EXPECT: WCHAR   → storage.type.st *)
    myString  : STRING[80] := 'hello';   (* EXPECT: STRING  → storage.type.st *)
    myWString : WSTRING[80] := "wide";   (* EXPECT: WSTRING → storage.type.st *)
END_VAR

END_PROGRAM
