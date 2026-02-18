(* Test: Orphaned END_* keywords - should show code actions to remove them *)

END_PROGRAM
(* Orphaned END_PROGRAM without opener - should offer quick fix to remove *)

PROGRAM Main
VAR
    x : INT;
END_VAR
    END_IF;
(* Orphaned END_IF without matching IF - should offer quick fix to remove *)
    
    END_VAR
(* Orphaned END_VAR - should offer quick fix to remove *)
END_PROGRAM
