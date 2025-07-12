/**
 * Definitions pulled from vscode.d.ts (typings) and implementations
 * inspired by src/vs/workbench/api/common/extHostTypes.ts in VS Code repository.
 */

/**
 * Represents a line and character position, such as
 * the position of the cursor.
 *
 * Position objects are __immutable__. Use the {@link Position.with with} or
 * {@link Position.translate translate} methods to derive new positions
 * from an existing position.
 */
export class Position {
  /**
   * The zero-based line value.
   */
  readonly line: number

  /**
   * The zero-based character value.
   *
   * Character offsets are expressed using UTF-16 [code units](https://developer.mozilla.org/en-US/docs/Glossary/Code_unit).
   */
  readonly character: number

  /**
   * @param line A zero-based line value.
   * @param character A zero-based character value.
   */
  constructor(line: number, character: number) {
    if (line < 0) {
      // VS Code's internal implementation throws, mimicking that behavior slightly
      // Although the API type definition doesn't strictly enforce non-negative,
      // practical usage and internal logic often assume it.
      throw new Error('Illegal value for line')
    }
    if (character < 0) {
      throw new Error('Illegal value for character')
    }
    this.line = line
    this.character = character
  }

  /**
   * Check if this position is before `other`.
   *
   * @param other A position.
   * @returns `true` if position is on a smaller line
   * or on the same line on a smaller character.
   */
  isBefore(other: Position): boolean {
    if (this.line < other.line) {
      return true
    }
    if (other.line < this.line) {
      return false
    }
    return this.character < other.character
  }

  /**
   * Check if this position is before or equal to `other`.
   *
   * @param other A position.
   * @returns `true` if position is on a smaller line
   * or on the same line on a smaller or equal character.
   */
  isBeforeOrEqual(other: Position): boolean {
    if (this.line < other.line) {
      return true
    }
    if (other.line < this.line) {
      return false
    }
    return this.character <= other.character
  }

  /**
   * Check if this position is after `other`.
   *
   * @param other A position.
   * @returns `true` if position is on a greater line
   * or on the same line on a greater character.
   */
  isAfter(other: Position): boolean {
    return !this.isBeforeOrEqual(other)
  }

  /**
   * Check if this position is after or equal to `other`.
   *
   * @param other A position.
   * @returns `true` if position is on a greater line
   * or on the same line on a greater or equal character.
   */
  isAfterOrEqual(other: Position): boolean {
    return !this.isBefore(other)
  }

  /**
   * Check if this position is equal to `other`.
   *
   * @param other A position.
   * @returns `true` if the line and character of the given position are equal to
   * the line and character of this position.
   */
  isEqual(other: Position): boolean {
    return this.line === other.line && this.character === other.character
  }

  /**
   * Compare this to `other`.
   *
   * @param other A position.
   * @returns A number smaller than zero if this position is before the given position,
   * a number greater than zero if this position is after the given position, or zero when
   * this and the given position are equal.
   */
  compareTo(other: Position): number {
    if (this.line < other.line) {
      return -1
    } else if (this.line > other.line) {
      return 1
    } else {
      // equal line
      if (this.character < other.character) {
        return -1
      } else if (this.character > other.character) {
        return 1
      } else {
        // equal line and character
        return 0
      }
    }
  }

  /**
   * Create a new position relative to this position.
   *
   * @param lineDelta Delta value for the line value, default is `0`.
   * @param characterDelta Delta value for the character value, default is `0`.
   * @returns A position which line and character is the sum of the current line and
   * character and the corresponding deltas.
   */
  translate(lineDelta?: number, characterDelta?: number): Position
  /**
   * Derived a new position relative to this position.
   *
   * @param change An object that describes a delta to this position.
   * @returns A position that reflects the given delta. Will return `this` position if the change
   * is not changing anything.
   */
  translate(change: { lineDelta?: number; characterDelta?: number }): Position
  translate(
    lineDeltaOrChange?:
      | number
      | { lineDelta?: number; characterDelta?: number },
    characterDelta = 0
  ): Position {
    if (lineDeltaOrChange === null || lineDeltaOrChange === undefined) {
      return this
    }

    let lineDelta: number
    if (typeof lineDeltaOrChange === 'number') {
      lineDelta = lineDeltaOrChange
    } else {
      lineDelta = lineDeltaOrChange.lineDelta ?? 0
      characterDelta = lineDeltaOrChange.characterDelta ?? 0
    }

    if (lineDelta === 0 && characterDelta === 0) {
      return this
    }
    return new Position(this.line + lineDelta, this.character + characterDelta)
  }

