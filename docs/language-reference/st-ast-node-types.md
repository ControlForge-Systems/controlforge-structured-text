# AST Node Types

This document defines the Abstract Syntax Tree (AST) node types used for parsing and analyzing Structured Text programs in the ControlForge Structured Text extension.

## Introduction to AST

The Abstract Syntax Tree (AST) represents the hierarchical structure of a Structured Text program after parsing. It transforms the flat sequence of tokens into a structured representation that preserves the semantics and relationships between different elements of the code.

## Common Node Properties

All AST nodes share these common properties:

```typescript
interface ASTNode {
    type: string;         // The type of the node (e.g., 'Program', 'Assignment')
    range: Range;         // The source code range (start and end positions)
    parent?: ASTNode;     // Reference to the parent node (if any)
    children: ASTNode[];  // Child nodes (if any)
}

interface Range {
    start: Position;      // Start position in the source
    end: Position;        // End position in the source
}

interface Position {
    line: number;         // 0-based line number
    character: number;    // 0-based character offset
}
```

## Core AST Node Types

The following table lists the core AST node types used in the parsing and analysis of Structured Text code:

| Node Type | Description | Example Syntax |
|-----------|-------------|----------------|
| `Program` | Root node for a PROGRAM definition | `PROGRAM MyProgram ... END_PROGRAM` |
| `FunctionBlock` | Root node for a FUNCTION_BLOCK definition | `FUNCTION_BLOCK FB1 ... END_FUNCTION_BLOCK` |
| `Function` | Root node for a FUNCTION definition | `FUNCTION Func1 : INT ... END_FUNCTION` |
| `Class` | Root node for a CLASS definition | `CLASS Motor ... END_CLASS` |
| `Interface` | Root node for an INTERFACE definition | `INTERFACE IMovable ... END_INTERFACE` |
| `Method` | Method definition within a class or interface | `METHOD Move : BOOL ... END_METHOD` |
| `Property` | Property definition within a class | `PROPERTY Position : REAL ... END_PROPERTY` |

## Declaration Nodes

Nodes related to variable declarations:

| Node Type | Description | Example Syntax |
|-----------|-------------|----------------|
| `VariableDeclaration` | A variable declaration | `myVar : INT;` |
| `VariableDeclarationSection` | A section of variable declarations | `VAR ... END_VAR` |
| `ParameterDeclaration` | A parameter declaration | `VAR_INPUT start : BOOL; END_VAR` |
| `TypeDeclaration` | A user-defined type declaration | `TYPE MyType : INT; END_TYPE` |
| `StructDeclaration` | A structure type declaration | `TYPE Person : STRUCT ... END_STRUCT; END_TYPE` |
| `EnumDeclaration` | An enumeration type declaration | `TYPE Colors : (Red, Green, Blue); END_TYPE` |
| `ArrayTypeDeclaration` | An array type declaration | `TYPE IntArray : ARRAY[1..10] OF INT; END_TYPE` |

## Statement Nodes

Nodes representing executable statements:

| Node Type | Description | Example Syntax |
|-----------|-------------|----------------|
| `Assignment` | An assignment statement | `x := 10;` |
| `IfStatement` | An IF statement | `IF condition THEN ... END_IF` |
| `ForLoop` | A FOR loop | `FOR i := 1 TO 10 DO ... END_FOR` |
| `WhileLoop` | A WHILE loop | `WHILE condition DO ... END_WHILE` |
| `RepeatLoop` | A REPEAT loop | `REPEAT ... UNTIL condition` |
| `CaseStatement` | A CASE statement | `CASE expr OF ... END_CASE` |
| `FunctionCall` | A function call | `result := Func(x, y);` |
| `FunctionBlockCall` | A function block call | `FB_inst(IN1 := x, IN2 := y);` |
| `MethodCall` | A method call on an object | `motor.Move(10.0);` |
| `ReturnStatement` | A RETURN statement | `RETURN;` or `RETURN value;` |
| `ExitStatement` | An EXIT statement | `EXIT;` |
| `ContinueStatement` | A CONTINUE statement | `CONTINUE;` |

## Expression Nodes

Nodes representing expressions and values:

| Node Type | Description | Example Syntax |
|-----------|-------------|----------------|
| `Expression` | A general expression | `x + y * z` |
| `BinaryExpression` | A binary operation | `a AND b` |
| `UnaryExpression` | A unary operation | `NOT a` |
| `Literal` | A literal value | `123`, `'text'`, `TRUE` |
| `Identifier` | A variable or symbol reference | `myVariable` |
| `ArrayAccess` | Array element access | `arr[i]` |
| `StructAccess` | Structure field access | `person.name` |
| `MemberAccess` | Object member access | `motor.position` |
| `ParenthesizedExpression` | Expression in parentheses | `(a + b)` |
| `FunctionCallExpression` | Function call in expression | `Max(a, b)` |
| `MethodCallExpression` | Method call in expression | `obj.GetValue()` |

## Object-Oriented Nodes

Nodes specific to object-oriented programming features:

