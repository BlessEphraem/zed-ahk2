; Functions
(function_definition
  name: (identifier) @name) @item

; Classes
(class_definition
  name: (identifier) @name) @item

; Methods inside classes
(method_definition
  name: (identifier) @name) @item

; Hotkeys (show trigger in outline)
(hotkey
  (hotkey_trigger) @name) @item

; Labels (goto targets)
(label
  (identifier) @name) @item