  /**
   * Create a new position derived from this position.
   *
   * @param line Value that should be used as line value, default is the {@link Position.line existing value}
   * @param character Value that should be used as character value, default is the {@link Position.character existing value}
   * @returns A position where line and character are replaced by the given values.
   */
  with(line?: number, character?: number): Position
  /**
   * Derived a new position from this position.
   *
   * @param change An object that describes a change to this position.
   * @returns A position that reflects the given change. Will return `this` position if the change
   * is not changing anything.
   */
  with(change: { line?: number; character?: number }): Position
  with(
    lineOrChange?: number | { line?: number; character?: number },
    character = this.character
  ): Position {
    if (lineOrChange === null || lineOrChange === undefined) {
      return this
    }

    let line: number
    if (typeof lineOrChange === 'number') {
      line = lineOrChange
    } else {
      line = lineOrChange.line ?? this.line
      character = lineOrChange.character ?? this.character
    }

    if (line === this.line && character === this.character) {
      return this
    }
    return new Position(line, character)
  }

  toJSON(): any {
    return { line: this.line, character: this.character }
  }
}

/**
 * A range represents an ordered pair of two positions.
 * It is guaranteed that {@link Range.start start}.isBeforeOrEqual({@link Range.end end})
 *
 * Range objects are __immutable__. Use the {@link Range.with with},
 * {@link Range.intersection intersection}, or {@link Range.union union} methods
 * to derive new ranges from an existing range.
 */
export class Range {
  /**
   * The start position. It is before or equal to {@link Range.end end}.
   */
  readonly start: Position

  /**
   * The end position. It is after or equal to {@link Range.start start}.
   */
  readonly end: Position

  /**
   * Create a new range from two positions. If `start` is not
   * before or equal to `end`, the values will be swapped.
   *
   * @param start A position.
   * @param end A position.
   */
  constructor(start: Position, end: Position)
  /**
   * Create a new range from number coordinates. It is a shorter equivalent of
   * using `new Range(new Position(startLine, startCharacter), new Position(endLine, endCharacter))`
   *
   * @param startLine A zero-based line value.
   * @param startCharacter A zero-based character value.
   * @param endLine A zero-based line value.
   * @param endCharacter A zero-based character value.
   */
  constructor(
    startLine: number,
    startCharacter: number,
    endLine: number,
    endCharacter: number
  )
  constructor(
    startLineOrPos: number | Position,
    startCharacterOrPos: number | Position,
    endLine?: number,
    endCharacter?: number
  ) {
    let start: Position
    let end: Position

    if (
      typeof startLineOrPos === 'number' &&
      typeof startCharacterOrPos === 'number' &&
      typeof endLine === 'number' &&
      typeof endCharacter === 'number'
    ) {
      start = new Position(startLineOrPos, startCharacterOrPos)
      end = new Position(endLine, endCharacter)
    } else if (
      startLineOrPos instanceof Position &&
      startCharacterOrPos instanceof Position
    ) {
      start = startLineOrPos
      end = startCharacterOrPos
    } else {
      // This case should not happen based on constructor overloading
      // But adding a safeguard based on observed runtime errors if misused
      throw new Error('Invalid arguments')
    }

    if (start.isBeforeOrEqual(end)) {
      this.start = start
      this.end = end
    } else {
      this.start = end
      this.end = start
    }
  }

  /**
   * `true` if `start` and `end` are equal.
   */
  get isEmpty(): boolean {
    return this.start.isEqual(this.end)
  }

  /**
   * `true` if `start.line` and `end.line` are equal.
   */
  get isSingleLine(): boolean {
    return this.start.line === this.end.line
  }

  /**
   * Check if a position or a range is contained in this range.
   *
   * @param positionOrRange A position or a range.
   * @returns `true` if the position or range is inside or equal
   * to this range.
   */
  contains(positionOrRange: Position | Range): boolean {
    if (positionOrRange instanceof Range) {
      return (
        this.contains(positionOrRange.start) &&
        this.contains(positionOrRange.end)
      )
    } else if (positionOrRange instanceof Position) {
      if (positionOrRange.isBefore(this.start)) {
        return false
      }
      if (this.end.isBefore(positionOrRange)) {
        return false
      }
      return true
    }
    return false // Should not happen with Position | Range type
  }

  /**
   * Check if `other` equals this range.
   *
   * @param other A range.
   * @returns `true` when start and end are {@link Position.isEqual equal} to
   * start and end of this range.
   */
  isEqual(other: Range): boolean {
    return this.start.isEqual(other.start) && this.end.isEqual(other.end)
  }

