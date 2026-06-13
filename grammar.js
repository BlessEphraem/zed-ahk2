/**
 * @file AutoHotkey v2 grammar for tree-sitter
 * @license MIT
 *
 * Design notes
 * ─────────────
 * AHK2 is line-oriented (newlines are statement separators) and uses the same
 * `{`/`}` syntax for both blocks and object literals, making a fully unambiguous
 * LR grammar impractical without an external scanner.
 *
 * This grammar is optimised for *syntax highlighting*, not a perfect AST.
 * Whitespace (including newlines) is placed in `extras` so the parser is not
 * line-sensitive. Complex constructs that share token sequences with simpler
 * ones are handled via GLR conflicts declared explicitly.
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: 'ahk2',

  word: $ => $.identifier,

  extras: $ => [
    /\s/,
    $.line_comment,
    $.block_comment,
  ],

  conflicts: $ => [
    // function_definition vs call_expression: `name(` is ambiguous until `{` appears
    [$.function_definition, $.call_expression],
    [$.function_definition, $.expression_statement],
    // assignment vs expression: `a := b` vs `a` as expression
    [$.assignment_statement, $.expression_statement],
    // `{` → block or object_literal
    [$.block, $.object_literal],
    // `identifier :` → label or pair key or ternary context
    [$.label, $._expression],
    [$.label, $._expression, $.pair],
    [$._expression, $.pair],
    // parameter_list vs argument_list after identifier `(`
    [$.parameter_list, $.argument_list],
    // member/binary/others sharing `.` token
    [$.member_expression, $.binary_expression],
    [$.member_expression, $.binary_expression, $.unary_expression],
    [$.member_expression, $.binary_expression, $.new_expression],
    [$.member_expression, $.binary_expression, $.call_expression],
    [$.member_expression, $.binary_expression, $.postfix_expression],
    [$.member_expression, $.call_expression],
    [$.member_expression, $.subscript_expression],
    [$.member_expression, $.postfix_expression],
    [$._expression, $.parameter],
    // switch/loop/while/if: expression followed by `{`
    [$.switch_statement, $.object_literal],
    [$.switch_statement, $.expression_statement],
    [$.loop_statement, $.expression_statement],
    [$.while_statement, $.expression_statement],
    [$.for_statement, $.expression_statement],
    [$.if_statement, $.expression_statement],
    // try/catch optional clauses
    [$.catch_clause, $._expression],
    [$.catch_clause, $.label, $._expression],
    [$.subscript_expression, $.array_literal],
    [$.argument_list, $.parenthesized_expression],
  ],

  rules: {
    source_file: $ => repeat($._statement),

    // ──────────────────────────────────────────────
    // STATEMENTS
    // ──────────────────────────────────────────────
    _statement: $ => choice(
      $.directive,
      $.hotkey,
      $.hotstring,
      $.function_definition,
      $.class_definition,
      $.if_statement,
      $.while_statement,
      $.loop_statement,
      $.for_statement,
      $.switch_statement,
      $.try_statement,
      $.return_statement,
      $.throw_statement,
      $.break_statement,
      $.continue_statement,
      $.goto_statement,
      $.label,
      $.block,
      $.assignment_statement,
      $.expression_statement,
    ),

    block: $ => seq('{', repeat($._statement), '}'),

    // ──────────────────────────────────────────────
    // COMMENTS
    // ──────────────────────────────────────────────
    line_comment:  $ => token(seq(';', /.*/)),
    block_comment: $ => token(seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/')),

    // ──────────────────────────────────────────────
    // DIRECTIVES  (#Include, #Requires, #HotIf, …)
    // Whole line after `#name` captured as directive_value so the parser
    // never has to descend into it and create ambiguity.
    // ──────────────────────────────────────────────
    directive: $ => seq(
      alias(token(prec(1, '#')), '#'),
      alias($.identifier, $.directive_name),
      optional(alias(token(/[^\r\n;]+/), $.directive_value)),
    ),

    // ──────────────────────────────────────────────
    // HOTKEYS  — entire trigger is one token so `#Up::` wins over `#Update` (directive)
    // Supported forms: `^!F4::`, `#Up::`, `F1 & F2::`, `LButton up::`
    // ──────────────────────────────────────────────
    hotkey: $ => $.hotkey_trigger,

    hotkey_trigger: $ => token(prec(3, seq(
      optional(/[#!^+<>*~$]+/),
      /[A-Za-z][A-Za-z0-9_]*/,
      optional(seq(/\s+&\s+/, optional(/[#!^+<>*~$]+/), /[A-Za-z][A-Za-z0-9_]*/)),
      optional(/\s+[Uu][Pp]/),
      '::',
    ))),

    // ──────────────────────────────────────────────
    // HOTSTRINGS  (:opts:trigger::replacement)
    // ──────────────────────────────────────────────
    hotstring: $ => seq(
      ':',
      optional(alias(token(/[*?Bb0Cc\-EeIiKkMmOoPpRrSsUuXxZz0-9]*/), $.hotstring_options)),
      ':',
      alias(token(/[^:]+/), $.hotstring_trigger),
      '::',
      optional(alias(token(/[^\r\n;]*/), $.hotstring_replacement)),
    ),

    // ──────────────────────────────────────────────
    // FUNCTIONS
    // ──────────────────────────────────────────────
    function_definition: $ => prec(1, seq(
      optional(choice(kw('static'), kw('global'))),
      field('name', $.identifier),
      field('parameters', $.parameter_list),
      field('body', $.block),
    )),

    parameter_list: $ => seq('(', commaSep($.parameter), ')'),

    parameter: $ => seq(
      optional('&'),
      field('name', $.identifier),
      optional('*'),
      optional(seq(':=', field('default', $._expression))),
    ),

    // ──────────────────────────────────────────────
    // CLASSES
    // ──────────────────────────────────────────────
    class_definition: $ => seq(
      kw('class'),
      field('name', $.identifier),
      optional(seq(kw('extends'), field('base', $.identifier))),
      field('body', $.class_body),
    ),

    class_body: $ => seq('{', repeat($._class_member), '}'),

    _class_member: $ => choice(
      $.method_definition,
      $.property_definition,
    ),

    method_definition: $ => seq(
      optional(kw('static')),
      field('name', $.identifier),
      field('parameters', $.parameter_list),
      field('body', $.block),
    ),

    property_definition: $ => seq(
      optional(kw('static')),
      field('name', $.identifier),
      choice(
        seq('{', repeat(choice($.getter, $.setter)), '}'),
        seq(':=', field('value', $._expression)),
      ),
    ),

    getter: $ => seq(kw('get'), optional($.block)),
    setter: $ => seq(kw('set'), optional($.block)),

    // ──────────────────────────────────────────────
    // CONTROL FLOW
    // ──────────────────────────────────────────────
    if_statement: $ => prec.right(seq(
      kw('if'),
      field('condition', $._expression),
      field('consequence', $._statement),
      optional(seq(kw('else'), field('alternative', $._statement))),
    )),

    while_statement: $ => seq(
      kw('while'),
      field('condition', $._expression),
      field('body', $._statement),
    ),

    loop_statement: $ => seq(
      kw('loop'),
      optional(choice(
        seq(alias(kw('files'), $.loop_type), $._expression),
        seq(alias(kw('parse'), $.loop_type), $._expression),
        seq(alias(kw('read'),  $.loop_type), $._expression),
        seq(alias(kw('reg'),   $.loop_type), $._expression),
        field('count', $._expression),
      )),
      field('body', $._statement),
    ),

    for_statement: $ => seq(
      kw('for'),
      field('key', $.identifier),
      optional(seq(',', field('value', $.identifier))),
      kw('in'),
      field('iterable', $._expression),
      field('body', $._statement),
    ),

    switch_statement: $ => seq(
      kw('switch'),
      optional(field('value', $._expression)),
      '{',
      repeat(choice($.case_clause, $.default_clause)),
      '}',
    ),

    case_clause: $ => seq(
      kw('case'),
      commaSep1($._expression),
      ':',
      repeat($._statement),
    ),

    default_clause: $ => seq(
      kw('default'),
      ':',
      repeat($._statement),
    ),

    try_statement: $ => prec.right(seq(
      kw('try'),
      field('body', $._statement),
      optional($.catch_clause),
      optional($.finally_clause),
    )),

    catch_clause: $ => seq(
      kw('catch'),
      optional(seq(
        optional(field('type', $.identifier)),
        field('binding', $.identifier),
      )),
      field('handler', $._statement),
    ),

    finally_clause: $ => seq(kw('finally'), field('body', $._statement)),

    return_statement:   $ => prec.right(seq(kw('return'),   optional($._expression))),
    throw_statement:    $ => seq(kw('throw'),    $._expression),
    break_statement:    $ => prec.right(seq(kw('break'),    optional($.identifier))),
    continue_statement: $ => prec.right(seq(kw('continue'), optional($.identifier))),
    goto_statement:     $ => seq(kw('goto'), $.identifier),

    label: $ => seq($.identifier, prec(-1, ':')),

    // ──────────────────────────────────────────────
    // ASSIGNMENT
    // ──────────────────────────────────────────────
    assignment_statement: $ => prec.right(1, seq(
      field('left', choice($.identifier, $.member_expression, $.subscript_expression)),
      field('operator', choice(
        ':=', '+=', '-=', '*=', '/=', '//=', '.=',
        '|=', '&=', '^=', '>>=', '<<='
      )),
      field('right', $._expression),
    )),

    expression_statement: $ => $._expression,

    // ──────────────────────────────────────────────
    // EXPRESSIONS
    // ──────────────────────────────────────────────
    _expression: $ => choice(
      $.ternary_expression,
      $.binary_expression,
      $.unary_expression,
      $.postfix_expression,
      $.call_expression,
      $.arrow_function,
      $.member_expression,
      $.subscript_expression,
      $.new_expression,
      $.identifier,
      $.builtin_variable,
      $.number,
      $.string,
      $.boolean,
      $.unset_literal,
      $.this,
      $.super,
      $.array_literal,
      $.object_literal,
      $.parenthesized_expression,
      $.percent_expression,
    ),

    ternary_expression: $ => prec.right(1, seq(
      field('condition', $._expression),
      '?',
      field('consequence', $._expression),
      ':',
      field('alternative', $._expression),
    )),

    binary_expression: $ => {
      const ops = [
        [2,  '||'],  [2,  kw('or')],
        [3,  '&&'],  [3,  kw('and')],
        [4,  '|'],
        [5,  '^'],
        [6,  '&'],
        [7,  '='],  [7, '=='],  [7, '!='],  [7, '!=='],  [7, '~='],
        [7,  kw('is')],  [7, kw('isnot')],
        [8,  '<'],  [8, '>'],  [8, '<='],  [8, '>='],
        [9,  '<<'], [9, '>>'],
        [10, '.'],  [10, '+'], [10, '-'],
        [11, '*'],  [11, '/'], [11, '//'],
        [12, '**'],
      ];
      return choice(...ops.map(([p, op]) =>
        prec.left(/** @type {number} */ (p), seq(
          field('left', $._expression),
          field('operator', op),
          field('right', $._expression),
        ))
      ));
    },

    unary_expression: $ => prec.right(13, seq(
      field('operator', choice('!', kw('not'), '-', '+', '~', '++', '--')),
      field('operand', $._expression),
    )),

    postfix_expression: $ => prec.left(14, seq(
      field('operand', $._expression),
      field('operator', choice('++', '--')),
    )),

    call_expression: $ => prec(15, seq(
      field('function', choice($.identifier, $.member_expression, $.parenthesized_expression)),
      field('arguments', $.argument_list),
    )),

    argument_list: $ => seq('(', commaSep(optional($._expression)), ')'),

    arrow_function: $ => prec.right(0, seq(
      field('parameters', choice($.parameter_list, $.identifier)),
      '=>',
      field('body', choice($.block, $._expression)),
    )),

    member_expression: $ => prec.left(16, seq(
      field('object', $._expression),
      '.',
      field('property', $.identifier),
    )),

    subscript_expression: $ => prec.left(16, seq(
      field('object', $._expression),
      '[',
      commaSep1($._expression),
      ']',
    )),

    new_expression: $ => prec.right(15, seq(
      kw('new'),
      field('class', $._expression),
    )),

    parenthesized_expression: $ => seq('(', $._expression, ')'),

    array_literal:  $ => seq('[', commaSep(optional($._expression)), ']'),

    object_literal: $ => seq('{', commaSep($.pair), '}'),

    pair: $ => seq(
      field('key', choice($.identifier, $.string, $.number)),
      ':',
      field('value', $._expression),
    ),

    percent_expression: $ => seq('%', $._expression, '%'),

    // ──────────────────────────────────────────────
    // TERMINALS
    // ──────────────────────────────────────────────

    // Identifiers (unicode-aware: supports AHK2 non-ASCII names)
    identifier: $ => /[A-Za-z_\xC0-￿][A-Za-z0-9_\xC0-￿]*/,

    // A_* built-in variables — higher priority than plain identifier
    builtin_variable: $ => token(prec(1, /A_[A-Za-z][A-Za-z0-9]*/)),

    number: $ => token(choice(
      /0[xX][0-9a-fA-F]+/,
      /[0-9]+\.[0-9]+([eE][+-]?[0-9]+)?/,
      /[0-9]+([eE][+-]?[0-9]+)?/,
    )),

    // Strings use double quotes only in AHK2.
    // Backtick (`) is the escape character: `n `t `r `b etc.
    // A literal `"` inside a string is written as `"` (backtick-quote) or `""` (doubled).
    string: $ => seq(
      '"',
      repeat(choice(
        token.immediate(/[^"`\r\n]+/),
        token.immediate(/`./),
        token.immediate('""'),
      )),
      '"',
    ),

    boolean:       $ => token(prec(2, choice(/[Tt][Rr][Uu][Ee]/, /[Ff][Aa][Ll][Ss][Ee]/))),
    unset_literal: $ => token(prec(2, /[Uu][Nn][Ss][Ee][Tt]/)),
    this:          $ => token(prec(2, /[Tt][Hh][Ii][Ss]/)),
    super:         $ => token(prec(2, /[Ss][Uu][Pp][Ee][Rr]/)),
  },
});

/**
 * Case-insensitive keyword token, higher precedence than identifiers.
 * `kw('class')` matches "class", "CLASS", "Class", etc.
 */
function kw(word) {
  return token(prec(2,
    new RegExp(
      word.split('').map(c =>
        /[a-zA-Z]/.test(c) ? `[${c.toLowerCase()}${c.toUpperCase()}]` : c
      ).join('')
    )
  ));
}

function commaSep(rule) {
  return optional(commaSep1(rule));
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}
