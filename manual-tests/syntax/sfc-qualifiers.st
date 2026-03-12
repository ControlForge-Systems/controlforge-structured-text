(* Manual QA: SFC action qualifier keywords (#83)
   OPEN: this file in VS Code with the extension active.
   USE:  Ctrl+Shift+P -> "Developer: Inspect Editor Tokens and Scopes"

   EXPECT: each qualifier token below scoped as keyword.other.sfc-qualifier.st

   NOTE: Single-letter qualifiers (N S R L D P) are matched globally.
         They will also highlight when used as standalone identifiers —
         this is a known grammar-only limitation (no SFC block context).
*)

(* Multi-character qualifiers — unambiguous *)
SD
DS
SL

(* Single-character qualifiers *)
N
S
R
L
D
P

(* Typical SFC action block usage (for visual reference) *)
ACTIONS
    N  ContinuousAction;
    S  LatchedAction;
    R  ResetLatch;
    L  TimeLimitedAction;
    D  DelayedAction;
    P  PulseOnEntry;
    SD DelayedSet:    T#2s;
    DS StoredDelayed: T#500ms;
    SL TimedLatch:    T#10s;
END_ACTIONS