  /**
   * Intersect `range` with this range and returns a new range or `undefined`
   * if the ranges have no overlap.
   *
   * @param range A range.
   * @returns A range of the greater start and smaller end positions. Will
   * return undefined when there is no overlap.
   */
  intersection(other: Range): Range | undefined {
    const start = this.start.isAfter(other.start) ? this.start : other.start
    const end = this.end.isBefore(other.end) ? this.end : other.end

    if (start.isAfter(end)) {
      // Non-overlapping
      return undefined
    }
    return new Range(start, end)
  }

  /**
   * Compute the union of `other` with this range.
   *
   * @param other A range.
   * @returns A range of smaller start position and the greater end position.
   */
  union(other: Range): Range {
    const start = this.start.isBefore(other.start) ? this.start : other.start
    const end = this.end.isAfter(other.end) ? this.end : other.end
    return new Range(start, end)
  }

  /**
   * Derived a new range from this range.
   *
   * @param start A position that should be used as start. The default value is the {@link Range.start current start}.
   * @param end A position that should be used as end. The default value is the {@link Range.end current end}.
   * @returns A range derived from this range with the given start and end position.
   * If start and end are not different `this` range will be returned.
   */
  with(start?: Position, end?: Position): Range
  /**
   * Derived a new range from this range.
   *
   * @param change An object that describes a change to this range.
   * @returns A range that reflects the given change. Will return `this` range if the change
   * is not changing anything.
   */
  with(change: { start?: Position; end?: Position }): Range
  with(
    startOrChange?: Position | { start?: Position; end?: Position },
    end: Position = this.end
  ): Range {
    if (startOrChange === null || startOrChange === undefined) {
      return this
    }

    let start: Position
    if (startOrChange instanceof Position) {
      start = startOrChange
    } else {
      start = startOrChange.start ?? this.start
      end = startOrChange.end ?? this.end
    }

    if (start.isEqual(this.start) && end.isEqual(this.end)) {
      return this
    }
    return new Range(start, end)
  }

  toJSON(): any {
    return [this.start, this.end]
  }
}

/**
 * A symbol kind.
 */
enum SymbolKind {
  // Use export enum for direct value access
  File = 0,
  Module = 1,
  Namespace = 2,
  Package = 3,
  Class = 4,
  Method = 5,
  Property = 6,
  Field = 7,
  Constructor = 8,
  Enum = 9,
  Interface = 10,
  Function = 11,
  Variable = 12,
  Constant = 13,
  String = 14,
  Number = 15,
  Boolean = 16,
  Array = 17,
  Object = 18,
  Key = 19,
  Null = 20,
  EnumMember = 21,
  Struct = 22,
  Event = 23,
  Operator = 24,
  TypeParameter = 25,
}

/**
 * Symbol tags are extra annotations that tweak the rendering of a symbol.
 */
enum SymbolTag {
  // Use export enum
  /**
   * Render a symbol as obsolete, usually using a strike-out.
   */
  Deprecated = 1,
}

/**
 * Represents programming constructs like variables, classes, interfaces etc. that appear in a document. Document
 * symbols can be hierarchical and they have two ranges: one that encloses its definition and one that points to
 * its most interesting range, e.g. the range of an identifier.
 */
export class DocumentSymbol {
  /**
   * The name of this symbol.
   */
  name: string

  /**
   * More detail for this symbol, e.g. the signature of a function.
   */
  detail: string

  /**
   * The kind of this symbol.
   */
  kind: SymbolKind

  /**
   * Tags for this symbol.
   */
  tags?: readonly SymbolTag[] // Keep as readonly based on API

  /**
   * The range enclosing this symbol not including leading/trailing whitespace but everything else, e.g. comments and code.
   */
  range: Range

  /**
   * The range that should be selected and reveal when this symbol is being picked, e.g. the name of a function.
   * Must be contained by the {@linkcode DocumentSymbol.range range}.
   */
  selectionRange: Range

  /**
   * Children of this symbol, e.g. properties of a class.
   */
  children: DocumentSymbol[] // Keep as mutable array based on API

  /**
   * Creates a new document symbol.
   *
   * @param name The name of the symbol.
   * @param detail Details for the symbol.
   * @param kind The kind of the symbol.
   * @param range The full range of the symbol.
   * @param selectionRange The range that should be reveal.
   */
  constructor(
    name: string,
    detail: string,
    kind: SymbolKind,
    range: Range,
    selectionRange: Range
  ) {
    this.name = name
    this.detail = detail
    this.kind = kind
    this.range = range
    this.selectionRange = selectionRange
    this.children = [] // Initialize as empty array
  }

  toJSON(): any {
    // Simple JSON representation, might differ from internal VS Code marshalling
    return {
      name: this.name,
      detail: this.detail,
      kind: this.kind,
      tags: this.tags,
      range: this.range,
      selectionRange: this.selectionRange,
      children: this.children,
    }
  }
}