| Node Type | Description | Example Syntax |
|-----------|-------------|----------------|
| `ClassDeclaration` | Class definition | `CLASS Motor ... END_CLASS` |
| `InterfaceDeclaration` | Interface definition | `INTERFACE IMovable ... END_INTERFACE` |
| `MethodDeclaration` | Method definition | `METHOD Move : BOOL ... END_METHOD` |
| `PropertyDeclaration` | Property definition | `PROPERTY Position : REAL ... END_PROPERTY` |
| `PropertyGetter` | Property getter | `GET ... END_GET` |
| `PropertySetter` | Property setter | `SET ... END_SET` |
| `SuperCall` | Call to parent class method | `SUPER.Initialize();` |
| `ThisAccess` | Reference to current instance | `THIS.member` |
| `ObjectInstantiation` | Creation of a new object | `motor := NEW Motor();` |

## TypeScript Interface Definitions

Here are the TypeScript interfaces for the key AST nodes:

```typescript
// Base AST Node
interface ASTNode {
    type: string;
    range: Range;
    parent?: ASTNode;
    children: ASTNode[];
}

// Program Organization Units
interface Program extends ASTNode {
    type: 'Program';
    name: string;
    variables: VariableDeclarationSection[];
    statements: Statement[];
}

interface FunctionBlock extends ASTNode {
    type: 'FunctionBlock';
    name: string;
    variables: VariableDeclarationSection[];
    statements: Statement[];
}

interface Function extends ASTNode {
    type: 'Function';
    name: string;
    returnType: string;
    variables: VariableDeclarationSection[];
    statements: Statement[];
}

// Object-Oriented Constructs
interface Class extends ASTNode {
    type: 'Class';
    name: string;
    extends?: string;
    implements?: string[];
    variables: VariableDeclarationSection[];
    methods: MethodDeclaration[];
    properties: PropertyDeclaration[];
}

interface Interface extends ASTNode {
    type: 'Interface';
    name: string;
    extends?: string[];
    methods: MethodDeclaration[];
    properties: PropertyDeclaration[];
}

interface MethodDeclaration extends ASTNode {
    type: 'MethodDeclaration';
    name: string;
    returnType: string;
    accessModifier?: 'PUBLIC' | 'PROTECTED' | 'PRIVATE' | 'INTERNAL';
    variables: VariableDeclarationSection[];
    statements: Statement[];
}

// Declarations
interface VariableDeclaration extends ASTNode {
    type: 'VariableDeclaration';
    name: string;
    dataType: string;
    initialValue?: Expression;
    qualifiers: string[]; // CONSTANT, RETAIN, etc.
}

interface VariableDeclarationSection extends ASTNode {
    type: 'VariableDeclarationSection';
    sectionType: 'VAR' | 'VAR_INPUT' | 'VAR_OUTPUT' | 'VAR_IN_OUT' | 'VAR_GLOBAL' | 'VAR_TEMP' | 'VAR_EXTERNAL';
    declarations: VariableDeclaration[];
    qualifiers: string[]; // CONSTANT, RETAIN, etc.
}

// Statements
interface Statement extends ASTNode {
    type: string; // Base for all statements
}

interface Assignment extends Statement {
    type: 'Assignment';
    target: Expression; // Left side
    value: Expression;  // Right side
}

interface IfStatement extends Statement {
    type: 'IfStatement';
    condition: Expression;
    thenStatements: Statement[];
    elseIfClauses: ElseIfClause[];
    elseStatements: Statement[];
}

interface ElseIfClause extends ASTNode {
    type: 'ElseIfClause';
    condition: Expression;
    statements: Statement[];
}

interface ForLoop extends Statement {
    type: 'ForLoop';
    variable: string;
    startValue: Expression;
    endValue: Expression;
    stepValue?: Expression;
    statements: Statement[];
}

// Expressions
interface Expression extends ASTNode {
    type: string; // Base for all expressions
}

interface BinaryExpression extends Expression {
    type: 'BinaryExpression';
    operator: string; // +, -, *, /, AND, OR, etc.
    left: Expression;
    right: Expression;
}

interface UnaryExpression extends Expression {
    type: 'UnaryExpression';
    operator: string; // -, NOT, etc.
    operand: Expression;
}

interface Literal extends Expression {
    type: 'Literal';
    valueType: 'INTEGER' | 'REAL' | 'BOOLEAN' | 'STRING' | 'TIME' | 'DATE';
    value: string | number | boolean;
}

interface Identifier extends Expression {
    type: 'Identifier';
    name: string;
}

interface MemberAccess extends Expression {
    type: 'MemberAccess';
    object: Expression;
    member: string;
}
```

## Node Hierarchy Example

Here's an example of the AST node hierarchy for a simple Structured Text program:

```
PROGRAM SimpleProgram
    VAR
        x : INT := 10;
        y : INT;
    END_VAR

    IF x > 5 THEN
        y := x * 2;
    ELSE
        y := x;
    END_IF
END_PROGRAM
```

AST structure:
```
Program (SimpleProgram)
├── VariableDeclarationSection (VAR)
│   ├── VariableDeclaration (x: INT := 10)
│   └── VariableDeclaration (y: INT)
└── IfStatement
    ├── Condition: BinaryExpression (x > 5)
    │   ├── Left: Identifier (x)
    │   ├── Operator: >
    │   └── Right: Literal (5)
    ├── ThenStatements:
    │   └── Assignment (y := x * 2)
    │       ├── Target: Identifier (y)
    │       └── Value: BinaryExpression (x * 2)
    │           ├── Left: Identifier (x)
    │           ├── Operator: *
    │           └── Right: Literal (2)
    └── ElseStatements:
        └── Assignment (y := x)
            ├── Target: Identifier (y)
            └── Value: Identifier (x)
```
