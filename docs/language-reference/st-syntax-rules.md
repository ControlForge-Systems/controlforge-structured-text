# Structured Text Syntax Rules

This document defines the formal syntax rules for the Structured Text programming language according to the IEC 61131-3 standard. These rules are used by the parser to analyze and validate ST code.

## Lexical Rules

### Identifiers

```
identifier ::= letter { letter | digit | "_" }
letter     ::= "A" | ... | "Z" | "a" | ... | "z"
digit      ::= "0" | "1" | ... | "9"
```

- Must begin with a letter
- Can contain letters, digits, and underscores
- Case-insensitive (e.g., `Variable`, `VARIABLE`, and `variable` are equivalent)
- Maximum length may be implementation-dependent (typically 128 characters)

### Literals

#### Integer Literals
```
integer_literal ::= ["+"|"-"] digit {digit} 
                  | "16#" hex_digit {hex_digit} 
                  | "8#" octal_digit {octal_digit} 
                  | "2#" bit {bit}
hex_digit       ::= digit | "A" | ... | "F" | "a" | ... | "f"
octal_digit     ::= "0" | "1" | ... | "7"
bit             ::= "0" | "1"
```

#### Real Literals
```
real_literal ::= ["+"|"-"] digit {digit} "." digit {digit} ["E" ["+"|"-"] digit {digit}]
```

#### Boolean Literals
```
boolean_literal ::= "TRUE" | "FALSE"
```

#### String Literals
```
string_literal  ::= "'" {character} "'" | '"' {character} '"'
```
- Single quotes within single-quoted strings are represented by two adjacent single quotes
- Double quotes within double-quoted strings are represented by two adjacent double quotes

#### Time Literals
```
time_literal    ::= ["T" | "TIME"] "#" [days "d"] [hours "h"] [minutes "m"] [seconds "s"] [milliseconds "ms"]
days            ::= integer_literal
hours           ::= integer_literal
minutes         ::= integer_literal
seconds         ::= integer_literal
milliseconds    ::= integer_literal
```

#### Date Literals
```
date_literal    ::= ["D" | "DATE"] "#" year "-" month "-" day
year            ::= digit digit digit digit
month           ::= digit digit
day             ::= digit digit
```

#### Date and Time Literals
```
date_time_literal ::= ["DT" | "DATE_AND_TIME"] "#" year "-" month "-" day "-" hour ":" minute ":" second
hour              ::= digit digit
minute            ::= digit digit
second            ::= digit digit
```

### Comments

```
line_comment   ::= "//" {character} end_of_line
block_comment  ::= "(*" {character | block_comment} "*)"
```
- Line comments extend to the end of the line
- Block comments can be nested (if supported by implementation)

## Program Organization Units (POUs)

Program Organization Units (POUs) are the main structural elements of a Structured Text program.

### Program Definition

```
program_declaration ::= "PROGRAM" program_name
                         {variable_declaration_section}
                         statement_list
                         "END_PROGRAM"
program_name        ::= identifier
statement_list      ::= {statement}
```

### Function Block Definition

```
function_block_declaration ::= "FUNCTION_BLOCK" function_block_name
                               {variable_declaration_section}
                               statement_list
                               "END_FUNCTION_BLOCK"
function_block_name        ::= identifier
```

### Function Definition

```
function_declaration ::= "FUNCTION" function_name ":" return_type
                          {variable_declaration_section}
                          statement_list
                          "END_FUNCTION"
function_name        ::= identifier
return_type          ::= data_type_name
```

## Variable Declarations

### Variable Declaration Sections

```
variable_declaration_section ::= var_section {variable_declaration} "END_VAR"
var_section                  ::= "VAR" [qualifier_list] 
                               | "VAR_INPUT" [qualifier_list] 
                               | "VAR_OUTPUT" [qualifier_list] 
                               | "VAR_IN_OUT" [qualifier_list] 
                               | "VAR_GLOBAL" [qualifier_list] 
                               | "VAR_EXTERNAL" [qualifier_list] 
                               | "VAR_TEMP" [qualifier_list] 
                               | "VAR_ACCESS" [qualifier_list]
qualifier_list               ::= [constant_qualifier] [retain_qualifier] [persistent_qualifier]
constant_qualifier           ::= "CONSTANT"
retain_qualifier             ::= "RETAIN"
persistent_qualifier         ::= "PERSISTENT"
```

