(* Manual test: Code Formatting - Unformatted input *)
(* Use Format Document to format this file and verify results *)
(* Linux: Ctrl+Shift+I  |  Windows/macOS: Shift+Alt+F  |  Any: Ctrl+Shift+P -> "Format Document" *)

// Test 1: Keyword casing (should become uppercase)
program main
var
counter:int:=0;
temperature:real:=25.5;
isRunning:bool:=true;
longVariableName:dint:=100;
end_var

// Test 2: Indentation and operator spacing
if counter>100 then
counter:=0;
temperature:=temperature*1.1;
elsif counter>50 then
temperature:=temperature*0.99;
else
temperature:=temperature+0.1;
end_if;

// Test 3: Nested blocks
for i:=1 to 10 by 1 do
if temperature>50.0 then
counter:=counter+1;
end_if;
end_for;

// Test 4: WHILE loop
while counter<100 and temperature<80.0 do
counter:=counter+1;
end_while;

// Test 5: REPEAT..UNTIL
repeat
temperature:=temperature-0.1;
until temperature<=25.0
end_repeat;

// Test 6: CASE statement
case motorState of
STOPPED:
message:='Motor stopped';
RUNNING:
message:='Motor running';
else
message:='Unknown state';
end_case;

// Test 7: Comments should not be modified
// this comment has if then else keywords
(* block comment with var end_var inside *)

// Test 8: Strings should not be modified
message:='Hello World';
wideMsg:="Unicode Text";

end_program

// Test 9: Function block with multiple VAR sections
function_block fb_test
var_input
start:bool;
speed_setpoint:real;
enable:bool:=true;
end_var
var_output
running:bool;
actual_speed:real;
end_var
var
internal_state:int;
motor_on:bool;
end_var
running:=start and enable;
end_function_block

// Test 10: Function with return type
function celsius_to_fahrenheit:real
var_input
celsius:real;
end_var
celsius_to_fahrenheit:=celsius*9.0/5.0+32.0;
end_function
