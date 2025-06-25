# Object-Oriented Programming in Structured Text

This document covers the object-oriented programming (OOP) features in Structured Text according to the IEC 61131-3 standard (Edition 3 and later). These features enable more modular, reusable, and maintainable code in industrial automation applications.

## Introduction to OOP in IEC 61131-3

The IEC 61131-3 standard Edition 3 introduced object-oriented programming concepts to Structured Text, including:

- Classes and Objects
- Inheritance
- Interfaces
- Methods
- Access Modifiers
- Properties
- Polymorphism

These features align ST with modern programming paradigms while maintaining compatibility with traditional PLC programming approaches.

## Classes and Objects

### Class Definition

Classes define new reference data types with their own variables (attributes) and methods.

```
CLASS ClassName [EXTENDS ParentClass] [IMPLEMENTS Interface1, Interface2, ...]
    [variable_declarations]
    [method_declarations]
    [property_declarations]
END_CLASS
```

### Object Instantiation

Objects (instances of classes) are created using the `NEW` keyword:

```
object_name := NEW ClassName([constructor_parameters]);
```

### Class Members

Classes can contain:
- Variables (attributes)
- Methods
- Properties
- Access modifiers to control visibility

### Example: Basic Class Definition

```
CLASS Motor
    VAR
        Speed : REAL;
        MaxSpeed : REAL := 100.0;
        IsRunning : BOOL := FALSE;
    END_VAR
    
    METHOD PUBLIC Start : BOOL
        IF NOT IsRunning THEN
            IsRunning := TRUE;
            Start := TRUE;
        ELSE
            Start := FALSE;  // Already running
        END_IF
    END_METHOD
    
    METHOD PUBLIC Stop : BOOL
        IsRunning := FALSE;
        Speed := 0.0;
        Stop := TRUE;
    END_METHOD
    
    METHOD PUBLIC SetSpeed : BOOL
        VAR_INPUT
            RequestedSpeed : REAL;
        END_VAR
        
        IF RequestedSpeed <= MaxSpeed THEN
            Speed := RequestedSpeed;
            SetSpeed := TRUE;
        ELSE
            SetSpeed := FALSE;  // Speed too high
        END_IF
    END_METHOD
END_CLASS
```

## Inheritance

Inheritance allows a class to inherit attributes and methods from a parent class.

### Inheritance Rules

- A class can extend at most one parent class (single inheritance)
- A class can implement multiple interfaces
- The keyword `EXTENDS` is used to indicate inheritance
- A child class inherits all non-private attributes and methods from its parent class
- Child classes can override methods from the parent class
- The `SUPER` keyword provides access to the parent class implementation

### Example: Inheritance

```
CLASS BaseMotor
    VAR
        Speed : REAL;
        MaxSpeed : REAL := 100.0;
    END_VAR
    
    METHOD PUBLIC SetSpeed : BOOL
        VAR_INPUT
            RequestedSpeed : REAL;
        END_VAR
        
        IF RequestedSpeed <= MaxSpeed THEN
            Speed := RequestedSpeed;
            SetSpeed := TRUE;
        ELSE
            SetSpeed := FALSE;
        END_IF
    END_METHOD
END_CLASS

CLASS ServoMotor EXTENDS BaseMotor
    VAR
        Position : REAL;
        TargetPosition : REAL;
    END_VAR
    
    METHOD PUBLIC MoveToPosition : BOOL
        VAR_INPUT
            Target : REAL;
            MoveSpeed : REAL;
        END_VAR
        
        TargetPosition := Target;
        
        // Call inherited method using SUPER
        IF SUPER.SetSpeed(MoveSpeed) THEN
            // Position control logic here
            MoveToPosition := TRUE;
        ELSE
            MoveToPosition := FALSE;
        END_IF
    END_METHOD
END_CLASS
```

## Interfaces

Interfaces define contracts that classes must implement. They contain method signatures without implementations.

### Interface Definition

```
INTERFACE InterfaceName [EXTENDS Interface1, Interface2, ...]
    [method_declarations]
    [property_declarations]
END_INTERFACE
```

### Interface Rules

- An interface can extend multiple parent interfaces (multiple inheritance)
- Interfaces only declare method signatures without implementation
- Interfaces cannot contain variable declarations
- All methods in an interface are implicitly public
- Classes implement interfaces using the `IMPLEMENTS` keyword
- A class implementing an interface must implement all methods declared in that interface