### Variable Declaration

```
variable_declaration     ::= variable_name ":" [location] data_type_name [":" initial_value] ";"
variable_name            ::= identifier
location                 ::= "AT" direct_address
direct_address           ::= "%" [memory_area] size address
memory_area              ::= "I" | "Q" | "M"
size                     ::= "X" | "B" | "W" | "D" | "L"
address                  ::= integer_literal ["." integer_literal]
data_type_name           ::= simple_type_name | derived_type_name
simple_type_name         ::= "BOOL" | "INT" | "DINT" | "REAL" | "TIME" | "DATE" | "STRING" | ...
derived_type_name        ::= identifier
initial_value            ::= constant_expression
```

### Array Type Declaration

```
array_type_declaration ::= "ARRAY" "[" range {"," range} "]" "OF" element_type
range                  ::= start_index ".." end_index
start_index            ::= integer_literal | enumeration_value | constant_name
end_index              ::= integer_literal | enumeration_value | constant_name
element_type           ::= data_type_name
```

### Structure Type Declaration

```
structure_type_declaration ::= "STRUCT" {structure_element_declaration} "END_STRUCT"
structure_element_declaration ::= element_name ":" data_type_name ";" [comment]
element_name               ::= identifier
```

### Enumeration Type Declaration

```
enumeration_type_declaration ::= "(" enumeration_value {"," enumeration_value} ")"
enumeration_value           ::= identifier [":=" integer_literal]
```

## Statements

### Assignment Statement

```
assignment_statement ::= variable_access ":=" expression ";"
variable_access      ::= variable_name | array_access | structure_access
array_access         ::= variable_access "[" index_expression {"," index_expression} "]"
structure_access     ::= variable_access "." field_name
index_expression     ::= expression
field_name           ::= identifier
```

### If Statement

```
if_statement       ::= "IF" expression "THEN" statement_list 
                       {elsif_clause} 
                       [else_clause] 
                       "END_IF" ";"
elsif_clause       ::= "ELSIF" expression "THEN" statement_list
else_clause        ::= "ELSE" statement_list
```

### Case Statement

```
case_statement     ::= "CASE" expression "OF" 
                       case_element {case_element} 
                       [else_clause] 
                       "END_CASE" ";"
case_element       ::= case_label_list ":" statement_list
case_label_list    ::= case_label {"," case_label}
case_label         ::= constant_expression | range
```

### For Loop

```
for_statement      ::= "FOR" control_variable ":=" start_expression "TO" end_expression 
                       ["BY" step_expression] "DO" 
                       statement_list 
                       "END_FOR" ";"
control_variable   ::= identifier
start_expression   ::= expression
end_expression     ::= expression
step_expression    ::= expression
```

### While Loop

```
while_statement    ::= "WHILE" expression "DO" 
                       statement_list 
                       "END_WHILE" ";"
```

### Repeat Loop

```
repeat_statement   ::= "REPEAT" 
                       statement_list 
                       "UNTIL" expression 
                       "END_REPEAT" ";"
```

### Exit Statement

```
exit_statement     ::= "EXIT" ";"
```

### Return Statement

```
return_statement   ::= "RETURN" [expression] ";"
```

### Function Call Statement

```
function_call      ::= function_name "(" [parameter_list] ")" ";"
parameter_list     ::= parameter_assignment {"," parameter_assignment}
parameter_assignment ::= [parameter_name ":="] expression
parameter_name     ::= identifier
```

### Function Block Call Statement

```
function_block_call ::= instance_name "(" [fb_parameter_list] ")" ";"
fb_parameter_list   ::= fb_parameter_assignment {"," fb_parameter_assignment}
fb_parameter_assignment ::= [parameter_name ":="] expression
instance_name       ::= identifier
```

## Expressions

### Expression Types

```
expression           ::= simple_expression [relational_operator simple_expression]
simple_expression    ::= term {add_operator term}
term                 ::= factor {multiply_operator factor}
factor               ::= [unary_operator] primary
primary              ::= constant | variable_access | "(" expression ")" | function_call
```

### Operators

