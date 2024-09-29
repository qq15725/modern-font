import { defineProp } from '../utils'
import { Sfnt } from './Sfnt'
import { SfntTable } from './SfntTable'

declare module './Sfnt' {
  interface Sfnt {
    maxp: Maxp
  }
}

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6maxp.html
 */
@Sfnt.table('maxp')
export class Maxp extends SfntTable {
  @defineProp({ type: 'fixed' }) declare version: number
  @defineProp({ type: 'uint16' }) declare numGlyphs: number
  @defineProp({ type: 'uint16' }) declare maxPoints: number
  @defineProp({ type: 'uint16' }) declare maxContours: number
  @defineProp({ type: 'uint16' }) declare maxComponentPoints: number
  @defineProp({ type: 'uint16' }) declare maxComponentContours: number
  @defineProp({ type: 'uint16' }) declare maxZones: number
  @defineProp({ type: 'uint16' }) declare maxTwilightPoints: number
  @defineProp({ type: 'uint16' }) declare maxStorage: number
  @defineProp({ type: 'uint16' }) declare maxFunctionDefs: number
  @defineProp({ type: 'uint16' }) declare maxInstructionDefs: number
  @defineProp({ type: 'uint16' }) declare maxStackElements: number
  @defineProp({ type: 'uint16' }) declare maxSizeOfInstructions: number
  @defineProp({ type: 'uint16' }) declare maxComponentElements: number
  @defineProp({ type: 'uint16' }) declare maxComponentDepth: number

  constructor(buffer: BufferSource = new ArrayBuffer(32), byteOffset?: number) {
    super(buffer, byteOffset, 32)
  }
}