### Example: Interfaces

```
INTERFACE IMovable
    METHOD Move : BOOL
        VAR_INPUT
            DeltaX : REAL;
            DeltaY : REAL;
        END_VAR
    END_METHOD
END_INTERFACE

INTERFACE IRotatable
    METHOD Rotate : BOOL
        VAR_INPUT
            Angle : REAL;
        END_VAR
    END_METHOD
END_INTERFACE

INTERFACE IPositionable EXTENDS IMovable, IRotatable
    METHOD SetAbsolutePosition : BOOL
        VAR_INPUT
            X : REAL;
            Y : REAL;
            Orientation : REAL;
        END_VAR
    END_METHOD
END_INTERFACE

CLASS Robot IMPLEMENTS IPositionable
    VAR
        PosX : REAL;
        PosY : REAL;
        Orientation : REAL;
    END_VAR
    
    // Implement IMovable.Move
    METHOD PUBLIC Move : BOOL
        VAR_INPUT
            DeltaX : REAL;
            DeltaY : REAL;
        END_VAR
        
        PosX := PosX + DeltaX;
        PosY := PosY + DeltaY;
        Move := TRUE;
    END_METHOD
    
    // Implement IRotatable.Rotate
    METHOD PUBLIC Rotate : BOOL
        VAR_INPUT
            Angle : REAL;
        END_VAR
        
        Orientation := Orientation + Angle;
        Rotate := TRUE;
    END_METHOD
    
    // Implement IPositionable.SetAbsolutePosition
    METHOD PUBLIC SetAbsolutePosition : BOOL
        VAR_INPUT
            X : REAL;
            Y : REAL;
            Orientation : REAL;
        END_VAR
        
        PosX := X;
        PosY := Y;
        THIS.Orientation := Orientation;
        SetAbsolutePosition := TRUE;
    END_METHOD
END_CLASS
```

## Methods

Methods are functions that belong to a class or interface. They can access and modify class attributes.

### Method Definition

```
METHOD [access_modifier] [method_qualifier] MethodName : ReturnType
    [variable_declarations]
    [statements]
END_METHOD
```

### Access Modifiers

Methods can have the following access modifiers:
- `PUBLIC`: Accessible from anywhere
- `PROTECTED`: Accessible within the class and its descendants
- `PRIVATE`: Accessible only within the declaring class (default)
- `INTERNAL`: Accessible only within the current compilation unit

### Method Qualifiers

Methods can have the following qualifiers:
- `ABSTRACT`: Declares a method without implementation that must be implemented by non-abstract derived classes
- `FINAL`: Method cannot be overridden in derived classes
- `OVERRIDE`: Explicitly indicates that a method overrides a method in the parent class
- `STATIC`: Method belongs to the class, not to instances

### Method Invocation

Methods are invoked using the dot notation:

```
result := object.Method(parameters);
```

### The THIS Keyword

The `THIS` keyword refers to the current instance of the class:

```
METHOD SetTemperature : BOOL
    VAR_INPUT
        Value : REAL;
    END_VAR
    
    THIS.temperature := Value;  // Explicit reference to class member
    SetTemperature := TRUE;
END_METHOD
```

### Example: Methods

```
CLASS Shape
    VAR
        Area : REAL;
    END_VAR
    
    METHOD PUBLIC ABSTRACT CalculateArea : REAL
        // Abstract method - must be implemented by derived classes
    END_METHOD
    
    METHOD PROTECTED FINAL ValidateDimensions : BOOL
        VAR_INPUT
            Value : REAL;
        END_VAR
        
        ValidateDimensions := Value > 0.0;
    END_METHOD
END_CLASS

CLASS Rectangle EXTENDS Shape
    VAR
        Width : REAL;
        Height : REAL;
    END_VAR
    
    METHOD PUBLIC OVERRIDE CalculateArea : REAL
        Area := Width * Height;
        CalculateArea := Area;
    END_METHOD
    
    METHOD PUBLIC SetDimensions : BOOL
        VAR_INPUT
            W : REAL;
            H : REAL;
        END_VAR
        
        IF THIS.ValidateDimensions(W) AND THIS.ValidateDimensions(H) THEN
            Width := W;
            Height := H;
            CalculateArea();  // Update area
            SetDimensions := TRUE;
        ELSE
            SetDimensions := FALSE;
        END_IF
    END_METHOD
END_CLASS
```

## Properties

