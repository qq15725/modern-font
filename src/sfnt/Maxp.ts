import { defineColumn } from '../core'
import { defineSFNTTable } from './SFNT'
import { SFNTTable } from './SFNTTable'

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6maxp.html
 */
@defineSFNTTable('maxp')
export class Maxp extends SFNTTable {
  @defineColumn('fixed') declare version: number
  @defineColumn('uint16') declare numGlyphs: number
  @defineColumn('uint16') declare maxPoints: number
  @defineColumn('uint16') declare maxContours: number
  @defineColumn('uint16') declare maxComponentPoints: number
  @defineColumn('uint16') declare maxComponentContours: number
  @defineColumn('uint16') declare maxZones: number
  @defineColumn('uint16') declare maxTwilightPoints: number
  @defineColumn('uint16') declare maxStorage: number
  @defineColumn('uint16') declare maxFunctionDefs: number
  @defineColumn('uint16') declare maxInstructionDefs: number
  @defineColumn('uint16') declare maxStackElements: number
  @defineColumn('uint16') declare maxSizeOfInstructions: number
  @defineColumn('uint16') declare maxComponentElements: number
  @defineColumn('uint16') declare maxComponentDepth: number

  constructor(buffer: BufferSource = new ArrayBuffer(32), byteOffset?: number) {
    super(buffer, byteOffset, Math.min(32, buffer.byteLength - (byteOffset ?? 0)))
  }
}
