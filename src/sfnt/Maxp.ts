import { defineColumn } from '../utils'
import { defineSfntTable } from './Sfnt'
import { SfntTable } from './SfntTable'

declare module './Sfnt' {
  interface Sfnt {
    maxp: Maxp
  }
}

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6maxp.html
 */
@defineSfntTable('maxp')
export class Maxp extends SfntTable {
  @defineColumn({ type: 'fixed' }) declare version: number
  @defineColumn({ type: 'uint16' }) declare numGlyphs: number
  @defineColumn({ type: 'uint16' }) declare maxPoints: number
  @defineColumn({ type: 'uint16' }) declare maxContours: number
  @defineColumn({ type: 'uint16' }) declare maxComponentPoints: number
  @defineColumn({ type: 'uint16' }) declare maxComponentContours: number
  @defineColumn({ type: 'uint16' }) declare maxZones: number
  @defineColumn({ type: 'uint16' }) declare maxTwilightPoints: number
  @defineColumn({ type: 'uint16' }) declare maxStorage: number
  @defineColumn({ type: 'uint16' }) declare maxFunctionDefs: number
  @defineColumn({ type: 'uint16' }) declare maxInstructionDefs: number
  @defineColumn({ type: 'uint16' }) declare maxStackElements: number
  @defineColumn({ type: 'uint16' }) declare maxSizeOfInstructions: number
  @defineColumn({ type: 'uint16' }) declare maxComponentElements: number
  @defineColumn({ type: 'uint16' }) declare maxComponentDepth: number

  constructor(buffer: BufferSource = new ArrayBuffer(32), byteOffset?: number) {
    super(buffer, byteOffset, 32)
  }
}