Properties provide controlled access to class members through getter and setter methods.

### Property Definition

```
PROPERTY [access_modifier] PropertyName : DataType
    [GET
        [statements]
    END_GET]
    [SET
        [statements]
    END_SET]
END_PROPERTY
```

### Property Rules

- Properties can have the same access modifiers as methods
- A property must have at least one accessor (GET or SET)
- Properties with only GET are read-only
- Properties with only SET are write-only
- The GET accessor must return a value of the property's data type
- The SET accessor implicitly receives a parameter of the property's data type named `value`

### Example: Properties

```
CLASS TemperatureSensor
    VAR PRIVATE
        _temperature : REAL;
        _minTemp : REAL := -40.0;
        _maxTemp : REAL := 125.0;
    END_VAR
    
    PROPERTY PUBLIC Temperature : REAL
        GET
            Temperature := _temperature;
        END_GET
        
        SET
            // Validate and constrain temperature value
            IF value >= _minTemp AND value <= _maxTemp THEN
                _temperature := value;
            END_IF
        END_SET
    END_PROPERTY
    
    PROPERTY PUBLIC MinTemperature : REAL
        GET
            MinTemperature := _minTemp;
        END_GET
    END_PROPERTY
    
    PROPERTY PUBLIC MaxTemperature : REAL
        GET
            MaxTemperature := _maxTemp;
        END_GET
    END_PROPERTY
END_CLASS
```

## Static Members

Static members belong to the class itself, not to instances of the class.

### Static Members Definition

```
CLASS MathUtils
    VAR STATIC
        PI : REAL := 3.14159265359;
        E : REAL := 2.71828182846;
    END_VAR
    
    METHOD PUBLIC STATIC Abs : REAL
        VAR_INPUT
            Value : REAL;
        END_VAR
        
        IF Value < 0.0 THEN
            Abs := -Value;
        ELSE
            Abs := Value;
        END_IF
    END_METHOD
END_CLASS
```

### Accessing Static Members

Static members are accessed using the class name:

```
radius := 5.0;
circumference := 2.0 * MathUtils.PI * radius;
absValue := MathUtils.Abs(-10.5);
```

## Polymorphism

Polymorphism allows objects of different classes to be treated as objects of a common base class.

### Example: Polymorphism

```
CLASS Device
    VAR
        Name : STRING;
        IsActive : BOOL := FALSE;
    END_VAR
    
    METHOD PUBLIC VIRTUAL Activate : BOOL
        IsActive := TRUE;
        Activate := TRUE;
    END_METHOD
    
    METHOD PUBLIC VIRTUAL Deactivate : BOOL
        IsActive := FALSE;
        Deactivate := TRUE;
    END_METHOD
END_CLASS

CLASS Pump EXTENDS Device
    VAR
        FlowRate : REAL;
    END_VAR
    
    METHOD PUBLIC OVERRIDE Activate : BOOL
        // Pump-specific activation logic
        FlowRate := 10.0;
        SUPER.Activate();  // Call base implementation
        Activate := TRUE;
    END_METHOD
END_CLASS

CLASS Valve EXTENDS Device
    VAR
        OpenPercentage : REAL;
    END_VAR
    
    METHOD PUBLIC OVERRIDE Activate : BOOL
        // Valve-specific activation logic
        OpenPercentage := 100.0;
        SUPER.Activate();  // Call base implementation
        Activate := TRUE;
    END_METHOD
END_CLASS
```

Usage:
```
PROGRAM Main
    VAR
        devices : ARRAY[1..2] OF Device;
        pump : Pump;
        valve : Valve;
    END_VAR
    
    // Initialize
    pump := NEW Pump();
    valve := NEW Valve();
    
    // Polymorphic assignment
    devices[1] := pump;
    devices[2] := valve;
    
    // Polymorphic method calls
    devices[1].Activate();  // Calls Pump.Activate
    devices[2].Activate();  // Calls Valve.Activate
END_PROGRAM
```

## Abstract Classes

Abstract classes provide a partial implementation and cannot be instantiated directly.

### Example: Abstract Class