```
relational_operator  ::= "=" | "<>" | "<" | ">" | "<=" | ">="
add_operator         ::= "+" | "-" | "OR" | "XOR"
multiply_operator    ::= "*" | "/" | "MOD" | "AND"
unary_operator       ::= "-" | "NOT"
```

## Object-Oriented Features

### Class Definition

```
class_declaration ::= "CLASS" class_name ["EXTENDS" parent_class] ["IMPLEMENTS" interface_list]
                      {variable_declaration_section}
                      {method_declaration}
                      {property_declaration}
                      "END_CLASS"
class_name        ::= identifier
parent_class      ::= identifier
interface_list    ::= interface_name {"," interface_name}
interface_name    ::= identifier
```

### Interface Definition

```
interface_declaration ::= "INTERFACE" interface_name ["EXTENDS" parent_interface_list]
                          {method_declaration}
                          {property_declaration}
                          "END_INTERFACE"
parent_interface_list ::= interface_name {"," interface_name}
```

### Method Declaration

```
method_declaration ::= [access_modifier] "METHOD" method_name [":" return_type]
                       {variable_declaration_section}
                       statement_list
                       "END_METHOD"
method_name        ::= identifier
access_modifier    ::= "PUBLIC" | "PROTECTED" | "PRIVATE" | "INTERNAL"
```

### Property Declaration

```
property_declaration ::= [access_modifier] "PROPERTY" property_name ":" data_type_name
                         ["GET" statement_list "END_GET"]
                         ["SET" statement_list "END_SET"]
                         "END_PROPERTY"
property_name        ::= identifier
```

### Method Call

```
method_call ::= object_reference "." method_name "(" [parameter_list] ")" ";"
object_reference ::= variable_access
```

### Object Instantiation

```
object_instantiation ::= "NEW" class_name "(" [parameter_list] ")"
```

### Super Call

```
super_call ::= "SUPER" "." method_name "(" [parameter_list] ")" ";"
```

### This Access

```
this_access ::= "THIS" ["." member_name]
member_name ::= identifier
```

## Special Constructs

### Conditional Output

```
conditional_output ::= expression "?" true_expression ":" false_expression
true_expression   ::= expression
false_expression  ::= expression
```

### Multiple Assignments

```
multiple_assignment ::= variable_list ":=" expression ";"
variable_list       ::= variable_access {"," variable_access}
```

## Formal Grammar Summary

The following is a simplified EBNF grammar for Structured Text:

```ebnf
program = {pou_declaration};

pou_declaration = program_declaration | function_block_declaration | function_declaration | class_declaration | interface_declaration;

program_declaration = "PROGRAM", identifier, {variable_declaration_section}, statement_list, "END_PROGRAM";

function_block_declaration = "FUNCTION_BLOCK", identifier, {variable_declaration_section}, statement_list, "END_FUNCTION_BLOCK";

function_declaration = "FUNCTION", identifier, ":", data_type, {variable_declaration_section}, statement_list, "END_FUNCTION";

class_declaration = "CLASS", identifier, ["EXTENDS", identifier], ["IMPLEMENTS", identifier_list], {variable_declaration_section}, {method_declaration}, {property_declaration}, "END_CLASS";

interface_declaration = "INTERFACE", identifier, ["EXTENDS", identifier_list], {method_declaration}, {property_declaration}, "END_INTERFACE";

variable_declaration_section = var_section, {variable_declaration}, "END_VAR";

var_section = "VAR" | "VAR_INPUT" | "VAR_OUTPUT" | "VAR_IN_OUT" | "VAR_GLOBAL" | "VAR_EXTERNAL" | "VAR_TEMP" | "VAR_ACCESS", [qualifiers];

qualifiers = [constant_qualifier], [retain_qualifier], [persistent_qualifier];

variable_declaration = identifier, ":", [location], data_type, [":", initial_value], ";";

statement_list = {statement};

statement = assignment_statement | if_statement | case_statement | for_statement | while_statement | repeat_statement | exit_statement | return_statement | function_call | function_block_call | method_call;

expression = simple_expression, [relational_operator, simple_expression];

simple_expression = term, {add_operator, term};

term = factor, {multiply_operator, factor};

factor = [unary_operator], primary;

primary = constant | variable_access | "(", expression, ")" | function_call | object_instantiation;
```
