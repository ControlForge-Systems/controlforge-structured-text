(* Manual test: Cross-file rename — main program file
   Pair with cross-file-rename-fb.st in the same folder.
   See cross-file-rename-fb.st for full setup instructions. *)

PROGRAM ConveyorControl
VAR
    (* Instance typed as ConveyorDrive — should be renamed in TEST A/B *)
    drive   : ConveyorDrive;
    ready   : BOOL;
    speed   : REAL := 1.5;
END_VAR
    drive(enable := ready, setSpeed := speed);

    IF drive.running THEN
        (* ConveyorDrive is operating *)
        ready := TRUE;
    END_IF

    IF drive.fault THEN
        ready := FALSE;
    END_IF
END_PROGRAM
