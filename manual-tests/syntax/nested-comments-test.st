// Manual test: nested block comments (issue #84)
// Expected: all (* *) blocks highlighted as comments, including nested content

// Level 1 — single block comment (baseline)
(* This is a simple block comment *)

// Level 2 — one level of nesting
(* outer comment (* inner comment *) back to outer *)

// Level 3 — two levels of nesting
(* outer (* middle (* inner *) middle *) outer *)

// Mixed with code — code between nested comments should NOT be highlighted as comment
PROGRAM NestedCommentTest
VAR
    x : INT; (* inline comment *)
    y : INT; (* outer (* nested *) outer *)
END_VAR

(* This comment spans
   multiple lines
   (* with a nested comment inside *)
   and continues after *)
x := 1;

// Line comments unaffected
// (* this is a line comment, not a block comment *)

END_PROGRAM
