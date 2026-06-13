; Indent after opening braces
(block "{" @indent)
(class_body "{" @indent)
(object_literal "{" @indent)
(switch_statement "{" @indent)

; Dedent on closing braces
(block "}" @end)
(class_body "}" @end)
(object_literal "}" @end)
(switch_statement "}" @end)
