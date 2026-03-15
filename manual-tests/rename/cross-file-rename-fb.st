(* Manual test: Cross-file rename — FB definition file
   Pair with cross-file-rename-main.st in the same folder.

   SETUP
   -----
   1. Open BOTH this file and cross-file-rename-main.st in VS Code.
   2. The workspace indexer will index both on open.

   TEST A — Rename the FB type from its definition
   ------------------------------------------------
   1. Place cursor on "ConveyorDrive" below (line: FUNCTION_BLOCK ConveyorDrive).
   2. Press F2.
   3. Type "ConveyorMotor" and confirm.
   EXPECTED
   - This file: "ConveyorDrive" is renamed in the FUNCTION_BLOCK header.
   - cross-file-rename-main.st: the VAR declaration "drive : ConveyorDrive;"
     and any other occurrences of ConveyorDrive are also renamed.

   TEST B — Rename the FB type from its usage in main file
   --------------------------------------------------------
   1. Open cross-file-rename-main.st.
   2. Place cursor on "ConveyorDrive" in the VAR block.
   3. Press F2, type "ConveyorMotor".
   EXPECTED — same as TEST A. *)

FUNCTION_BLOCK ConveyorDrive
VAR_INPUT
    enable  : BOOL;
    setSpeed : REAL;
END_VAR
VAR_OUTPUT
    running : BOOL;
    fault   : BOOL;
END_VAR
VAR
    _speed : REAL;
END_VAR
    IF enable THEN
        _speed  := setSpeed;
        running := TRUE;
        fault   := FALSE;
    ELSE
        running := FALSE;
    END_IF
END_FUNCTION_BLOCK
