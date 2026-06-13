; Identifiers (fallback — overridden by more specific patterns below)
(identifier) @variable

; Comments
(line_comment)  @comment
(block_comment) @comment

; Strings
(string) @string

; Numbers
(number) @number

; Booleans / special values
(boolean)       @constant.builtin
(unset_literal) @constant.builtin
(this)          @variable.special
(super)         @variable.special

; A_* built-in variables
(builtin_variable) @variable.special

; Directives  (#Include, #Requires, #HotIf, …)
(directive) @attribute
(directive (directive_name) @attribute)
(directive (directive_value) @string)

; Hotkeys
(hotkey (hotkey_trigger) @label)

; Hotstrings
(hotstring ":" @punctuation.delimiter)
(hotstring "::" @punctuation.delimiter)
(hotstring (hotstring_options)     @attribute)
(hotstring (hotstring_trigger)     @string.special)
(hotstring (hotstring_replacement) @string)

; Functions
(function_definition name: (identifier) @function)

(call_expression
  function: (identifier) @function.call)

(call_expression
  function: (member_expression
    property: (identifier) @function.method))

; Classes
(class_definition  name: (identifier) @type)
(class_definition  base: (identifier) @type)
(class_body "{" @punctuation.bracket)
(class_body "}" @punctuation.bracket)

(method_definition   name: (identifier) @function.method)
(property_definition name: (identifier) @property)

; AHK2 meta-methods (__New, __Delete, __Call, __Get, __Set, __Enum)
(method_definition
  name: (identifier) @function.special
  (#match? @function.special "^__"))

; PascalCase identifiers as type references
((identifier) @type
  (#match? @type "^[A-Z][a-zA-Z0-9_]*$"))

; Member access
(member_expression "." @punctuation.delimiter)
(member_expression property: (identifier) @property)

; Labels
(label (identifier) @label)

; Control flow keywords — entire statement node captured so the keyword token
; (which uses case-insensitive regex, not a literal string) gets coloured.
; Inner named nodes have more specific captures that override this.
(if_statement)     @keyword
(while_statement)  @keyword
(loop_statement)   @keyword
(loop_statement (loop_type) @keyword)
(for_statement)    @keyword
(switch_statement) @keyword
(case_clause)      @keyword
(case_clause ":"   @punctuation.delimiter)
(default_clause)   @keyword
(default_clause ":" @punctuation.delimiter)
(try_statement)    @keyword
(catch_clause)     @keyword
(finally_clause)   @keyword

(return_statement)   @keyword
(throw_statement)    @keyword
(break_statement)    @keyword
(continue_statement) @keyword
(goto_statement)     @keyword

; class / extends keywords (case-insensitive regex, captured via parent node)
(class_definition) @keyword

; get / set in property accessors
(getter) @keyword
(setter) @keyword

; new keyword
(new_expression) @keyword

; Operators — must list anonymous tokens explicitly (wildcards don't match them)
(assignment_statement ":="  @operator)
(assignment_statement "+="  @operator)
(assignment_statement "-="  @operator)
(assignment_statement "*="  @operator)
(assignment_statement "/="  @operator)
(assignment_statement "//=" @operator)
(assignment_statement ".="  @operator)
(assignment_statement "|="  @operator)
(assignment_statement "&="  @operator)
(assignment_statement "^="  @operator)
(assignment_statement ">>=" @operator)
(assignment_statement "<<=" @operator)

(binary_expression "||"  @operator)
(binary_expression "&&"  @operator)
(binary_expression "|"   @operator)
(binary_expression "^"   @operator)
(binary_expression "&"   @operator)
(binary_expression "="   @operator)
(binary_expression "=="  @operator)
(binary_expression "!="  @operator)
(binary_expression "!==" @operator)
(binary_expression "~="  @operator)
(binary_expression "<"   @operator)
(binary_expression ">"   @operator)
(binary_expression "<="  @operator)
(binary_expression ">="  @operator)
(binary_expression "<<"  @operator)
(binary_expression ">>"  @operator)
(binary_expression "."   @operator)
(binary_expression "+"   @operator)
(binary_expression "-"   @operator)
(binary_expression "*"   @operator)
(binary_expression "/"   @operator)
(binary_expression "//"  @operator)
(binary_expression "**"  @operator)

(unary_expression "!"  @operator)
(unary_expression "-"  @operator)
(unary_expression "+"  @operator)
(unary_expression "~"  @operator)
(unary_expression "++" @operator)
(unary_expression "--" @operator)

(postfix_expression "++" @operator)
(postfix_expression "--" @operator)

(ternary_expression "?" @operator)
(ternary_expression ":" @operator)

(arrow_function "=>" @operator)

; Punctuation
(parameter_list    "(" @punctuation.bracket)
(parameter_list    ")" @punctuation.bracket)
(argument_list     "(" @punctuation.bracket)
(argument_list     ")" @punctuation.bracket)
(array_literal     "[" @punctuation.bracket)
(array_literal     "]" @punctuation.bracket)
(object_literal    "{" @punctuation.bracket)
(object_literal    "}" @punctuation.bracket)
(subscript_expression "[" @punctuation.bracket)
(subscript_expression "]" @punctuation.bracket)
(parenthesized_expression "(" @punctuation.bracket)
(parenthesized_expression ")" @punctuation.bracket)
(block "{" @punctuation.bracket)
(block "}" @punctuation.bracket)

(argument_list  "," @punctuation.delimiter)
(parameter_list "," @punctuation.delimiter)
(array_literal  "," @punctuation.delimiter)
(object_literal "," @punctuation.delimiter)
(pair ":" @punctuation.delimiter)

(percent_expression "%" @punctuation.special)

; Object literal keys
(pair key: (identifier) @property)
(pair key: (string)     @property)
(pair key: (number)     @property)

; Parameters
(parameter ":=" @operator)
(parameter name: (identifier) @variable.parameter)
(catch_clause binding: (identifier) @variable.parameter)
(catch_clause type:    (identifier) @type)

; For-loop variables
(for_statement key:   (identifier) @variable)
(for_statement value: (identifier) @variable)
