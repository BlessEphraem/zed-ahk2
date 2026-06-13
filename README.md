# AutoHotkey 2.0 — Zed Extension

Syntax highlighting for [AutoHotkey v2](https://www.autohotkey.com/) in the [Zed](https://zed.dev) editor.

## Features

- Full syntax highlighting for AHK2 (.ahk, .ah2, .ahk2 files)
- Class and method definitions
- Hotkeys and hotstrings (including AZERTY / non-ASCII keys: `#é::`, `#²::`, `!&::`, …)
- Directives (`#Requires`, `#Include`, `#HotIf`, …)
- Built-in variables (`A_ThisHotkey`, `A_ScriptDir`, …)
- Control flow (`if`, `while`, `loop`, `for`, `switch`, `try`/`catch`/`finally`)
- Arrow functions, object literals, array literals
- Line comments (`;`) and block comments (`/* */` and `/** */`)
- Bracket matching and auto-indent

## Installation

Search for **AutoHotkey 2.0** in Zed's extension marketplace (`Zed > Extensions`).

## Supported file extensions

| Extension | Description |
|-----------|-------------|
| `.ahk`    | AutoHotkey (v1 and v2) |
| `.ah2`    | AutoHotkey v2 explicit |
| `.ahk2`   | AutoHotkey v2 explicit |

## Grammar

The tree-sitter grammar is written from scratch for AHK2. It handles:

- Case-insensitive keywords (`IF`, `if`, `If` are all valid)
- Ambiguous `{}` syntax (block vs object literal)
- GLR parsing for constructs sharing token sequences
- Unicode/non-ASCII hotkey triggers

## License

MIT — see [LICENSE](LICENSE)