```
CLASS ABSTRACT Sensor
    VAR
        Value : REAL;
        Units : STRING;
    END_VAR
    
    METHOD PUBLIC ABSTRACT Read : REAL
        // Must be implemented by derived classes
    END_METHOD
    
    METHOD PROTECTED VIRTUAL ConvertRawValue : REAL
        VAR_INPUT
            RawValue : REAL;
        END_VAR
        
        // Default implementation
        ConvertRawValue := RawValue;
    END_METHOD
END_CLASS

CLASS TemperatureSensor EXTENDS Sensor
    VAR
        Offset : REAL := 0.0;
    END_VAR
    
    METHOD PUBLIC OVERRIDE Read : REAL
        VAR
            RawValue : REAL;
        END_VAR
        
        // Simulate reading from hardware
        RawValue := 25.5;
        
        // Apply conversion and offset
        Value := ConvertRawValue(RawValue) + Offset;
        Read := Value;
    END_METHOD
END_CLASS
```

## AST Node Types for OOP Constructs

The following AST node types are used for representing object-oriented constructs in the parser:

### Class Declaration Node

```typescript
interface ClassDeclaration extends ASTNode {
    type: 'ClassDeclaration';
    name: string;
    extends?: string;
    implements?: string[];
    variables: VariableDeclarationSection[];
    methods: MethodDeclaration[];
    properties: PropertyDeclaration[];
}
```

### Interface Declaration Node

```typescript
interface InterfaceDeclaration extends ASTNode {
    type: 'InterfaceDeclaration';
    name: string;
    extends?: string[];
    methods: MethodDeclaration[];
    properties: PropertyDeclaration[];
}
```

### Method Declaration Node

```typescript
interface MethodDeclaration extends ASTNode {
    type: 'MethodDeclaration';
    name: string;
    returnType: string;
    accessModifier?: 'PUBLIC' | 'PROTECTED' | 'PRIVATE' | 'INTERNAL';
    qualifiers?: ('ABSTRACT' | 'VIRTUAL' | 'OVERRIDE' | 'FINAL' | 'STATIC')[];
    variables: VariableDeclarationSection[];
    statements: Statement[];
}
```

### Property Declaration Node

```typescript
interface PropertyDeclaration extends ASTNode {
    type: 'PropertyDeclaration';
    name: string;
    dataType: string;
    accessModifier?: 'PUBLIC' | 'PROTECTED' | 'PRIVATE' | 'INTERNAL';
    getter?: Statement[];
    setter?: Statement[];
}
```

### Method Call Node

```typescript
interface MethodCall extends Statement {
    type: 'MethodCall';
    object: Expression;
    method: string;
    parameters: ParameterAssignment[];
}
```

### Object Instantiation Node

```typescript
interface ObjectInstantiation extends Expression {
    type: 'ObjectInstantiation';
    className: string;
    parameters: ParameterAssignment[];
}
```

### Super Call Node

```typescript
interface SuperCall extends Expression {
    type: 'SuperCall';
    method: string;
    parameters: ParameterAssignment[];
}
```

### This Access Node

```typescript
interface ThisAccess extends Expression {
    type: 'ThisAccess';
    member?: string;
}
```

## Implementation Considerations

When implementing OOP features in the ControlForge Structured Text extension, consider the following:

1. **Symbol Resolution**: Implement proper symbol resolution that considers inheritance hierarchies and interface implementations.

2. **Member Access**: Support dot notation for accessing class members, including proper visibility checking based on access modifiers.

3. **Type Checking**: Implement type checking that respects the "is-a" relationship established through inheritance.

4. **Method Overriding**: Support method overriding while enforcing signature compatibility between parent and child methods.

5. **Abstract Classes and Methods**: Prevent instantiation of abstract classes and ensure that all abstract methods are implemented in concrete classes.

6. **Interface Implementation**: Verify that classes implementing interfaces provide implementations for all required methods.

7. **Polymorphism**: Support polymorphic assignments and method calls.

8. **Reference Types**: Classes are reference types, unlike basic data types which are value types. Implement proper reference semantics.

9. **Garbage Collection**: Consider memory management for dynamically created objects.

10. **Static Members**: Implement special handling for static members that belong to the class rather than instances.

## Vendor-Specific Extensions

Some PLC vendors may provide extensions to the standard OOP features:

1. **Constructors and Destructors**: Special methods for initialization and cleanup.

2. **Operator Overloading**: Custom implementations of operators for class types.

3. **Generics/Templates**: Parameterized types for creating reusable class definitions.

4. **Interfaces with Default Implementations**: Interface methods with default code.

5. **Multiple Inheritance**: Inheriting from multiple base classes (not just interfaces).

When implementing vendor-specific extensions, ensure they are clearly documented and provide options for standard-compliant code.
